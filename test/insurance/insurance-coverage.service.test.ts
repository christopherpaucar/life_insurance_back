import { describe, it, expect, beforeEach } from 'vitest'
import { InsuranceCoverageService } from '../../src/insurance/services/insurance-coverage.service'
import { Repository } from 'typeorm'
import { InsuranceCoverage } from '../../src/insurance/entities/insurance-coverage.entity'
import { NotFoundException } from '@nestjs/common'
import { CreateInsuranceCoverageDto } from '../../src/insurance/dto/create-insurance-coverage.dto'
import { UpdateInsuranceCoverageDto } from '../../src/insurance/dto/update-insurance-coverage.dto'
import { InsuranceCoverageRepositoryMock } from '../mocks/insurance-coverage.repository.mock'

describe('InsuranceCoverageService', () => {
  let coverageService: InsuranceCoverageService
  let coverageRepository: InsuranceCoverageRepositoryMock

  beforeEach(() => {
    coverageRepository = new InsuranceCoverageRepositoryMock()

    const mockManager = {
      save: (entity: any) => {
        const savedEntity = { ...entity, id: '1' }
        if (entity instanceof InsuranceCoverage) {
          coverageRepository.queryBuilder.setGetOneResult(savedEntity)
        }
        return Promise.resolve(savedEntity)
      },
      find: () => Promise.resolve(coverageRepository.items),
      findOne: () => Promise.resolve(null),
      create: (entity: any, data: any) => ({ ...data, id: '1' }),
      remove: () => Promise.resolve(),
      delete: () => Promise.resolve(),
      transaction: async (callback: (manager: any) => Promise<any>) => {
        return await callback(mockManager)
      },
    }

    coverageRepository.manager = mockManager

    coverageService = new InsuranceCoverageService(coverageRepository as unknown as Repository<InsuranceCoverage>)
  })

  describe('create', () => {
    it('should create a new coverage', async () => {
      const createCoverageDto: CreateInsuranceCoverageDto = {
        name: 'Test Coverage',
        description: 'Test Description',
      }

      const result = await coverageService.create(createCoverageDto)

      expect(result).toBeDefined()
      expect(result.id).toBe('1')
      expect(result.name).toBe(createCoverageDto.name)
      expect(result.description).toBe(createCoverageDto.description)
    })
  })

  describe('findAll', () => {
    it('should return all coverages', async () => {
      const coverages = [
        {
          id: '1',
          name: 'Test Coverage 1',
          description: 'Description 1',
        },
        {
          id: '2',
          name: 'Test Coverage 2',
          description: 'Description 2',
        },
      ]

      coverageRepository.items = coverages

      const result = await coverageService.findAll()

      expect(result).toBeDefined()
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Test Coverage 1')
      expect(result[1].name).toBe('Test Coverage 2')
    })

    it('should return empty array when no coverages exist', async () => {
      coverageRepository.items = []

      const result = await coverageService.findAll()

      expect(result).toBeDefined()
      expect(result).toHaveLength(0)
    })
  })

  describe('findOne', () => {
    it('should return a coverage by id', async () => {
      const mockCoverage = {
        id: '1',
        name: 'Test Coverage',
        description: 'Test Description',
      }

      coverageRepository.items = [mockCoverage]
      coverageRepository.queryBuilder.setGetOneResult(mockCoverage)

      const result = await coverageService.findOne('1')

      expect(result).toEqual(mockCoverage)
    })

    it('should throw NotFoundException when coverage does not exist', async () => {
      await expect(coverageService.findOne('999')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update a coverage', async () => {
      const mockCoverage = {
        id: '1',
        name: 'Test Coverage',
        description: 'Test Description',
      }

      coverageRepository.items = [mockCoverage]
      coverageRepository.queryBuilder.setGetOneResult(mockCoverage)

      const updateDto: UpdateInsuranceCoverageDto = {
        name: 'Updated Coverage',
      }

      const result = await coverageService.update('1', updateDto)

      expect(result.name).toBe('Updated Coverage')
    })

    it('should throw NotFoundException when trying to update non-existent coverage', async () => {
      const updateDto: UpdateInsuranceCoverageDto = { name: 'Updated Name' }

      await expect(coverageService.update('999', updateDto)).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('should remove a coverage', async () => {
      const mockCoverage = {
        id: '1',
        name: 'Test Coverage',
        description: 'Test Description',
      }

      coverageRepository.items = [mockCoverage]

      await coverageService.remove('1')

      expect(coverageRepository.items).toHaveLength(0)
    })

    it('should throw NotFoundException when trying to remove non-existent coverage', async () => {
      await expect(coverageService.remove('999')).rejects.toThrow(NotFoundException)
    })
  })
})
