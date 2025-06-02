import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReimbursementService } from '../../src/reimbursement/services/reimbursement.service'
import { Repository } from 'typeorm'
import { Reimbursement, ReimbursementStatus } from '../../src/reimbursement/entities/reimbursement.entity'
import {
  ReimbursementItem,
  ReimbursementItemStatus,
  ReimbursementItemType,
} from '../../src/reimbursement/entities/reimbursement-item.entity'
import { CreateReimbursementDto } from '../../src/reimbursement/dto/create-reimbursement.dto'
import { UpdateReimbursementDto } from '../../src/reimbursement/dto/update-reimbursement.dto'
import { ReviewReimbursementDto } from '../../src/reimbursement/dto/review-reimbursement.dto'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { User } from '../../src/auth/entities/user.entity'
import { ContractService } from '../../src/contract/services/contract.service'
import { BaseRepositoryMock, QueryBuilderMock } from '../mocks/base.repository.mock'
import { Contract, ContractStatus } from '../../src/contract/entities/contract.entity'
import { Role, RoleType } from '../../src/auth/entities/role.entity'
import { PaymentFrequency } from '../../src/insurance/entities/insurance-price.entity'

describe('ReimbursementService', () => {
  let reimbursementService: ReimbursementService
  let reimbursementRepository: BaseRepositoryMock<Reimbursement>
  let reimbursementItemRepository: BaseRepositoryMock<ReimbursementItem>
  let contractService: ContractService

  const mockRole: Role = {
    id: '1',
    name: RoleType.CLIENT,
    description: 'Client role',
    permissions: ['contract:read', 'reimbursement:create'],
    users: [] as unknown as User[],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: new Date(),
  } as unknown as Role

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed_password',
    role: mockRole,
    roles: [mockRole],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: new Date(),
  } as unknown as User

  const mockContract: Partial<Contract> = {
    id: '1',
    contractNumber: 'INS-12345678',
    status: ContractStatus.ACTIVE,
    user: mockUser,
    startDate: new Date(),
    endDate: new Date(),
    totalAmount: 1000,
    paymentFrequency: PaymentFrequency.MONTHLY,
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: new Date(),
  }

  const createMockReimbursementItem = (overrides: Partial<ReimbursementItem> = {}): ReimbursementItem =>
    ({
      id: '1',
      description: 'Test item',
      type: ReimbursementItemType.MEDICATION,
      serviceDate: new Date(),
      requestedAmount: 100,
      approvedAmount: 0,
      status: ReimbursementItemStatus.PENDING,
      rejectionReason: '',
      documentUrl: '',
      reimbursement: undefined as unknown as Reimbursement,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: new Date(),
      ...overrides,
    }) as ReimbursementItem

  beforeEach(() => {
    reimbursementRepository = new BaseRepositoryMock<Reimbursement>()
    reimbursementItemRepository = new BaseRepositoryMock<ReimbursementItem>()
    contractService = {
      findOne: vi.fn().mockResolvedValue(mockContract),
    } as unknown as ContractService

    const queryBuilder = new QueryBuilderMock()
    queryBuilder.leftJoinAndSelect = vi.fn().mockReturnThis()
    queryBuilder.leftJoin = vi.fn().mockReturnThis()
    queryBuilder.select = vi.fn().mockReturnThis()
    queryBuilder.where = vi.fn().mockReturnThis()
    queryBuilder.getOne = vi.fn().mockImplementation(() => {
      const savedReimbursement = reimbursementRepository.items[0]
      if (savedReimbursement) {
        savedReimbursement.items = reimbursementItemRepository.items.map((item) => ({
          ...item,
          type: item.type || ReimbursementItemType.MEDICATION,
          status: item.status || ReimbursementItemStatus.PENDING,
          requestedAmount: item.requestedAmount || 0,
          approvedAmount: item.approvedAmount || 0,
          serviceDate: item.serviceDate || new Date(),
          description: item.description || '',
        })) as ReimbursementItem[]
      }
      return Promise.resolve(savedReimbursement || null)
    })
    queryBuilder.getManyAndCount = vi.fn().mockImplementation(() => {
      return Promise.resolve([reimbursementRepository.items, reimbursementRepository.items.length])
    })
    queryBuilder.skip = vi.fn().mockReturnThis()
    queryBuilder.take = vi.fn().mockReturnThis()
    queryBuilder.orderBy = vi.fn().mockReturnThis()
    queryBuilder.andWhere = vi.fn().mockReturnThis()

    reimbursementRepository.queryBuilder = queryBuilder
    reimbursementItemRepository.save = vi.fn().mockImplementation((items) => {
      if (Array.isArray(items)) {
        reimbursementItemRepository.items.push(...items)
      } else {
        reimbursementItemRepository.items.push(items)
      }
      return Promise.resolve(items)
    })

    reimbursementService = new ReimbursementService(
      reimbursementRepository as unknown as Repository<Reimbursement>,
      reimbursementItemRepository as unknown as Repository<ReimbursementItem>,
      contractService,
    )
  })

  describe('create', () => {
    it('should create a new reimbursement with items', async () => {
      const createReimbursementDto: CreateReimbursementDto = {
        contractId: '1',
        items: [
          {
            description: 'Test item 1',
            type: ReimbursementItemType.MEDICATION,
            serviceDate: '2024-01-01',
            requestedAmount: 100,
            documentUrl: 'http://example.com/doc1',
          },
          {
            description: 'Test item 2',
            type: ReimbursementItemType.CONSULTATION,
            serviceDate: '2024-01-02',
            requestedAmount: 200,
            documentUrl: 'http://example.com/doc2',
          },
        ],
      }

      const result = await reimbursementService.create(createReimbursementDto, mockUser)

      expect(result).toBeDefined()
      expect(result.requestNumber).toMatch(/^RMB-\d{8}$/)
      expect(result.status).toBe(ReimbursementStatus.SUBMITTED)
      expect(result.totalRequestedAmount).toBe(300)
      expect(result.items).toHaveLength(2)
      expect(result.items[0].status).toBe(ReimbursementItemStatus.PENDING)
      expect(result.items[1].status).toBe(ReimbursementItemStatus.PENDING)
    })

    it('should throw NotFoundException when contract not found', async () => {
      const createReimbursementDto: CreateReimbursementDto = {
        contractId: '999',
        items: [
          {
            description: 'Test item',
            type: ReimbursementItemType.MEDICATION,
            serviceDate: '2024-01-01',
            requestedAmount: 100,
          },
        ],
      }

      vi.spyOn(contractService, 'findOne').mockRejectedValueOnce(new NotFoundException())

      await expect(reimbursementService.create(createReimbursementDto, mockUser)).rejects.toThrow(NotFoundException)
    })
  })

  describe('findAll', () => {
    it('should return paginated reimbursements for admin user', async () => {
      const query = { page: '1', limit: '10' }
      const adminRole: Role = {
        ...mockRole,
        name: RoleType.ADMIN,
        permissions: ['reimbursement:read', 'reimbursement:write'],
      } as unknown as Role
      const adminUser = { ...mockUser, role: adminRole, roles: [adminRole] }

      const mockReimbursements: Partial<Reimbursement>[] = [
        {
          id: '1',
          requestNumber: 'RMB-12345678',
          status: ReimbursementStatus.SUBMITTED,
          totalRequestedAmount: 100,
          items: [],
          user: mockUser,
          contract: mockContract as Contract,
        },
      ]

      reimbursementRepository.items = mockReimbursements

      const result = await reimbursementService.findAll(query, adminUser)

      expect(result).toBeDefined()
      expect(result.reimbursements).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })

    it('should filter reimbursements by client user id', async () => {
      const query = { page: '1', limit: '10' }
      const clientUser = { ...mockUser, role: mockRole, roles: [mockRole] }

      const mockReimbursements: Partial<Reimbursement>[] = [
        {
          id: '1',
          requestNumber: 'RMB-12345678',
          status: ReimbursementStatus.SUBMITTED,
          totalRequestedAmount: 100,
          items: [],
          user: clientUser,
          contract: mockContract as Contract,
        },
      ]

      reimbursementRepository.items = mockReimbursements

      const result = await reimbursementService.findAll(query, clientUser)

      expect(result).toBeDefined()
      expect(result.reimbursements).toHaveLength(1)
      expect(result.reimbursements[0].user.id).toBe(clientUser.id)
    })
  })

  describe('findOne', () => {
    it('should return a reimbursement by id', async () => {
      const mockReimbursement: Partial<Reimbursement> = {
        id: '1',
        requestNumber: 'RMB-12345678',
        status: ReimbursementStatus.SUBMITTED,
        totalRequestedAmount: 100,
        items: [],
        user: mockUser,
        contract: mockContract as Contract,
      }

      reimbursementRepository.queryBuilder.setGetOneResult(mockReimbursement)
      reimbursementRepository.items = [mockReimbursement as Reimbursement]

      const result = await reimbursementService.findOne('1')

      expect(result).toBeDefined()
      expect(result.id).toBe('1')
      expect(result.requestNumber).toBe('RMB-12345678')
    })

    it('should throw NotFoundException when reimbursement not found', async () => {
      reimbursementRepository.queryBuilder.setGetOneResult(null)

      await expect(reimbursementService.findOne('999')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update a submitted reimbursement', async () => {
      const mockReimbursement: Partial<Reimbursement> = {
        id: '1',
        requestNumber: 'RMB-12345678',
        status: ReimbursementStatus.SUBMITTED,
        totalRequestedAmount: 100,
        items: [createMockReimbursementItem()],
        user: mockUser,
        contract: mockContract as Contract,
      }

      const updateReimbursementDto: UpdateReimbursementDto = {
        notes: 'Updated notes',
        items: [
          {
            id: '1',
            description: 'Updated item',
            requestedAmount: 150,
          },
        ],
      }

      reimbursementRepository.queryBuilder.setGetOneResult(mockReimbursement)
      reimbursementRepository.items = [mockReimbursement as Reimbursement]
      reimbursementItemRepository.items = mockReimbursement.items as ReimbursementItem[]

      const result = await reimbursementService.update('1', updateReimbursementDto)

      expect(result).toBeDefined()
      expect(result.reviewerNotes).toBe('Updated notes')
      expect(result.totalRequestedAmount).toBe(150)
    })

    it('should throw BadRequestException when updating non-submitted reimbursement', async () => {
      const mockReimbursement: Partial<Reimbursement> = {
        id: '1',
        requestNumber: 'RMB-12345678',
        status: ReimbursementStatus.APPROVED,
        totalRequestedAmount: 100,
        items: [],
        user: mockUser,
        contract: mockContract as Contract,
      }

      const updateReimbursementDto: UpdateReimbursementDto = {
        notes: 'Updated notes',
      }

      reimbursementRepository.queryBuilder.setGetOneResult(mockReimbursement)
      reimbursementRepository.items = [mockReimbursement as Reimbursement]

      await expect(reimbursementService.update('1', updateReimbursementDto)).rejects.toThrow(BadRequestException)
    })
  })

  describe('reviewReimbursement', () => {
    it('should review and approve a reimbursement', async () => {
      const mockReimbursement: Partial<Reimbursement> = {
        id: '1',
        requestNumber: 'RMB-12345678',
        status: ReimbursementStatus.SUBMITTED,
        totalRequestedAmount: 100,
        items: [createMockReimbursementItem()],
        user: mockUser,
        contract: mockContract as Contract,
      }

      reimbursementRepository.queryBuilder.setGetOneResult(mockReimbursement)
      reimbursementRepository.items = [mockReimbursement as Reimbursement]
      reimbursementItemRepository.items = mockReimbursement.items as ReimbursementItem[]

      const reviewReimbursementDto: ReviewReimbursementDto = {
        status: ReimbursementStatus.APPROVED,
        reviewerNotes: 'Approved reimbursement',
        items: [
          {
            id: '1',
            status: ReimbursementItemStatus.APPROVED,
            approvedAmount: 100,
          },
        ],
      }

      const result = await reimbursementService.reviewReimbursement('1', reviewReimbursementDto, mockUser)

      expect(result).toBeDefined()
      expect(result.status).toBe(ReimbursementStatus.APPROVED)
      expect(result.reviewerNotes).toBe('Approved reimbursement')
      expect(result.totalApprovedAmount).toBe(100)
      expect(result.items[0].status).toBe(ReimbursementItemStatus.APPROVED)
    })

    it('should partially approve a reimbursement', async () => {
      const mockReimbursement: Partial<Reimbursement> = {
        id: '1',
        requestNumber: 'RMB-12345678',
        status: ReimbursementStatus.SUBMITTED,
        totalRequestedAmount: 200,
        items: [
          createMockReimbursementItem({ id: '1', requestedAmount: 100 }),
          createMockReimbursementItem({ id: '2', requestedAmount: 100 }),
        ],
        user: mockUser,
        contract: mockContract as Contract,
      }

      reimbursementRepository.queryBuilder.setGetOneResult(mockReimbursement)
      reimbursementRepository.items = [mockReimbursement as Reimbursement]
      reimbursementItemRepository.items = mockReimbursement.items as ReimbursementItem[]

      const reviewReimbursementDto: ReviewReimbursementDto = {
        status: ReimbursementStatus.APPROVED,
        items: [
          {
            id: '1',
            status: ReimbursementItemStatus.APPROVED,
            approvedAmount: 100,
          },
          {
            id: '2',
            status: ReimbursementItemStatus.REJECTED,
            rejectionReason: 'Invalid document',
          },
        ],
      }

      const result = await reimbursementService.reviewReimbursement('1', reviewReimbursementDto, mockUser)

      expect(result).toBeDefined()
      expect(result.status).toBe(ReimbursementStatus.PARTIALLY_APPROVED)
      expect(result.totalApprovedAmount).toBe(100)
      expect(result.items[0].status).toBe(ReimbursementItemStatus.APPROVED)
      expect(result.items[1].status).toBe(ReimbursementItemStatus.REJECTED)
      expect(result.items[1].rejectionReason).toBe('Invalid document')
    })
  })

  describe('remove', () => {
    it('should soft delete a reimbursement', async () => {
      const mockReimbursement: Partial<Reimbursement> = {
        id: '1',
        requestNumber: 'RMB-12345678',
        status: ReimbursementStatus.SUBMITTED,
        totalRequestedAmount: 100,
        items: [],
        user: mockUser,
        contract: mockContract as Contract,
      }

      reimbursementRepository.queryBuilder.setGetOneResult(mockReimbursement)
      reimbursementRepository.items = [mockReimbursement as Reimbursement]

      await reimbursementService.remove('1')

      expect(reimbursementRepository.items[0].deletedAt).toBeDefined()
    })
  })
})
