import { describe, it, expect, beforeEach } from 'vitest'
import { PaymentService } from '../../src/contract/services/payment.service'
import { Repository } from 'typeorm'
import { Contract, ContractStatus } from '../../src/contract/entities/contract.entity'
import { Transaction, TransactionStatus } from '../../src/contract/entities/transaction.entity'
import { PaymentMethod } from '../../src/contract/entities/payment-method.entity'
import { PaymentFrequency } from '../../src/insurance/entities/insurance-price.entity'
import { BaseRepositoryMock } from '../mocks/base.repository.mock'

describe('PaymentService', () => {
  let paymentService: PaymentService
  let contractRepository: BaseRepositoryMock<Contract>
  let transactionRepository: BaseRepositoryMock<Transaction>
  let paymentMethodRepository: BaseRepositoryMock<PaymentMethod>

  beforeEach(() => {
    contractRepository = new BaseRepositoryMock<Contract>()
    transactionRepository = new BaseRepositoryMock<Transaction>()
    paymentMethodRepository = new BaseRepositoryMock<PaymentMethod>()

    const mockManager = {
      save: (entity: any) => {
        if (Array.isArray(entity)) {
          return Promise.resolve(entity.map((e) => ({ ...e, id: '1' })))
        }
        return Promise.resolve({ ...entity, id: '1' })
      },
      find: () => Promise.resolve([]),
      findOne: () => Promise.resolve(null),
      create: (entity: any, data: any) => ({ ...data, id: '1' }),
      delete: () => Promise.resolve(),
      transaction: async (callback: (manager: any) => Promise<any>) => {
        return callback(mockManager)
      },
    }

    contractRepository.manager = mockManager
    transactionRepository.manager = mockManager
    paymentMethodRepository.manager = mockManager

    paymentService = new PaymentService(
      contractRepository as unknown as Repository<Contract>,
      transactionRepository as unknown as Repository<Transaction>,
      paymentMethodRepository as unknown as Repository<PaymentMethod>,
    )
  })

  describe('generatePaymentSchedule', () => {
    it.only('should generate monthly payment schedule', async () => {
      const contract = {
        id: '1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        paymentFrequency: PaymentFrequency.MONTHLY,
        totalAmount: 1200,
      } as Contract

      const transactions = await paymentService.generatePaymentSchedule(contract)

      expect(transactions).toHaveLength(12)
      expect(transactions[0].amount).toBe(100)
      expect(transactions[0].status).toBe(TransactionStatus.PENDING)
    })

    it('should generate quarterly payment schedule', async () => {
      const contract = {
        id: '1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        paymentFrequency: PaymentFrequency.QUARTERLY,
        totalAmount: 1200,
      } as Contract

      const transactions = await paymentService.generatePaymentSchedule(contract)

      expect(transactions).toHaveLength(4)
      expect(transactions[0].amount).toBe(300)
      expect(transactions[0].status).toBe(TransactionStatus.PENDING)
    })

    it('should generate yearly payment schedule', async () => {
      const contract = {
        id: '1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        paymentFrequency: PaymentFrequency.YEARLY,
        totalAmount: 1200,
      } as Contract

      const transactions = await paymentService.generatePaymentSchedule(contract)

      expect(transactions).toHaveLength(1)
      expect(transactions[0].amount).toBe(1200)
      expect(transactions[0].status).toBe(TransactionStatus.PENDING)
    })
  })

  describe('recordPayment', () => {
    it('should record successful payment', async () => {
      const transaction = {
        id: '1',
        status: TransactionStatus.PENDING,
        contract: { id: '1' },
      } as Transaction

      transactionRepository.items = [transaction]

      const result = await paymentService.recordPayment('1', {
        status: TransactionStatus.SUCCESS,
      })

      expect(result.status).toBe(TransactionStatus.SUCCESS)
    })

    it('should throw error when transaction not found', async () => {
      await expect(paymentService.recordPayment('999', { status: TransactionStatus.SUCCESS })).rejects.toThrow(
        'Transaction with ID 999 not found',
      )
    })
  })

  describe('findOverduePayments', () => {
    it('should find overdue payments', async () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const overdueTransaction = {
        id: '1',
        status: TransactionStatus.PENDING,
        nextPaymentDate: yesterday,
        contract: { id: '1', user: { id: '1' } },
      } as Transaction

      transactionRepository.items = [overdueTransaction]

      const result = await paymentService.findOverduePayments()

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })
  })

  describe('processDunning', () => {
    it('should process pending transactions', async () => {
      const transaction = {
        id: '1',
        status: TransactionStatus.PENDING,
        retryCount: 0,
        contract: {
          id: '1',
          paymentMethod: { isValid: true },
        },
      } as Transaction

      transactionRepository.items = [transaction]

      await paymentService.processDunning()

      expect(transaction.status).toBe(TransactionStatus.SUCCESS)
    })

    it('should handle failed payment with valid retry count', async () => {
      const transaction = {
        id: '1',
        status: TransactionStatus.FAILED,
        retryCount: 2,
        contract: {
          id: '1',
          paymentMethod: { isValid: false },
        },
      } as Transaction

      transactionRepository.items = [transaction]

      await paymentService.processDunning()

      expect(transaction.status).toBe(TransactionStatus.IN_RETRY)
      expect(transaction.retryCount).toBe(3)
    })

    it('should deactivate contract after max retries', async () => {
      const contract = {
        id: '1',
        status: ContractStatus.ACTIVE,
      } as Contract

      const transaction = {
        id: '1',
        status: TransactionStatus.FAILED,
        retryCount: 4,
        contract,
      } as Transaction

      transactionRepository.items = [transaction]
      contractRepository.items = [contract]

      await paymentService.processDunning()

      expect(contract.status).toBe(ContractStatus.INACTIVE)
    })
  })
})
