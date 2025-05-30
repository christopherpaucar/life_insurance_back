import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PaymentMethodService } from '../../src/contract/services/payment-method.service'
import { PaymentMethod, PaymentMethodType } from '../../src/contract/entities/payment-method.entity'
import { Repository } from 'typeorm'
import { CreatePaymentMethodDto } from '../../src/contract/dto/create-payment-method.dto'
import { UpdatePaymentMethodDto } from '../../src/contract/dto/update-payment-method.dto'
import { NotFoundException } from '@nestjs/common'
import { User } from '../../src/auth/entities/user.entity'

describe('PaymentMethodService', () => {
  let service: PaymentMethodService
  let paymentMethodRepository: Repository<PaymentMethod>

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed_password',
    role: { name: 'CLIENT' },
    roles: [{ name: 'CLIENT' }],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as unknown as User

  const mockPaymentMethod = {
    id: '1',
    type: PaymentMethodType.CREDIT_CARD,
    details: JSON.stringify({
      cardNumber: '4111111111111111',
      expiryDate: '12/25',
      cvv: '123',
    }),
    user: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as unknown as PaymentMethod

  beforeEach(() => {
    vi.clearAllMocks()

    paymentMethodRepository = {
      create: vi.fn().mockReturnValue(mockPaymentMethod),
      save: vi.fn().mockResolvedValue(mockPaymentMethod),
      findOne: vi.fn().mockResolvedValue(mockPaymentMethod),
      find: vi.fn().mockResolvedValue([mockPaymentMethod]),
      remove: vi.fn(),
    } as unknown as Repository<PaymentMethod>

    service = new PaymentMethodService(paymentMethodRepository)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a new payment method', async () => {
      const createPaymentMethodDto: CreatePaymentMethodDto = {
        type: PaymentMethodType.CREDIT_CARD,
        details: JSON.stringify({
          cardNumber: '4111111111111111',
          expiryDate: '12/25',
          cvv: '123',
        }),
      }

      const result = await service.create(createPaymentMethodDto, mockUser)

      expect(result).toBeDefined()
      expect(result.type).toBe(PaymentMethodType.CREDIT_CARD)
      expect(result.user).toBeDefined()
      expect(result.user.id).toBe(mockUser.id)
    })
  })

  describe('findAll', () => {
    it('should return all payment methods for a user', async () => {
      const result = await service.findAll(mockUser)

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(mockPaymentMethod.id)
    })
  })

  describe('findOne', () => {
    it('should return a payment method by id', async () => {
      const result = await service.findOne('1', mockUser)

      expect(result).toBeDefined()
      expect(result.id).toBe('1')
    })

    it('should throw NotFoundException when payment method not found', async () => {
      vi.spyOn(paymentMethodRepository, 'findOne').mockResolvedValueOnce(null)

      await expect(service.findOne('999', mockUser)).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update payment method details', async () => {
      const updatePaymentMethodDto: UpdatePaymentMethodDto = {
        details: JSON.stringify({
          cardNumber: '4111111111111111',
          expiryDate: '12/26',
          cvv: '123',
        }),
      }

      const result = await service.update('1', updatePaymentMethodDto, mockUser)

      expect(result).toBeDefined()
      expect(result.details).toBe(updatePaymentMethodDto.details)
    })

    it('should throw NotFoundException when updating non-existent payment method', async () => {
      vi.spyOn(paymentMethodRepository, 'findOne').mockResolvedValueOnce(null)

      const updatePaymentMethodDto: UpdatePaymentMethodDto = {
        details: JSON.stringify({
          cardNumber: '4111111111111111',
          expiryDate: '12/26',
          cvv: '123',
        }),
      }

      await expect(service.update('999', updatePaymentMethodDto, mockUser)).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('should remove a payment method', async () => {
      await service.remove('1', mockUser)

      expect(paymentMethodRepository.remove).toHaveBeenCalledWith(mockPaymentMethod)
    })

    it('should throw NotFoundException when removing non-existent payment method', async () => {
      vi.spyOn(paymentMethodRepository, 'findOne').mockResolvedValueOnce(null)

      await expect(service.remove('999', mockUser)).rejects.toThrow(NotFoundException)
    })
  })
})
