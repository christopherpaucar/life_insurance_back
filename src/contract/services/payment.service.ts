import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { Contract, ContractStatus } from '../entities/contract.entity'
import { PaymentFrequency } from '../../insurance/entities/insurance-price.entity'
import { addMonths, addYears } from 'date-fns'
import { Transaction, TransactionStatus } from '../entities/transaction.entity'
import { PaymentMethod } from '../entities/payment-method.entity'
import { DateUtils } from '../../common/utils/date.utils'
import { User } from '../../auth/entities/user.entity'
import { RoleType } from '../../auth/entities/role.entity'

@Injectable()
export class PaymentService {
  private readonly MAX_RETRY_COUNT = 4
  private readonly RETRY_INTERVAL_DAYS = 4

  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async generatePaymentSchedule(contract: Contract): Promise<Transaction[]> {
    const transactions: Transaction[] = []

    const startDate = contract.startDate
    const endDate = contract.endDate
    const frequency = contract.paymentFrequency

    let numberOfPayments: number

    switch (frequency) {
      case PaymentFrequency.MONTHLY:
        numberOfPayments = DateUtils.monthsBetween(startDate, endDate)
        break
      case PaymentFrequency.QUARTERLY:
        numberOfPayments = Math.ceil(DateUtils.monthsBetween(startDate, endDate) / 3)
        break
      case PaymentFrequency.YEARLY:
        numberOfPayments = Math.ceil(DateUtils.monthsBetween(startDate, endDate) / 12)
        break
      default:
        numberOfPayments = 1
    }

    const installmentAmount = Math.round((contract.totalAmount / numberOfPayments) * 100) / 100

    for (let i = 0; i < numberOfPayments; i++) {
      let dueDate = startDate

      if (i > 0) {
        switch (frequency) {
          case PaymentFrequency.MONTHLY:
            dueDate = addMonths(startDate, i)
            break
          case PaymentFrequency.QUARTERLY:
            dueDate = addMonths(startDate, i * 3)
            break
          case PaymentFrequency.YEARLY:
            dueDate = addYears(startDate, i)
            break
        }
      }

      const transaction = this.transactionRepository.create({
        amount:
          i === numberOfPayments - 1
            ? contract.totalAmount - installmentAmount * (numberOfPayments - 1)
            : installmentAmount,
        status: TransactionStatus.PENDING,
        nextPaymentDate: dueDate,
        contract,
      })

      transactions.push(transaction)
    }

    await this.transactionRepository.save(transactions)
    return transactions
  }

