import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InsuranceService } from '../../src/insurance/services/insurance.service'
import { Repository } from 'typeorm'
import { Insurance, InsuranceType, PaymentFrequency } from '../../src/insurance/entities/insurance.entity'
import { NotFoundException } from '@nestjs/common'
import { CreateInsuranceDto } from '../../src/insurance/dto/create-insurance.dto'
import { UpdateInsuranceDto } from '../../src/insurance/dto/update-insurance.dto'
import { PaginationService } from '../../src/common/services/pagination.service'

class InsuranceRepositoryMock {
  public items: Partial<Insurance>[] = []

  create(dto: any): Partial<Insurance> {
    return {
      ...dto,
      id: `${this.items.length + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      requirements: dto.requirements || [],
      rank: dto.rank || 0,
      availablePaymentFrequencies: dto.availablePaymentFrequencies || [PaymentFrequency.MONTHLY],
      coverages: [],
      benefits: [],
    }
  }

  save(entity: any): Promise<Partial<Insurance>> {
    if (entity.id) {
      const index = this.items.findIndex((item) => item.id === entity.id)
      if (index !== -1) {
        this.items[index] = { ...this.items[index], ...entity }
        return Promise.resolve(this.items[index])
      }
    }
    const newEntity = this.create(entity)
    this.items.push(newEntity)
    return Promise.resolve(newEntity)
  }

  findOne(options: any): Promise<Partial<Insurance> | null> {
    const { where } = options
    const id = where.id
    const item = this.items.find((item) => item.id === id)
    return Promise.resolve(item || null)
  }

  find(): Promise<Partial<Insurance>[]> {
    return Promise.resolve(this.items)
  }

  createQueryBuilder() {
    return {
      leftJoinAndSelect: () => this,
      where: () => this,
      andWhere: () => this,
      orderBy: () => this,
      skip: () => this,
      take: () => this,
      getManyAndCount: () => Promise.resolve([this.items, this.items.length]),
    }
  }

  async softDelete(id: string): Promise<void> {
    const index = this.items.findIndex((item) => item.id === id)
    if (index === -1) {
      throw new NotFoundException(`Insurance with ID ${id} not found`)
    }
    this.items[index] = {
      ...this.items[index],
      deletedAt: new Date(),
    }
    await Promise.resolve()
  }
}

describe('InsuranceService', () => {
  let insuranceService: InsuranceService
  let insuranceRepository: InsuranceRepositoryMock

  beforeEach(() => {
    insuranceRepository = new InsuranceRepositoryMock()

    insuranceService = new InsuranceService(insuranceRepository as unknown as Repository<Insurance>)

    // Mock pagination service
    vi.spyOn(PaginationService, 'paginate').mockImplementation(() => {
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
    it('should create an insurance successfully', async () => {
      const createInsuranceDto: CreateInsuranceDto = {
        name: 'Test Insurance',
        description: 'Test Description',
        type: InsuranceType.LIFE,
        basePrice: 100,
        requirements: ['ID', 'Medical Check'],
        availablePaymentFrequencies: [PaymentFrequency.MONTHLY, PaymentFrequency.YEARLY],
        rank: 1,
      }

      const insurance = await insuranceService.create(createInsuranceDto)

      expect(insurance).toBeDefined()
      expect(insurance.name).toBe(createInsuranceDto.name)
      expect(insurance.type).toBe(createInsuranceDto.type)
      expect(insurance.basePrice).toBe(createInsuranceDto.basePrice)
      expect(insuranceRepository.items).toHaveLength(1)
    })
  })

  describe('findAll', () => {
    it('should return all active insurances with pagination', async () => {
      // Set up test data
      const insurances = [
        {
          id: '1',
          name: 'Test Insurance 1',
          description: 'Description 1',
          type: InsuranceType.LIFE,
          basePrice: 100,
        },
        {
          id: '2',
          name: 'Test Insurance 2',
          description: 'Description 2',
          type: InsuranceType.HEALTH,
          basePrice: 200,
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
  })

  describe('findOne', () => {
    it('should return an insurance when it exists', async () => {
      const mockInsurance = {
        id: '1',
        name: 'Test Insurance',
        description: 'Test Description',
        type: InsuranceType.LIFE,
        basePrice: 100,
        isActive: true,
        coverages: [],
        benefits: [],
      }

      insuranceRepository.items = [mockInsurance]

      const result = await insuranceService.findOne('1')

      expect(result).toEqual(mockInsurance)
    })

    it('should throw NotFoundException when insurance does not exist', async () => {
      await expect(insuranceService.findOne('999')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update an insurance successfully', async () => {
      const mockInsurance = {
        id: '1',
        name: 'Original Name',
        description: 'Original Description',
        type: InsuranceType.LIFE,
        basePrice: 100,
        isActive: true,
        coverages: [],
        benefits: [],
      }

      insuranceRepository.items = [mockInsurance]

      const updateDto: UpdateInsuranceDto = {
        name: 'Updated Name',
        basePrice: 150,
      }

      const result = await insuranceService.update('1', updateDto)

      expect(result.name).toBe('Updated Name')
      expect(result.basePrice).toBe(150)
      // Other fields should remain unchanged
      expect(result.description).toBe('Original Description')
      expect(result.type).toBe(InsuranceType.LIFE)
    })

    it('should throw NotFoundException when trying to update non-existent insurance', async () => {
      const updateDto: UpdateInsuranceDto = { name: 'Updated Name' }

      await expect(insuranceService.update('999', updateDto)).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('should soft delete an insurance by setting deletedAt', async () => {
      const mockInsurance = {
        id: '1',
        name: 'Test Insurance',
        description: 'Test Description',
        type: InsuranceType.LIFE,
        basePrice: 100,
        requirements: [],
        rank: 0,
        availablePaymentFrequencies: [PaymentFrequency.MONTHLY],
        coverages: [],
        benefits: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
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
