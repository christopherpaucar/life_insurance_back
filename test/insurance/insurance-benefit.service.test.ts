import { describe, it, expect, beforeEach } from 'vitest'
import { InsuranceBenefitService } from '../../src/insurance/services/insurance-benefit.service'
import { Repository } from 'typeorm'
import { InsuranceBenefit } from '../../src/insurance/entities/insurance-benefit.entity'
import { NotFoundException } from '@nestjs/common'
import { CreateInsuranceBenefitDto } from '../../src/insurance/dto/create-insurance-benefit.dto'
import { UpdateInsuranceBenefitDto } from '../../src/insurance/dto/update-insurance-benefit.dto'
import { InsuranceBenefitRepositoryMock } from '../mocks/insurance-benefit.repository.mock'

describe('InsuranceBenefitService', () => {
  let benefitService: InsuranceBenefitService
  let benefitRepository: InsuranceBenefitRepositoryMock

  beforeEach(() => {
    benefitRepository = new InsuranceBenefitRepositoryMock()

    const mockManager = {
      save: (entity: any) => {
        const savedEntity = { ...entity, id: '1' }
        if (entity instanceof InsuranceBenefit) {
          benefitRepository.queryBuilder.setGetOneResult(savedEntity)
        }
        return Promise.resolve(savedEntity)
      },
      find: () => Promise.resolve(benefitRepository.items),
      findOne: () => Promise.resolve(null),
      create: (entity: any, data: any) => ({ ...data, id: '1' }),
      remove: () => Promise.resolve(),
      delete: () => Promise.resolve(),
      transaction: async (callback: (manager: any) => Promise<any>) => {
        return await callback(mockManager)
      },
    }

    benefitRepository.manager = mockManager

    benefitService = new InsuranceBenefitService(benefitRepository as unknown as Repository<InsuranceBenefit>)
  })

  describe('create', () => {
    it('should create a new benefit', async () => {
      const createBenefitDto: CreateInsuranceBenefitDto = {
        name: 'Test Benefit',
        description: 'Test Description',
      }

      const result = await benefitService.create(createBenefitDto)

      expect(result).toBeDefined()
      expect(result.id).toBe('1')
      expect(result.name).toBe(createBenefitDto.name)
      expect(result.description).toBe(createBenefitDto.description)
    })
  })

  describe('findAll', () => {
    it('should return all benefits', async () => {
      const benefits = [
        {
          id: '1',
          name: 'Test Benefit 1',
          description: 'Description 1',
        },
        {
          id: '2',
          name: 'Test Benefit 2',
          description: 'Description 2',
        },
      ]

      benefitRepository.items = benefits

      const result = await benefitService.findAll()

      expect(result).toBeDefined()
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Test Benefit 1')
      expect(result[1].name).toBe('Test Benefit 2')
    })

    it('should return empty array when no benefits exist', async () => {
      benefitRepository.items = []

      const result = await benefitService.findAll()

      expect(result).toBeDefined()
      expect(result).toHaveLength(0)
    })
  })

  describe('findOne', () => {
    it('should return a benefit by id', async () => {
      const mockBenefit = {
        id: '1',
        name: 'Test Benefit',
        description: 'Test Description',
      }

      benefitRepository.items = [mockBenefit]
      benefitRepository.queryBuilder.setGetOneResult(mockBenefit)

      const result = await benefitService.findOne('1')

      expect(result).toEqual(mockBenefit)
    })

    it('should throw NotFoundException when benefit does not exist', async () => {
      await expect(benefitService.findOne('999')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update a benefit', async () => {
      const mockBenefit = {
        id: '1',
        name: 'Test Benefit',
        description: 'Test Description',
      }

      benefitRepository.items = [mockBenefit]
      benefitRepository.queryBuilder.setGetOneResult(mockBenefit)

      const updateDto: UpdateInsuranceBenefitDto = {
        name: 'Updated Benefit',
      }

      const result = await benefitService.update('1', updateDto)

      expect(result.name).toBe('Updated Benefit')
    })

    it('should throw NotFoundException when trying to update non-existent benefit', async () => {
      const updateDto: UpdateInsuranceBenefitDto = { name: 'Updated Name' }

      await expect(benefitService.update('999', updateDto)).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('should remove a benefit', async () => {
      const mockBenefit = {
        id: '1',
        name: 'Test Benefit',
        description: 'Test Description',
      }

      benefitRepository.items = [mockBenefit]

      await benefitService.remove('1')

      expect(benefitRepository.items).toHaveLength(0)
    })

    it('should throw NotFoundException when trying to remove non-existent benefit', async () => {
      await expect(benefitService.remove('999')).rejects.toThrow(NotFoundException)
    })
  })
})