  async recordPayment(
    paymentId: string,
    paymentData: {
      status: TransactionStatus
      notes?: string
    },
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: paymentId },
      relations: ['contract', 'contract.paymentMethod'],
    })

    if (!transaction) {
      throw new Error(`Transaction with ID ${paymentId} not found`)
    }

    transaction.status = paymentData.status

    if (transaction.status === TransactionStatus.SUCCESS) {
      transaction.status = TransactionStatus.SUCCESS
    }

    return await this.transactionRepository.save(transaction)
  }

  async deletePaymentsForContract(contractId: string): Promise<void> {
    await this.transactionRepository.delete({ contract: { id: contractId } })
  }

  async findOverduePayments(): Promise<Transaction[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return this.transactionRepository.find({
      where: {
        status: TransactionStatus.PENDING,
        nextPaymentDate: LessThan(today),
      },
      relations: ['contract', 'contract.user'],
    })
  }

  async updateOverduePayments(): Promise<void> {
    const overduePayments = await this.findOverduePayments()

    for (const transaction of overduePayments) {
      transaction.status = TransactionStatus.FAILED
      await this.transactionRepository.save(transaction)
    }
  }

  async processDunning(date: string) {
    const startDate = new Date(date)
    startDate.setUTCHours(0, 0, 0, 0)

    const endDate = new Date(date)
    endDate.setUTCHours(23, 59, 59, 999)

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.contract', 'contract')
      .leftJoinAndSelect('contract.paymentMethod', 'paymentMethod')
      .where(
        '(transaction.status = :pendingStatus AND DATE(transaction.nextPaymentDate) = DATE(:startDate)) OR ' +
          '(transaction.status = :failedStatus AND transaction.retryCount < :maxRetryCount AND DATE(transaction.nextRetryPaymentDate) = DATE(:startDate))',
        {
          pendingStatus: TransactionStatus.PENDING,
          failedStatus: TransactionStatus.FAILED,
          maxRetryCount: this.MAX_RETRY_COUNT,
          startDate: startDate.toISOString(),
        },
      )

    const pendingTransactions = await queryBuilder.getMany()

    const summary = {
      total: pendingTransactions.length,
      processed: 0,
      failed: 0,
      success: 0,
      pending: pendingTransactions.length,
    }

    for (const transaction of pendingTransactions) {
      await this.processTransaction(transaction)
      summary.processed++
      summary.pending--

      if (transaction.status === TransactionStatus.SUCCESS) {
        summary.success++
      } else {
        summary.failed++
      }
    }

    return summary
  }

  private async processTransaction(transaction: Transaction) {
    const contract = transaction.contract
    const paymentMethod = contract.paymentMethod

    if (!paymentMethod?.isValid) {
      await this.handleFailedPayment(transaction)
      return
    }

    const randomDecline = Math.random() < 0.5

    if (randomDecline) {
      await this.handleFailedPayment(transaction)
      return
    }

    try {
      await this.handleSuccessfulPayment(transaction)
    } catch (error) {
      console.error('Error processing transaction:', error)
      await this.handleFailedPayment(transaction)
    }
  }

  async downgradeContracts(date: string) {
    const today = new Date(date)
    today.setUTCHours(23, 59, 59, 999)

    const contractsWithFailedPayments = await this.transactionRepository.find({
      where: {
        retryCount: this.MAX_RETRY_COUNT,
        contract: { retireDate: LessThan(today) },
        status: TransactionStatus.FAILED,
      },
      relations: ['contract'],
    })

    const downgradedContracts: { contractNumber: string; totalAmount: number; downgradedAt: Date }[] = []

    for (const transaction of contractsWithFailedPayments) {
      transaction.contract.status = ContractStatus.INACTIVE
      await this.contractRepository.save(transaction.contract)
      downgradedContracts.push({
        contractNumber: transaction.contract.contractNumber,
        totalAmount: transaction.contract.totalAmount,
        downgradedAt: new Date(),
      })
    }

    return {
      totalDowngraded: downgradedContracts.length,
      contracts: downgradedContracts,
    }
  }

  private async handleSuccessfulPayment(transaction: Transaction) {
    transaction.status = TransactionStatus.SUCCESS
    await this.transactionRepository.save(transaction)
  }

  private async handleFailedPayment(transaction: Transaction) {
    transaction.retryCount += 1
    transaction.status = TransactionStatus.FAILED

    if (transaction.retryCount >= this.MAX_RETRY_COUNT) {
      await this.deactivateContract(transaction.contract)
    } else {
      transaction.nextRetryPaymentDate = this.calculateNextRetryDate()
    }

    if (transaction.retryCount === 1) {
      transaction.contract.retireDate = this.calculateRetireDate(transaction.retryCount)
      await this.contractRepository.save(transaction.contract)
    }

    await this.transactionRepository.save(transaction)
  }

  private async deactivateContract(contract: Contract) {
    contract.status = ContractStatus.INACTIVE
    await this.contractRepository.save(contract)
  }

  private calculateRetireDate(retryCount: number): Date {
    const date = new Date()
    date.setDate(date.getDate() + retryCount * this.RETRY_INTERVAL_DAYS)
    return date
  }

  private calculateNextRetryDate(): Date {
    const date = new Date()
    date.setDate(date.getDate() + this.RETRY_INTERVAL_DAYS)
    return date
  }

  async getPaymentHistory(
    query: any,
    user: User,
  ): Promise<{ transactions: Transaction[]; total: number; page: number; limit: number }> {
    const page = query.page ? parseInt(query.page as string, 10) : 1
    const limit = query.limit ? parseInt(query.limit as string, 10) : 10
    const skip = (page - 1) * limit

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.contract', 'contract')
      .leftJoinAndSelect('contract.user', 'user')
      .orderBy('transaction.createdAt', 'DESC')
      .skip(skip)
      .take(limit)

    if (user.role.name === RoleType.CLIENT) {
      queryBuilder.andWhere('user.id = :userId', { userId: user.id })
    }

    if (query.status) {
      queryBuilder.andWhere('transaction.status = :status', { status: query.status })
    }

    if (query.startDate && query.endDate) {
      queryBuilder.andWhere('transaction.createdAt BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate,
      })
    }

    if (query.contractId) {
      queryBuilder.andWhere('contract.id = :contractId', { contractId: query.contractId })
    }

    const [transactions, total] = await queryBuilder.getManyAndCount()

    return { transactions, total, page, limit }
  }
}
