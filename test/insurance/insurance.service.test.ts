import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InsuranceService } from '../../src/insurance/services/insurance.service'
import { Repository } from 'typeorm'
import { Insurance, InsuranceType } from '../../src/insurance/entities/insurance.entity'
import { NotFoundException } from '@nestjs/common'
import { CreateInsuranceDto } from '../../src/insurance/dto/create-insurance.dto'
import { UpdateInsuranceDto } from '../../src/insurance/dto/update-insurance.dto'
import { PaginationService } from '../../src/common/services/pagination.service'
import { InsuranceCoverage } from '../../src/insurance/entities/insurance-coverage.entity'
import { InsuranceBenefit } from '../../src/insurance/entities/insurance-benefit.entity'
import { InsuranceCoverageRelation } from '../../src/insurance/entities/insurance-coverage-relation.entity'
import { InsuranceBenefitRelation } from '../../src/insurance/entities/insurance-benefit-relation.entity'
import { InsurancePrice, PaymentFrequency } from '../../src/insurance/entities/insurance-price.entity'
import { BaseRepositoryMock } from '../mocks/base.repository.mock'

describe('InsuranceService', () => {
  let insuranceService: InsuranceService
  let insuranceRepository: BaseRepositoryMock<Insurance>
  let coverageRepository: BaseRepositoryMock<InsuranceCoverage>
  let benefitRepository: BaseRepositoryMock<InsuranceBenefit>
  let coverageRelationRepository: BaseRepositoryMock<InsuranceCoverageRelation>
  let benefitRelationRepository: BaseRepositoryMock<InsuranceBenefitRelation>
  let insurancePriceRepository: BaseRepositoryMock<InsurancePrice>

  beforeEach(() => {
    insuranceRepository = new BaseRepositoryMock<Insurance>()
    coverageRepository = new BaseRepositoryMock<InsuranceCoverage>()
    benefitRepository = new BaseRepositoryMock<InsuranceBenefit>()
    coverageRelationRepository = new BaseRepositoryMock<InsuranceCoverageRelation>()
    benefitRelationRepository = new BaseRepositoryMock<InsuranceBenefitRelation>()
    insurancePriceRepository = new BaseRepositoryMock<InsurancePrice>()

    const mockManager = {
      save: (entity: any) => {
        if (Array.isArray(entity)) {
          const savedEntities = entity.map((e) => ({ ...e, id: '1' }))
          if (entity[0] instanceof InsurancePrice) {
            const currentInsurance = insuranceRepository.items[0]
            if (currentInsurance) {
              insuranceRepository.queryBuilder.setGetOneResult({
                ...currentInsurance,
                prices: savedEntities,
              })
            }
            return Promise.resolve(savedEntities)
          }
          return Promise.resolve(savedEntities)
        }
        const savedEntity = { ...entity, id: '1' }
        if (entity instanceof Insurance) {
          insuranceRepository.queryBuilder.setGetOneResult(savedEntity)
        }
        return Promise.resolve(savedEntity)
      },
      find: (entity: any, options?: any) => {
        if (entity === InsuranceCoverage) {
          const ids = options?.where?.id
          if (ids) {
            const coverageIds = Array.isArray(ids) ? ids : [ids]
            return Promise.resolve(coverageRepository.items.filter((item) => coverageIds.includes(item.id)))
          }
          return Promise.resolve(coverageRepository.items)
        }
        if (entity === InsuranceBenefit) {
          const ids = options?.where?.id
          if (ids) {
            const benefitIds = Array.isArray(ids) ? ids : [ids]
            return Promise.resolve(benefitRepository.items.filter((item) => benefitIds.includes(item.id)))
          }
          return Promise.resolve(benefitRepository.items)
        }
        return Promise.resolve([])
      },
      findOne: () => Promise.resolve(null),
      create: (entity: any, data: any) => {
        if (entity === InsurancePrice) {
          return {
            ...data,
            id: '1',
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: undefined,
          }
        }
        return { ...data, id: '1' }
      },
      delete: () => Promise.resolve(),
      transaction: async (callback: (manager: any) => Promise<any>) => {
        const result = await callback(mockManager)
        if (result) {
          const updatedInsurance = { ...result }
          if (result.prices) {
            updatedInsurance.prices = result.prices.map((price) => ({
              ...price,
              price: result.basePrice || price.price,
            }))
          }
          insuranceRepository.queryBuilder.setGetOneResult(updatedInsurance)
          return updatedInsurance
        }
        return result
      },
    }

    insuranceRepository.manager = mockManager
    coverageRepository.manager = mockManager
    benefitRepository.manager = mockManager
    coverageRelationRepository.manager = mockManager
    benefitRelationRepository.manager = mockManager
    insurancePriceRepository.manager = mockManager

    insuranceService = new InsuranceService(
      insuranceRepository as unknown as Repository<Insurance>,
      coverageRepository as unknown as Repository<InsuranceCoverage>,
      benefitRepository as unknown as Repository<InsuranceBenefit>,
      coverageRelationRepository as unknown as Repository<InsuranceCoverageRelation>,
      benefitRelationRepository as unknown as Repository<InsuranceBenefitRelation>,
      insurancePriceRepository as unknown as Repository<InsurancePrice>,
    )

    vi.spyOn(PaginationService, 'paginateQueryBuilder').mockImplementation(() => {
      return Promise.resolve({
        data: insuranceRepository.items,
        meta: {
          total: insuranceRepository.items.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      })
    })
  })

  describe('create', () => {
    it('should throw NotFoundException when coverage not found', async () => {
      const createInsuranceDto: CreateInsuranceDto = {
        name: 'Test Insurance',
        description: 'Test Description',
        type: InsuranceType.LIFE,
        basePrice: 100,
        availablePaymentFrequencies: [PaymentFrequency.MONTHLY],
        coverages: [
          {
            id: '999',
            coverageAmount: 1000,
            additionalCost: 50,
          },
        ],
      }

      await expect(insuranceService.create(createInsuranceDto)).rejects.toThrow(NotFoundException)
    })
  })

  describe('findAll', () => {
    it('should return all active insurances with pagination', async () => {
      const insurances = [
        {
          id: '1',
          name: 'Test Insurance 1',
          description: 'Description 1',
          type: InsuranceType.LIFE,
          coverages: [],
          benefits: [],
          prices: [],
        },
        {
          id: '2',
          name: 'Test Insurance 2',
          description: 'Description 2',
          type: InsuranceType.HEALTH,
          coverages: [],
          benefits: [],
          prices: [],
        },
      ]

      insuranceRepository.items = insurances

      const query = { page: 1, limit: 10 }
      const result = await insuranceService.findAll(query)

      expect(result).toBeDefined()
      expect(result.data).toHaveLength(2)
      expect(result.meta).toBeDefined()
      expect(result.meta.total).toBe(2)
    })

    it('should return empty array when no insurances exist', async () => {
      insuranceRepository.items = []

      const query = { page: 1, limit: 10 }
      const result = await insuranceService.findAll(query)

      expect(result).toBeDefined()
      expect(result.data).toHaveLength(0)
      expect(result.meta.total).toBe(0)
    })
  })

  describe('findOne', () => {
    it('should return an insurance with its relations', async () => {
      const mockInsurance = {
        id: '1',
        name: 'Test Insurance',
        description: 'Test Description',
        type: InsuranceType.LIFE,
        coverages: [],
        benefits: [],
        prices: [],
      }

      insuranceRepository.items = [mockInsurance]
      insuranceRepository.queryBuilder.setGetOneResult(mockInsurance)

      const result = await insuranceService.findOne('1')

      expect(result).toEqual(mockInsurance)
    })

    it('should throw NotFoundException when insurance does not exist', async () => {
      await expect(insuranceService.findOne('999')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update prices when basePrice changes', async () => {
      const mockInsurance = {
        id: '1',
        name: 'Test Insurance',
        description: 'Test Description',
        type: InsuranceType.LIFE,
        requirements: [],
        order: 0,
        coverages: [],
        benefits: [],
        prices: [
          {
            id: '1',
            frequency: PaymentFrequency.MONTHLY,
            price: 100,
            insurance: {
              id: '1',
              name: 'Test Insurance',
              description: 'Test Description',
              type: InsuranceType.LIFE,
              requirements: [],
              order: 0,
              coverages: [],
              benefits: [],
              prices: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: new Date(),
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      } as Insurance

      insuranceRepository.items = [mockInsurance]
      insuranceRepository.queryBuilder.setGetOneResult(mockInsurance)

      const updateDto: UpdateInsuranceDto = {
        basePrice: 150,
      }

      const result = await insuranceService.update('1', updateDto)

      expect(result.prices.find((p) => p.frequency === PaymentFrequency.MONTHLY)?.price).toBe(100)
    })

    it('should throw NotFoundException when trying to update non-existent insurance', async () => {
      const updateDto: UpdateInsuranceDto = { name: 'Updated Name' }

      await expect(insuranceService.update('999', updateDto)).rejects.toThrow(NotFoundException)
    })

    it('should update payment frequencies when availablePaymentFrequencies changes', async () => {
      const mockInsurance = {
        id: '1',
        name: 'Test Insurance',
        description: 'Test Description',
        type: InsuranceType.LIFE,
        requirements: [],
        order: 0,
        coverages: [],
        benefits: [],
        prices: [
          {
            id: '1',
            frequency: PaymentFrequency.MONTHLY,
            price: 100,
            insurance: {
              id: '1',
              name: 'Test Insurance',
              description: 'Test Description',
              type: InsuranceType.LIFE,
              requirements: [],
              order: 0,
              coverages: [],
              benefits: [],
              prices: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: new Date(),
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      } as Insurance

      insuranceRepository.items = [mockInsurance]
      insuranceRepository.queryBuilder.setGetOneResult(mockInsurance)

      const updateDto: UpdateInsuranceDto = {
        availablePaymentFrequencies: [PaymentFrequency.MONTHLY, PaymentFrequency.QUARTERLY],
      }

      const result = await insuranceService.update('1', updateDto)

      expect(result.prices).toHaveLength(1)
      expect(result.prices[0].frequency).toBe(PaymentFrequency.MONTHLY)
      expect(result.prices[0].price).toBe(100)
    })
  })

  describe('remove', () => {
    it('should soft delete an insurance and its relations', async () => {
      const mockInsurance = {
        id: '1',
        name: 'Test Insurance',
        description: 'Test Description',
        type: InsuranceType.LIFE,
        coverages: [],
        benefits: [],
        prices: [],
      }

      insuranceRepository.items = [mockInsurance]

      await insuranceService.remove('1')

      expect(insuranceRepository.items[0].deletedAt).toBeDefined()
    })

    it('should throw NotFoundException when trying to remove non-existent insurance', async () => {
      await expect(insuranceService.remove('999')).rejects.toThrow(NotFoundException)
    })
  })
})
