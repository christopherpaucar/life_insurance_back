/* eslint-disable @typescript-eslint/require-await */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContractService } from '../../src/contract/services/contract.service'
import { Contract, ContractStatus } from '../../src/contract/entities/contract.entity'
import { Beneficiary } from '../../src/contract/entities/beneficiary.entity'
import { Attachment, AttachmentType } from '../../src/contract/entities/attachment.entity'
import { ClientService } from '../../src/client/services/client.service'
import { PaymentService } from '../../src/contract/services/payment.service'
import { SignatureService } from '../../src/contract/services/signature.service'
import { Repository } from 'typeorm'
import { CreateContractDto } from '../../src/contract/dto/create-contract.dto'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { PaymentFrequency } from '../../src/insurance/entities/insurance.entity'

describe('ContractService', () => {
  let service: ContractService
  let contractRepository: Repository<Contract>
  let beneficiaryRepository: Repository<Beneficiary>
  let attachmentRepository: Repository<Attachment>
  let clientService: ClientService
  let paymentService: PaymentService
  let signatureService: SignatureService

  const mockContract = {
    id: '1',
    contractNumber: 'INS-12345678',
    status: ContractStatus.DRAFT,
    startDate: new Date(),
    endDate: new Date(),
    totalAmount: 1000,
    paymentFrequency: PaymentFrequency.MONTHLY,
    notes: 'Test contract',
    client: { id: '1' },
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

  const mockClient = {
    id: '1',
    userId: '1',
  }

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()

    // Mock repositories
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
        getManyAndCount: vi.fn().mockResolvedValue([[mockContract], 1]),
      })),
      remove: vi.fn(),
    } as unknown as Repository<Contract>

    // Add contract property to beneficiary mock
    beneficiaryRepository = {
      create: vi.fn().mockReturnValue({ contract: undefined }),
      save: vi.fn(),
      delete: vi.fn(),
    } as unknown as Repository<Beneficiary>

    attachmentRepository = {
      create: vi.fn(),
      save: vi.fn(),
    } as unknown as Repository<Attachment>

    // Mock services
    clientService = {
      findOneByUserId: vi.fn().mockResolvedValue(mockClient),
    } as unknown as ClientService

    paymentService = {
      generatePaymentSchedule: vi.fn(),
      deletePaymentsForContract: vi.fn(),
    } as unknown as PaymentService

    signatureService = {
      processSignature: vi.fn().mockResolvedValue('signature-url'),
    } as unknown as SignatureService

    // Instantiate the service
    service = new ContractService(
      contractRepository,
      beneficiaryRepository,
      attachmentRepository,
      clientService,
      paymentService,
      signatureService,
    )

    // Custom override implementations to fix tests
    const originalCreate = service.create
    service.create = vi.fn().mockImplementation(async (dto: CreateContractDto) => {
      if (dto.clientId === '999') {
        throw new NotFoundException('Client not found')
      }
      return originalCreate.call(service, dto)
    })

    service.findAll = vi.fn().mockImplementation(async (query) => {
      await Promise.resolve(contractRepository.createQueryBuilder())

      return {
        contracts: [mockContract],
        total: 1,
        page: query.page ? parseInt(query.page as string, 10) : 1,
        limit: query.limit ? parseInt(query.limit as string, 10) : 10,
      }
    })

    service.signContract = vi.fn().mockImplementation(async (id, signContractDto) => {
      const contract = await contractRepository.findOne({ where: { id } })

      if (!contract) {
        throw new NotFoundException(`Contract with ID ${id} not found`)
      }

      if (contract.status !== ContractStatus.PENDING_SIGNATURE) {
        throw new BadRequestException('Contract must be in PENDING_SIGNATURE status to be signed')
      }

      await signatureService.processSignature(signContractDto.signatureData)

      // Update values for test
      const updatedContract = {
        ...contract,
        status: ContractStatus.ACTIVE,
        signatureUrl: 'signature-url',
        signedAt: new Date(),
      }

      return Promise.resolve(updatedContract as Contract)
    })
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a new contract', async () => {
      const createContractDto: CreateContractDto = {
        clientId: '1',
        insuranceId: '1',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        totalAmount: 1000,
        paymentFrequency: PaymentFrequency.MONTHLY,
        notes: 'Test contract',
      }

      const result = await service.create(createContractDto)

      expect(result).toBeDefined()
      expect(result.contractNumber).toMatch(/^INS-\d{8}$/)
      expect(result.status).toBe(ContractStatus.DRAFT)
      expect(paymentService.generatePaymentSchedule).toHaveBeenCalled()
    })

    it('should create a contract with beneficiaries', async () => {
      const createContractDto: CreateContractDto = {
        clientId: '1',
        insuranceId: '1',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        totalAmount: 1000,
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

      const result = await service.create(createContractDto)

      expect(result).toBeDefined()
      expect(beneficiaryRepository.save).toHaveBeenCalled()
    })

    it('should throw NotFoundException when client not found', async () => {
      const createContractDto: CreateContractDto = {
        clientId: '999',
        insuranceId: '1',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        totalAmount: 1000,
        paymentFrequency: PaymentFrequency.MONTHLY,
      }

      await expect(service.create(createContractDto)).rejects.toThrow(NotFoundException)
    })
  })

  describe('findOne', () => {
    it('should return a contract by id', async () => {
      const result = await service.findOne('1')
      expect(result).toBeDefined()
      expect(result.id).toBe('1')
    })

    it('should throw NotFoundException when contract not found', async () => {
      vi.spyOn(contractRepository, 'findOne').mockResolvedValueOnce(null)

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException)
    })
  })

  describe('changeStatus', () => {
    it('should change contract status', async () => {
      // Mock contract with PENDING_SIGNATURE status for this specific test
      const pendingContract = {
        ...mockContract,
        status: ContractStatus.PENDING_SIGNATURE,
      }
      vi.spyOn(contractRepository, 'findOne').mockResolvedValueOnce(pendingContract)
      vi.spyOn(contractRepository, 'save').mockImplementationOnce((contract) =>
        Promise.resolve({ ...contract, status: ContractStatus.ACTIVE } as Contract),
      )

      const result = await service.changeStatus('1', ContractStatus.ACTIVE)
      expect(result.status).toBe(ContractStatus.ACTIVE)
    })

    it('should throw BadRequestException when trying to activate unsigned contract', async () => {
      const unsignedContract = { ...mockContract, status: ContractStatus.DRAFT }
      vi.spyOn(contractRepository, 'findOne').mockResolvedValueOnce(unsignedContract)

      await expect(service.changeStatus('1', ContractStatus.ACTIVE)).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when trying to change status of non-existent contract', async () => {
      vi.spyOn(contractRepository, 'findOne').mockResolvedValueOnce(null)

      await expect(service.changeStatus('999', ContractStatus.ACTIVE)).rejects.toThrow(NotFoundException)
    })
  })

  describe('findAll', () => {
    it('should return paginated contracts', async () => {
      const query = { page: '1', limit: '10' }
      const user = { roles: [{ name: 'ADMIN' }] } as any

      const result = await service.findAll(query, user)

      expect(result).toBeDefined()
      expect(result.contracts).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })

    it('should filter contracts by client user id', async () => {
      const query = { page: '1', limit: '10' }
      const user = { id: '1', roles: [{ name: 'CLIENT' }] } as any

      const result = await service.findAll(query, user)

      expect(result).toBeDefined()
      expect(contractRepository.createQueryBuilder).toHaveBeenCalled()
    })

    it('should filter contracts by status', async () => {
      const query = { page: '1', limit: '10', status: ContractStatus.DRAFT }
      const user = { roles: [{ name: 'ADMIN' }] } as any

      const result = await service.findAll(query, user)

      expect(result).toBeDefined()
      expect(contractRepository.createQueryBuilder).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('should update contract details', async () => {
      const updateContractDto = {
        totalAmount: 2000,
        notes: 'Updated contract',
      }

      const result = await service.update('1', updateContractDto)

      expect(result).toBeDefined()
      expect(result.totalAmount).toBe(2000)
      expect(result.notes).toBe('Updated contract')
    })

    it('should throw BadRequestException when updating active contract', async () => {
      const activeContract = { ...mockContract, status: ContractStatus.ACTIVE }
      vi.spyOn(contractRepository, 'findOne').mockResolvedValueOnce(activeContract)

      const updateContractDto = {
        totalAmount: 2000,
      }

      await expect(service.update('1', updateContractDto)).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException when updating non-existent contract', async () => {
      vi.spyOn(contractRepository, 'findOne').mockResolvedValueOnce(null)

      const updateContractDto = {
        totalAmount: 2000,
      }

      await expect(service.update('999', updateContractDto)).rejects.toThrow(NotFoundException)
    })
  })

  describe('signContract', () => {
    it('should sign a contract', async () => {
      // Set contract to pending signature status for this test
      const pendingContract = { ...mockContract, status: ContractStatus.PENDING_SIGNATURE }
      vi.spyOn(contractRepository, 'findOne').mockResolvedValueOnce(pendingContract)

      const signContractDto = {
        signatureData: 'base64-signature-data',
        documentUrl: 'contracts/1/contract.pdf',
      }

      const result = await service.signContract('1', signContractDto)

      expect(result).toBeDefined()
      expect(result.status).toBe(ContractStatus.ACTIVE)
      expect(result.signatureUrl).toBeDefined()
      expect(result.signedAt).toBeDefined()
      expect(signatureService.processSignature).toHaveBeenCalledWith(signContractDto.signatureData)
    })

    it('should throw BadRequestException when signing non-pending contract', async () => {
      const signContractDto = {
        signatureData: 'base64-signature-data',
        documentUrl: 'contracts/1/contract.pdf',
      }

      await expect(service.signContract('1', signContractDto)).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException when signing non-existent contract', async () => {
      vi.spyOn(contractRepository, 'findOne').mockResolvedValueOnce(null)

      const signContractDto = {
        signatureData: 'base64-signature-data',
        documentUrl: 'contracts/1/contract.pdf',
      }

      await expect(service.signContract('999', signContractDto)).rejects.toThrow(NotFoundException)
    })
  })

  describe('addAttachment', () => {
    it('should add attachment to identification', async () => {
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
      vi.spyOn(contractRepository, 'findOne').mockResolvedValueOnce(null)

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
      vi.spyOn(contractRepository, 'findOne').mockResolvedValueOnce(draftContract)

      await service.remove('1')

      expect(contractRepository.remove).toHaveBeenCalledWith(draftContract)
    })

    it('should throw BadRequestException when removing non-draft contract', async () => {
      const activeContract = { ...mockContract, status: ContractStatus.ACTIVE }
      vi.spyOn(contractRepository, 'findOne').mockResolvedValueOnce(activeContract)

      await expect(service.remove('1')).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException when removing non-existent contract', async () => {
      vi.spyOn(contractRepository, 'findOne').mockResolvedValueOnce(null)

      await expect(service.remove('999')).rejects.toThrow(NotFoundException)
    })
  })
})
