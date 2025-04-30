import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Reimbursement, ReimbursementStatus } from '../entities/reimbursement.entity'
import { ReimbursementItem, ReimbursementItemStatus } from '../entities/reimbursement-item.entity'
import { CreateReimbursementDto } from '../dto/create-reimbursement.dto'
import { UpdateReimbursementDto } from '../dto/update-reimbursement.dto'
import { ReviewReimbursementDto } from '../dto/review-reimbursement.dto'

@Injectable()
export class ReimbursementService {
  constructor(
    @InjectRepository(Reimbursement)
    private reimbursementRepository: Repository<Reimbursement>,
    @InjectRepository(ReimbursementItem)
    private reimbursementItemRepository: Repository<ReimbursementItem>,
  ) {}

  async create(createReimbursementDto: CreateReimbursementDto): Promise<Reimbursement> {
    // Generate a request number
    const requestNumber = `RMB-${Date.now().toString().slice(-8)}`

    // Create the reimbursement
    const reimbursement = this.reimbursementRepository.create({
      ...createReimbursementDto,
      requestNumber,
      status: ReimbursementStatus.SUBMITTED,
      totalRequestedAmount: createReimbursementDto.items.reduce((sum, item) => sum + Number(item.requestedAmount), 0),
    })

    // Save the reimbursement to get an ID
    const savedReimbursement = await this.reimbursementRepository.save(reimbursement)

    // If items are included, save them
    if (createReimbursementDto.items && createReimbursementDto.items.length > 0) {
      // Create items with reference to the saved reimbursement
      const items = createReimbursementDto.items.map((item) =>
        this.reimbursementItemRepository.create({
          ...item,
          reimbursement: savedReimbursement,
          status: ReimbursementItemStatus.PENDING,
        }),
      )

      // Save all items
      await this.reimbursementItemRepository.save(items)
    }

    // Return the reimbursement with items
    return this.findOne(savedReimbursement.id)
  }

  async findAll(query): Promise<{ reimbursements: Reimbursement[]; total: number; page: number; limit: number }> {
    const page = query.page ? parseInt(query.page, 10) : 1
    const limit = query.limit ? parseInt(query.limit, 10) : 10
    const skip = (page - 1) * limit

    // Build the query with filters
    const queryBuilder = this.reimbursementRepository
      .createQueryBuilder('reimbursement')
      .leftJoinAndSelect('reimbursement.client', 'client')
      .leftJoinAndSelect('reimbursement.contract', 'contract')
      .leftJoinAndSelect('reimbursement.items', 'items')
      .skip(skip)
      .take(limit)
      .orderBy('reimbursement.createdAt', 'DESC')

    // Apply status filter if provided
    if (query.status) {
      queryBuilder.andWhere('reimbursement.status = :status', { status: query.status })
    }

    // Apply date range filter if provided
    if (query.startDate && query.endDate) {
      queryBuilder.andWhere('reimbursement.createdAt BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate,
      })
    }

    const [reimbursements, total] = await queryBuilder.getManyAndCount()

    return { reimbursements, total, page, limit }
  }

  async findAllByClient(
    clientId: string,
    query,
  ): Promise<{ reimbursements: Reimbursement[]; total: number; page: number; limit: number }> {
    const page = query.page ? parseInt(query.page, 10) : 1
    const limit = query.limit ? parseInt(query.limit, 10) : 10
    const skip = (page - 1) * limit

    const queryBuilder = this.reimbursementRepository
      .createQueryBuilder('reimbursement')
      .leftJoinAndSelect('reimbursement.contract', 'contract')
      .leftJoinAndSelect('reimbursement.items', 'items')
      .where('reimbursement.client_id = :clientId', { clientId })
      .skip(skip)
      .take(limit)
      .orderBy('reimbursement.createdAt', 'DESC')

    // Apply status filter if provided
    if (query.status) {
      queryBuilder.andWhere('reimbursement.status = :status', { status: query.status })
    }

    const [reimbursements, total] = await queryBuilder.getManyAndCount()

    return { reimbursements, total, page, limit }
  }

  async findOne(id: string): Promise<Reimbursement> {
    const reimbursement = await this.reimbursementRepository.findOne({
      where: { id },
      relations: ['client', 'contract', 'items'],
    })

    if (!reimbursement) {
      throw new NotFoundException(`Reimbursement with ID ${id} not found`)
    }

    return reimbursement
  }

  async update(id: string, updateReimbursementDto: UpdateReimbursementDto): Promise<Reimbursement> {
    const reimbursement = await this.findOne(id)

    // Don't allow updates if already reviewed
    if (
      reimbursement.status !== ReimbursementStatus.SUBMITTED &&
      reimbursement.status !== ReimbursementStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException('Cannot update a reimbursement that has been approved, rejected, or paid')
    }

    // Update basic reimbursement info
    if (updateReimbursementDto.notes) {
      reimbursement.reviewerNotes = updateReimbursementDto.notes
    }

    // Update items if provided
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

      // Recalculate total requested amount
      const updatedItems = await this.reimbursementItemRepository.find({
        where: { reimbursement: { id: reimbursement.id } },
      })

      reimbursement.totalRequestedAmount = updatedItems.reduce((sum, item) => sum + Number(item.requestedAmount), 0)
    }

    return await this.reimbursementRepository.save(reimbursement)
  }

  async reviewReimbursement(id: string, reviewReimbursementDto: ReviewReimbursementDto): Promise<Reimbursement> {
    const reimbursement = await this.findOne(id)

    // Update reimbursement status
    reimbursement.status = reviewReimbursementDto.status
    reimbursement.reviewerId = reviewReimbursementDto.reviewerId
    reimbursement.reviewedAt = new Date()

    if (reviewReimbursementDto.reviewerNotes) {
      reimbursement.reviewerNotes = reviewReimbursementDto.reviewerNotes
    }

    // Process item-level approvals/rejections if provided
    if (reviewReimbursementDto.items && reviewReimbursementDto.items.length > 0) {
      let totalApprovedAmount = 0

      for (const itemReview of reviewReimbursementDto.items) {
        const item = reimbursement.items.find((i) => i.id === itemReview.id)

        if (item) {
          // Update item status
          item.status = itemReview.status

          // Handle approved or rejected item
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

      // Update total approved amount and determine if partially approved
      reimbursement.totalApprovedAmount = totalApprovedAmount

      // If all items reviewed but some approved and some rejected, mark as partially approved
      if (totalApprovedAmount > 0 && totalApprovedAmount < reimbursement.totalRequestedAmount) {
        reimbursement.status = ReimbursementStatus.PARTIALLY_APPROVED
      }
    } else {
      // If no item-level reviews, set the approved amount based on the overall status
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
    const reimbursement = await this.findOne(id)
    await this.reimbursementRepository.remove(reimbursement)
  }
}
