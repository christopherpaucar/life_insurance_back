import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InsuranceController } from '../../src/insurance/controllers/insurance.controller'
import { InsuranceService } from '../../src/insurance/services/insurance.service'
import { CreateInsuranceDto } from '../../src/insurance/dto/create-insurance.dto'
import { UpdateInsuranceDto } from '../../src/insurance/dto/update-insurance.dto'
import { Insurance, InsuranceType, PaymentFrequency } from '../../src/insurance/entities/insurance.entity'
import { validate } from 'class-validator'
import { ApiResponseDto } from '../../src/common/dto/api-response.dto'
import { NotFoundException } from '@nestjs/common'
import { PaginatedResponse } from '../../src/common/interfaces/pagination.interface'

describe('InsuranceController', () => {
  let insuranceController: InsuranceController
  let insuranceService: InsuranceService

  beforeEach(() => {
    insuranceService = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    } as unknown as InsuranceService

    insuranceController = new InsuranceController(insuranceService)
  })

  describe('create', () => {
    it('should validate create insurance input data', async () => {
      const createInsuranceDto = new CreateInsuranceDto()
      createInsuranceDto.name = 'Test Insurance'
      createInsuranceDto.description = 'Test Description'
      createInsuranceDto.type = InsuranceType.LIFE
      createInsuranceDto.basePrice = 100
      createInsuranceDto.requirements = ['ID', 'Medical Check']
      createInsuranceDto.availablePaymentFrequencies = [PaymentFrequency.MONTHLY]

      const errors = await validate(createInsuranceDto)

      if (errors.length > 0) {
        console.log('Validation errors:', JSON.stringify(errors, null, 2))
      }

      expect(errors).toHaveLength(0)
    })

    it('should return correct response structure on creation', async () => {
      const createInsuranceDto: CreateInsuranceDto = {
        name: 'Test Insurance',
        description: 'Test Description',
        type: InsuranceType.LIFE,
        basePrice: 100,
        requirements: ['ID', 'Medical Check'],
        availablePaymentFrequencies: [PaymentFrequency.MONTHLY],
        rank: 1,
      }

      const mockInsurance = {
        id: '1',
        name: 'Test Insurance',
        description: 'Test Description',
        type: InsuranceType.LIFE,
        basePrice: 100,
        isActive: true,
        requirements: ['ID', 'Medical Check'],
        availablePaymentFrequencies: [PaymentFrequency.MONTHLY],
        coverages: [],
        benefits: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.spyOn(insuranceService, 'create').mockResolvedValue(mockInsurance as unknown as Insurance)

      const result = await insuranceController.create(createInsuranceDto)

      expect(result).toBeInstanceOf(ApiResponseDto)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockInsurance)
      expect(insuranceService.create).toHaveBeenCalledWith(createInsuranceDto)
    })
  })

  describe('findAll', () => {
    it('should return paginated list of insurances', async () => {
      const mockInsurances = [
        {
          id: '1',
          name: 'Insurance 1',
          description: 'Description 1',
          type: InsuranceType.LIFE,
          basePrice: 100,
          isActive: true,
          requirements: [],
          availablePaymentFrequencies: [PaymentFrequency.MONTHLY],
          coverages: [],
          benefits: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Insurance 2',
          description: 'Description 2',
          type: InsuranceType.HEALTH,
          basePrice: 200,
          isActive: true,
          requirements: [],
          availablePaymentFrequencies: [PaymentFrequency.YEARLY],
          coverages: [],
          benefits: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const mockPaginatedResponse: PaginatedResponse<Insurance> = {
        data: mockInsurances as unknown as Insurance[],
        meta: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      }

      vi.spyOn(insuranceService, 'findAll').mockResolvedValue(mockPaginatedResponse)

      const query = { page: '1', limit: '10' }
      const result = await insuranceController.findAll(query)

      expect(result).toBeInstanceOf(ApiResponseDto)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockInsurances)
      expect(result.meta).toEqual(mockPaginatedResponse.meta)
      expect(insuranceService.findAll).toHaveBeenCalledWith(query)
    })
  })

  describe('findOne', () => {
    it('should return a single insurance by id', async () => {
      const mockInsurance = {
        id: '1',
        name: 'Test Insurance',
        description: 'Test Description',
        type: InsuranceType.LIFE,
        basePrice: 100,
        isActive: true,
        requirements: [],
        availablePaymentFrequencies: [PaymentFrequency.MONTHLY],
        coverages: [],
        benefits: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.spyOn(insuranceService, 'findOne').mockResolvedValue(mockInsurance as unknown as Insurance)

      const result = await insuranceController.findOne('1')

      expect(result).toBeInstanceOf(ApiResponseDto)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockInsurance)
      expect(insuranceService.findOne).toHaveBeenCalledWith('1')
    })

    it('should handle not found exception', async () => {
      vi.spyOn(insuranceService, 'findOne').mockRejectedValue(new NotFoundException('Insurance not found'))

      await expect(insuranceController.findOne('999')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should validate update insurance input data', async () => {
      const updateInsuranceDto = new UpdateInsuranceDto()
      updateInsuranceDto.name = 'Updated Insurance'
      updateInsuranceDto.basePrice = 150

      const errors = await validate(updateInsuranceDto)

      if (errors.length > 0) {
        console.log('Validation errors:', JSON.stringify(errors, null, 2))
      }

      expect(errors).toHaveLength(0)
    })

    it('should update an insurance and return correct response', async () => {
      const updateInsuranceDto: UpdateInsuranceDto = {
        name: 'Updated Insurance',
        basePrice: 150,
      }

      const mockUpdatedInsurance = {
        id: '1',
        name: 'Updated Insurance',
        description: 'Original Description',
        type: InsuranceType.LIFE,
        basePrice: 150,
        isActive: true,
        requirements: [],
        availablePaymentFrequencies: [PaymentFrequency.MONTHLY],
        coverages: [],
        benefits: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.spyOn(insuranceService, 'update').mockResolvedValue(mockUpdatedInsurance as unknown as Insurance)

      const result = await insuranceController.update('1', updateInsuranceDto)

      expect(result).toBeInstanceOf(ApiResponseDto)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUpdatedInsurance)
      expect(insuranceService.update).toHaveBeenCalledWith('1', updateInsuranceDto)
    })
  })

  describe('remove', () => {
    it('should remove an insurance and return success response', async () => {
      vi.spyOn(insuranceService, 'remove').mockResolvedValue(undefined)

      const result = await insuranceController.remove('1')

      expect(result).toBeInstanceOf(ApiResponseDto)
      expect(result.success).toBe(true)
      expect(insuranceService.remove).toHaveBeenCalledWith('1')
    })
  })
})
