import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan, LessThanOrEqual } from 'typeorm'
import { Contract, ContractStatus } from '../entities/contract.entity'
import { PaymentFrequency } from '../../insurance/entities/insurance-price.entity'
import { addMonths, addYears } from 'date-fns'
import { Transaction, TransactionStatus } from '../entities/transaction.entity'
import { PaymentMethod } from '../entities/payment-method.entity'
import { DateUtils } from '../../common/utils/date.utils'

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
      let dueDate = new Date(startDate)

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

  async processDunning() {
    const pendingTransactions = await this.transactionRepository.find({
      where: [
        { status: TransactionStatus.PENDING },
        { status: TransactionStatus.FAILED, retryCount: LessThanOrEqual(this.MAX_RETRY_COUNT) },
      ],
      relations: ['contract', 'contract.paymentMethod'],
    })

    for (const transaction of pendingTransactions) {
      await this.processTransaction(transaction)
    }
  }

  private async processTransaction(transaction: Transaction) {
    const contract = transaction.contract
    const paymentMethod = contract.paymentMethod

    if (!paymentMethod?.isValid) {
      await this.handleFailedPayment(transaction)
      return
    }

    try {
      await this.processPayment(transaction)
      await this.handleSuccessfulPayment(transaction)
    } catch (error) {
      console.error('Error processing transaction:', error)
      await this.handleFailedPayment(transaction)
    }
  }

  private async processPayment(transaction: Transaction) {
    return Promise.resolve()
  }

  private async handleSuccessfulPayment(transaction: Transaction) {
    transaction.status = TransactionStatus.SUCCESS
    transaction.nextPaymentDate = this.calculateNextPaymentDate(transaction.contract)
    await this.transactionRepository.save(transaction)
  }

  private async handleFailedPayment(transaction: Transaction) {
    transaction.retryCount += 1
    transaction.status = TransactionStatus.FAILED

    if (transaction.retryCount >= this.MAX_RETRY_COUNT) {
      await this.deactivateContract(transaction.contract)
    } else {
      transaction.nextRetryPaymentDate = this.calculateNextRetryDate()
      transaction.status = TransactionStatus.IN_RETRY
    }

    await this.transactionRepository.save(transaction)
  }

  private async deactivateContract(contract: Contract) {
    contract.status = ContractStatus.INACTIVE
    await this.contractRepository.save(contract)
  }

  private calculateNextPaymentDate(contract: Contract): Date {
    const date = new Date()
    switch (contract.paymentFrequency) {
      case PaymentFrequency.MONTHLY:
        date.setMonth(date.getMonth() + 1)
        break
      case PaymentFrequency.QUARTERLY:
        date.setMonth(date.getMonth() + 3)
        break
      case PaymentFrequency.YEARLY:
        date.setFullYear(date.getFullYear() + 1)
        break
    }
    return date
  }

  private calculateNextRetryDate(): Date {
    const date = new Date()
    date.setDate(date.getDate() + this.RETRY_INTERVAL_DAYS)
    return date
  }
}
