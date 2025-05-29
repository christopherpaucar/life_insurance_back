import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContractService } from '../../src/contract/services/contract.service'
import { Contract, ContractStatus } from '../../src/contract/entities/contract.entity'
import { Beneficiary } from '../../src/contract/entities/beneficiary.entity'
import { Attachment, AttachmentType } from '../../src/contract/entities/attachment.entity'
import { PaymentService } from '../../src/contract/services/payment.service'
import { Repository } from 'typeorm'
import { CreateContractDto } from '../../src/contract/dto/create-contract.dto'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { PaymentFrequency } from '../../src/insurance/entities/insurance-price.entity'
import { InsuranceService } from '../../src/insurance/services/insurance.service'
import { FileStorageService } from '../../src/common/services/file-storage.service'
import { User } from '../../src/auth/entities/user.entity'
import { PaymentMethod } from '../../src/contract/entities/payment-method.entity'
import { Insurance } from '../../src/insurance/entities/insurance.entity'

describe('ContractService', () => {
  let service: ContractService
  let contractRepository: Repository<Contract>
  let beneficiaryRepository: Repository<Beneficiary>
  let attachmentRepository: Repository<Attachment>
  let paymentMethodRepository: Repository<PaymentMethod>
  let paymentService: PaymentService
  let insuranceService: InsuranceService
  let fileStorageService: FileStorageService

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

  const mockContract = {
    id: '1',
    contractNumber: 'INS-12345678',
    status: ContractStatus.DRAFT,
    startDate: new Date(),
    endDate: new Date(),
    totalAmount: 1000,
    paymentFrequency: PaymentFrequency.MONTHLY,
    notes: 'Test contract',
    user: { id: '1' },
    insurance: { id: '1' },
    installmentAmount: 0,
    beneficiaries: [],
    payments: [],
    attachments: [],
    signatureUrl: '',
    signedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as unknown as Contract

  beforeEach(() => {
    vi.clearAllMocks()

    contractRepository = {
      create: vi.fn().mockReturnValue(mockContract),
      save: vi.fn().mockResolvedValue(mockContract),
      findOne: vi.fn().mockResolvedValue(mockContract),
      createQueryBuilder: vi.fn(() => ({
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        loadRelationIdAndMap: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(mockContract),
        getManyAndCount: vi.fn().mockResolvedValue([[mockContract], 1]),
      })),
      remove: vi.fn(),
    } as unknown as Repository<Contract>

    beneficiaryRepository = {
      create: vi.fn().mockReturnValue({ contract: undefined }),
      save: vi.fn(),
      delete: vi.fn(),
    } as unknown as Repository<Beneficiary>

    attachmentRepository = {
      create: vi.fn(),
      save: vi.fn(),
    } as unknown as Repository<Attachment>

    paymentMethodRepository = {
      create: vi.fn(),
      save: vi.fn(),
    } as unknown as Repository<PaymentMethod>

    paymentService = {
      generatePaymentSchedule: vi.fn(),
      deletePaymentsForContract: vi.fn(),
    } as unknown as PaymentService

    insuranceService = {
      findOne: vi.fn().mockResolvedValue({
        id: '1',
        name: 'Test Insurance',
        prices: [{ frequency: PaymentFrequency.MONTHLY, price: 100 }],
        coverages: [],
        benefits: [],
      }),
    } as unknown as InsuranceService

    fileStorageService = {
      uploadEntityFile: vi.fn().mockResolvedValue({ url: 'test-url' }),
    } as unknown as FileStorageService

    service = new ContractService(
      contractRepository,
      beneficiaryRepository,
      attachmentRepository,
      paymentMethodRepository,
      paymentService,
      insuranceService,
      fileStorageService,
    )
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a new contract', async () => {
      const createContractDto: CreateContractDto = {
        insuranceId: '1',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        paymentFrequency: PaymentFrequency.MONTHLY,
        notes: 'Test contract',
      }

      const savedContract = {
        ...mockContract,
        id: '1',
        contractNumber: `INS-${Date.now().toString().slice(-8)}`,
        status: ContractStatus.DRAFT,
      }

      vi.spyOn(contractRepository, 'save').mockImplementationOnce(() => {
        return Promise.resolve(savedContract)
      })

      vi.spyOn(contractRepository, 'createQueryBuilder').mockReturnValueOnce({
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        loadRelationIdAndMap: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValueOnce(savedContract),
      } as any)

      vi.spyOn(service, 'findOne').mockResolvedValueOnce(savedContract)

      const result = await service.create(createContractDto, mockUser)

      expect(result).toBeDefined()
      expect(result.contractNumber).toMatch(/^INS-\d{8}$/)
      expect(result.status).toBe(ContractStatus.DRAFT)
    })

    it('should create a contract with beneficiaries', async () => {
      const createContractDto: CreateContractDto = {
        insuranceId: '1',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        paymentFrequency: PaymentFrequency.MONTHLY,
        notes: 'Test contract',
        beneficiaries: [
          {
            name: 'John Doe',
            relationship: 'SPOUSE',
            percentage: 100,
            contactInfo: 'john@example.com',
          },
        ],
      }

      const result = await service.create(createContractDto, mockUser)

      expect(result).toBeDefined()
      expect(beneficiaryRepository.save).toHaveBeenCalled()
    })

    it('should throw NotFoundException when insurance not found', async () => {
      vi.spyOn(insuranceService, 'findOne').mockResolvedValueOnce(undefined as unknown as Insurance)

      const createContractDto: CreateContractDto = {
        insuranceId: '999',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        paymentFrequency: PaymentFrequency.MONTHLY,
      }

      await expect(service.create(createContractDto, mockUser)).rejects.toThrow(NotFoundException)
    })
  })

  describe('findOne', () => {
    it('should return a contract by id', async () => {
      const result = await service.findOne('1')
      expect(result).toBeDefined()
      expect(result.id).toBe('1')
    })

    it('should throw NotFoundException when contract not found', async () => {
      vi.spyOn(contractRepository, 'createQueryBuilder').mockReturnValueOnce({
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        loadRelationIdAndMap: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValueOnce(null),
      } as any)

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException)
    })
  })

  describe('changeStatus', () => {
    it('should change contract status', async () => {
      const awaitingContract = {
        ...mockContract,
        status: ContractStatus.AWAITING_CLIENT_CONFIRMATION,
      }
      vi.spyOn(contractRepository, 'createQueryBuilder').mockReturnValueOnce({
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        loadRelationIdAndMap: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValueOnce(awaitingContract),
      } as any)
      vi.spyOn(contractRepository, 'save').mockImplementationOnce((contract) =>
        Promise.resolve({ ...contract, status: ContractStatus.ACTIVE } as Contract),
      )

      const result = await service.changeStatus('1', ContractStatus.ACTIVE)
      expect(result.status).toBe(ContractStatus.ACTIVE)
    })

    it('should throw BadRequestException when trying to activate non-awaiting contract', async () => {
      const draftContract = { ...mockContract, status: ContractStatus.DRAFT }
      vi.spyOn(contractRepository, 'createQueryBuilder').mockReturnValueOnce({
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        loadRelationIdAndMap: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValueOnce(draftContract),
      } as any)

      await expect(service.changeStatus('1', ContractStatus.ACTIVE)).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException when trying to change status of non-existent contract', async () => {
      vi.spyOn(contractRepository, 'createQueryBuilder').mockReturnValueOnce({
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        loadRelationIdAndMap: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValueOnce(null),
      } as any)

      await expect(service.changeStatus('999', ContractStatus.ACTIVE)).rejects.toThrow(NotFoundException)
    })
  })

  describe('findAll', () => {
    it('should return paginated contracts', async () => {
      const query = { page: '1', limit: '10' }
      const user = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'hashed_password',
        role: { name: 'ADMIN' },
        roles: [{ name: 'ADMIN' }],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as unknown as User

      vi.spyOn(contractRepository, 'createQueryBuilder').mockReturnValueOnce({
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        loadRelationIdAndMap: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValueOnce([[mockContract], 1]),
      } as any)

      const result = await service.findAll({ ...query, pages: '1' }, user)

      expect(result).toBeDefined()
      expect(result.contracts).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })

    it('should filter contracts by client user id', async () => {
      const query = { page: '1', limit: '10' }
      const user = {
        id: '1',
        email: 'client@example.com',
        name: 'Client User',
        password: 'hashed_password',
        role: { name: 'CLIENT' },
        roles: [{ name: 'CLIENT' }],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as unknown as User

      const result = await service.findAll(query, user)

      expect(result).toBeDefined()
      expect(contractRepository.createQueryBuilder).toHaveBeenCalled()
    })

    it('should filter contracts by status', async () => {
      const query = { page: '1', limit: '10', status: ContractStatus.DRAFT }
      const user = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'hashed_password',
        role: { name: 'ADMIN' },
        roles: [{ name: 'ADMIN' }],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as unknown as User

      const result = await service.findAll(query, user)

      expect(result).toBeDefined()
      expect(contractRepository.createQueryBuilder).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('should update contract details', async () => {
      const updateContractDto = {
        notes: 'Updated contract',
        paymentFrequency: PaymentFrequency.MONTHLY,
      }

      const result = await service.update('1', updateContractDto)

      expect(result).toBeDefined()
      expect(result.notes).toBe('Updated contract')
    })

    it('should throw BadRequestException when updating active contract', async () => {
      const activeContract = { ...mockContract, status: ContractStatus.ACTIVE }
      vi.spyOn(contractRepository, 'createQueryBuilder').mockReturnValueOnce({
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        loadRelationIdAndMap: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValueOnce(activeContract),
      } as any)

      const updateContractDto = {
        notes: 'Updated contract',
        paymentFrequency: PaymentFrequency.MONTHLY,
      }

      await expect(service.update('1', updateContractDto)).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException when updating non-existent contract', async () => {
      vi.spyOn(contractRepository, 'createQueryBuilder').mockReturnValueOnce({
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        loadRelationIdAndMap: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValueOnce(null),
      } as any)

      const updateContractDto = {
        notes: 'Updated contract',
        paymentFrequency: PaymentFrequency.MONTHLY,
      }

      await expect(service.update('999', updateContractDto)).rejects.toThrow(NotFoundException)
    })
  })

  describe('addAttachment', () => {
    it('should add attachment to contract', async () => {
      const attachmentData = {
        fileName: 'test.pdf',
        fileUrl: 'contracts/1/test.pdf',
        type: AttachmentType.IDENTIFICATION,
        description: 'Test attachment',
      }

      const result = await service.addAttachment('1', attachmentData)

      expect(result).toBeDefined()
      expect(result.attachments).toBeDefined()
    })

    it('should throw NotFoundException when adding attachment to non-existent contract', async () => {
      vi.spyOn(contractRepository, 'createQueryBuilder').mockReturnValueOnce({
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        loadRelationIdAndMap: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValueOnce(null),
      } as any)

      const attachmentData = {
        fileName: 'test.pdf',
        fileUrl: 'contracts/1/test.pdf',
        type: AttachmentType.IDENTIFICATION,
        description: 'Test attachment',
      }

      await expect(service.addAttachment('999', attachmentData)).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('should remove a draft contract', async () => {
      const draftContract = { ...mockContract, status: ContractStatus.DRAFT }
      vi.spyOn(contractRepository, 'createQueryBuilder').mockReturnValueOnce({
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        loadRelationIdAndMap: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValueOnce(draftContract),
      } as any)

      await service.remove('1')

      expect(contractRepository.remove).toHaveBeenCalledWith(draftContract)
    })

    it('should throw BadRequestException when removing non-draft contract', async () => {
      const activeContract = { ...mockContract, status: ContractStatus.ACTIVE }
      vi.spyOn(contractRepository, 'createQueryBuilder').mockReturnValueOnce({
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        loadRelationIdAndMap: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValueOnce(activeContract),
      } as any)

      await expect(service.remove('1')).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException when removing non-existent contract', async () => {
      vi.spyOn(contractRepository, 'createQueryBuilder').mockReturnValueOnce({
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        loadRelationIdAndMap: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValueOnce(null),
      } as any)

      await expect(service.remove('999')).rejects.toThrow(NotFoundException)
    })
  })
})
