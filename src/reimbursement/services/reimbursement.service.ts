import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Reimbursement, ReimbursementStatus } from '../entities/reimbursement.entity'
import { ReimbursementItem, ReimbursementItemStatus } from '../entities/reimbursement-item.entity'
import { CreateReimbursementDto } from '../dto/create-reimbursement.dto'
import { UpdateReimbursementDto } from '../dto/update-reimbursement.dto'
import { ReviewReimbursementDto } from '../dto/review-reimbursement.dto'
import { User } from '../../auth/entities/user.entity'
import { RoleType } from '../../auth/entities/role.entity'
import { ContractService } from '../../contract/services/contract.service'

@Injectable()
export class ReimbursementService {
  constructor(
    @InjectRepository(Reimbursement)
    private reimbursementRepository: Repository<Reimbursement>,
    @InjectRepository(ReimbursementItem)
    private reimbursementItemRepository: Repository<ReimbursementItem>,
    private contractService: ContractService,
  ) {}

  async create(data: CreateReimbursementDto, user: User): Promise<Reimbursement> {
    const requestNumber = `RMB-${Date.now().toString().slice(-8)}`

    const contract = await this.contractService.findOne(data.contractId)

    const reimbursement = this.reimbursementRepository.create({
      ...data,
      requestNumber,
      status: ReimbursementStatus.SUBMITTED,
      totalRequestedAmount: data.items.reduce((sum, item) => sum + Number(item.requestedAmount), 0),
      user,
      contract,
    })

    const savedReimbursement = await this.reimbursementRepository.save(reimbursement)

    if (data.items && data.items.length > 0) {
      const items = data.items.map((item) =>
        this.reimbursementItemRepository.create({
          ...item,
          reimbursement: savedReimbursement,
          status: ReimbursementItemStatus.PENDING,
        }),
      )

      await this.reimbursementItemRepository.save(items)
    }

    return this.findOne(savedReimbursement.id)
  }

  async findAll(
    query,
    user: User,
  ): Promise<{ reimbursements: Reimbursement[]; total: number; page: number; limit: number }> {
    const { role } = user

    const page = query.page ? parseInt(query.page, 10) : 1
    const limit = query.limit ? parseInt(query.limit, 10) : 10
    const skip = (page - 1) * limit

    const queryBuilder = this.reimbursementRepository
      .createQueryBuilder('reimbursement')
      .leftJoinAndSelect('reimbursement.items', 'items')
      .leftJoinAndSelect('reimbursement.contract', 'contract')
      .leftJoin('reimbursement.user', 'user')
      .select(['reimbursement', 'user.id', 'user.email', 'contract', 'items'])
      .skip(skip)
      .take(limit)
      .orderBy('reimbursement.createdAt', 'DESC')

    if (query.status) {
      queryBuilder.andWhere('reimbursement.status = :status', { status: query.status })
    }

    if (role && role.name === RoleType.CLIENT) {
      queryBuilder.where('reimbursement.user_id = :userId', { userId: user.id })
    }

    if (query.startDate && query.endDate) {
      queryBuilder.andWhere('reimbursement.createdAt BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate,
      })
    }

    const [reimbursements, total] = await queryBuilder.getManyAndCount()

    return { reimbursements, total, page, limit }
  }

  async findOne(id: string): Promise<Reimbursement> {
    const reimbursement = await this.reimbursementRepository
      .createQueryBuilder('reimbursement')
      .leftJoinAndSelect('reimbursement.contract', 'contract')
      .leftJoinAndSelect('reimbursement.items', 'items')
      .leftJoin('reimbursement.user', 'user')
      .select(['reimbursement', 'user.id', 'user.email', 'contract', 'items'])
      .where('reimbursement.id = :id', { id })
      .getOne()

    if (!reimbursement) {
      throw new NotFoundException(`Reimbursement with ID ${id} not found`)
    }

    return reimbursement
  }

  async update(id: string, updateReimbursementDto: UpdateReimbursementDto): Promise<Reimbursement> {
    const reimbursement = await this.findOne(id)

    if (
      reimbursement.status !== ReimbursementStatus.SUBMITTED &&
      reimbursement.status !== ReimbursementStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException('Cannot update a reimbursement that has been approved, rejected, or paid')
    }

    if (updateReimbursementDto.notes) {
      reimbursement.reviewerNotes = updateReimbursementDto.notes
    }

    if (updateReimbursementDto.items && updateReimbursementDto.items.length > 0) {
      for (const itemUpdate of updateReimbursementDto.items) {
        if (!itemUpdate.id) continue

        const item = reimbursement.items.find((i) => i.id === itemUpdate.id)
        if (item) {
          await this.reimbursementItemRepository.update(item.id, {
            description: itemUpdate.description || item.description,
            requestedAmount: itemUpdate.requestedAmount || item.requestedAmount,
            documentUrl: itemUpdate.documentUrl || item.documentUrl,
          })
        }
      }

      const updatedItems = await this.reimbursementItemRepository.find({
        where: { reimbursement: { id: reimbursement.id } },
      })

      reimbursement.totalRequestedAmount = updatedItems.reduce((sum, item) => sum + Number(item.requestedAmount), 0)
    }

    return await this.reimbursementRepository.save(reimbursement)
  }

  async reviewReimbursement(
    id: string,
    reviewReimbursementDto: ReviewReimbursementDto,
    user: User,
  ): Promise<Reimbursement> {
    const reimbursement = await this.findOne(id)

    reimbursement.status = reviewReimbursementDto.status
    reimbursement.reviewerId = user.id
    reimbursement.reviewedAt = new Date()

    if (reviewReimbursementDto.reviewerNotes) {
      reimbursement.reviewerNotes = reviewReimbursementDto.reviewerNotes
    }

    if (reviewReimbursementDto.items && reviewReimbursementDto.items.length > 0) {
      let totalApprovedAmount = 0

      for (const itemReview of reviewReimbursementDto.items) {
        const item = reimbursement.items.find((i) => i.id === itemReview.id)

        if (item) {
          item.status = itemReview.status

          if (itemReview.status === ReimbursementItemStatus.APPROVED) {
            item.approvedAmount = itemReview.approvedAmount || item.requestedAmount
            totalApprovedAmount += Number(item.approvedAmount)
          } else if (itemReview.status === ReimbursementItemStatus.REJECTED) {
            if (itemReview.rejectionReason) {
              item.rejectionReason = itemReview.rejectionReason
            }
            item.approvedAmount = 0
          }

          await this.reimbursementItemRepository.save(item)
        }
      }

      reimbursement.totalApprovedAmount = totalApprovedAmount

      if (totalApprovedAmount > 0 && totalApprovedAmount < reimbursement.totalRequestedAmount) {
        reimbursement.status = ReimbursementStatus.PARTIALLY_APPROVED
      }
    } else {
      if (
        reimbursement.status === ReimbursementStatus.APPROVED ||
        reimbursement.status === ReimbursementStatus.PARTIALLY_APPROVED
      ) {
        reimbursement.totalApprovedAmount = reimbursement.totalRequestedAmount
      } else {
        reimbursement.totalApprovedAmount = 0
      }
    }

    return await this.reimbursementRepository.save(reimbursement)
  }

  async remove(id: string): Promise<void> {
    await this.reimbursementRepository.softDelete(id)
  }
}
