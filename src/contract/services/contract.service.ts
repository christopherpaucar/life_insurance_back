import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Contract, ContractStatus } from '../entities/contract.entity'
import { Beneficiary, RelationshipType } from '../entities/beneficiary.entity'
import { Attachment, AttachmentType } from '../entities/attachment.entity'
import { TransactionStatus } from '../entities/transaction.entity'
import { CreateContractDto } from '../dto/create-contract.dto'
import { UpdateContractDto } from '../dto/update-contract.dto'
import { PaymentService } from './payment.service'
import { User } from '../../auth/entities/user.entity'
import { RoleType } from '../../auth/entities/role.entity'
import { InsuranceService } from '../../insurance/services/insurance.service'
import { PaymentFrequency } from '../../insurance/entities/insurance-price.entity'
import { ActivateContractDto } from '../dto/activate-contract.dto'
import { InsuranceCoverageRelation } from '../../insurance/entities/insurance-coverage-relation.entity'
import { InsuranceBenefitRelation } from '../../insurance/entities/insurance-benefit-relation.entity'
import { DateUtils } from '../../common/utils/date.utils'
import { PaymentMethod } from '../entities/payment-method.entity'
import { FileStorageService } from '../../common/services/file-storage.service'

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Beneficiary)
    private beneficiaryRepository: Repository<Beneficiary>,
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
    private paymentService: PaymentService,
    private insuranceService: InsuranceService,
    private fileStorageService: FileStorageService,
  ) {}

  async create(createContractDto: CreateContractDto, currentUser: User): Promise<Contract> {
    const insurance = await this.insuranceService.findOne(createContractDto.insuranceId)

    if (!insurance) {
      throw new NotFoundException('Insurance not found')
    }

    const contractNumber = `INS-${Date.now().toString().slice(-8)}`

    const contract = this.contractRepository.create({
      contractNumber,
      status: ContractStatus.DRAFT,
      startDate: new Date(createContractDto.startDate),
      endDate: new Date(createContractDto.endDate),
      totalAmount: 0,
      paymentFrequency: createContractDto.paymentFrequency,
      notes: createContractDto.notes,
      user: { id: currentUser.id },
      insurance: { id: createContractDto.insuranceId },
    })

    const savedContract = await this.contractRepository.save(contract)

    if (createContractDto.beneficiaries && createContractDto.beneficiaries.length > 0) {
      const beneficiaries = createContractDto.beneficiaries.map((beneficiary) => {
        const nameParts = (beneficiary.name || '').split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        const relationshipStr = (beneficiary.relationship || '').toLowerCase()
        let relationship = RelationshipType.OTHER

        if (Object.values(RelationshipType).includes(relationshipStr as RelationshipType)) {
          relationship = relationshipStr as RelationshipType
        }

        const beneficiaryEntity = this.beneficiaryRepository.create({
          firstName,
          lastName,
          relationship,
          percentage: beneficiary.percentage || 0,
          contactInfo: beneficiary.contactInfo,
        })

        beneficiaryEntity.contract = savedContract
        return beneficiaryEntity
      })

      await this.beneficiaryRepository.save(beneficiaries)
    }

    return this.findOne(savedContract.id)
  }

  async activate(id: string): Promise<Contract> {
    const contract = await this.findOne(id)

    if (contract.status === ContractStatus.ACTIVE) {
      throw new BadRequestException('Contract is already active')
    }

    const insurance = await this.insuranceService.findOne(contract.insurance.id)
    if (!insurance) {
      throw new NotFoundException('Insurance not found')
    }

    const insurancePrice = insurance.prices.find((price) => price.frequency === contract.paymentFrequency)
    if (!insurancePrice) {
      throw new BadRequestException(`Insurance price not found for frequency ${contract.paymentFrequency}`)
    }

    const totalAmount = this.calculateTotalPrice(
      insurancePrice.price,
      insurance.coverages,
      insurance.benefits,
      contract.paymentFrequency,
      contract.startDate,
      contract.endDate,
    )

    contract.totalAmount = totalAmount
    contract.status = ContractStatus.AWAITING_CLIENT_CONFIRMATION

    const updatedContract = await this.contractRepository.save(contract)
    await this.paymentService.generatePaymentSchedule(updatedContract)

    return this.findOne(updatedContract.id)
  }

  async confirmActivation(
    id: string,
    activateContractDto: ActivateContractDto,
    p12File: Express.Multer.File,
  ): Promise<Contract> {
    const contract = await this.findOne(id)

    if (contract.status !== ContractStatus.AWAITING_CLIENT_CONFIRMATION) {
      throw new BadRequestException('Contract must be in awaiting client confirmation status')
    }

    const p12UploadResult = await this.fileStorageService.uploadEntityFile(
      p12File.buffer ?? Buffer.from(''),
      'contract',
      id,
      AttachmentType.P12,
      {
        originalName: p12File.originalname,
        contentType: p12File.mimetype,
        size: p12File.size,
        entityId: id,
        entityType: 'contract',
        documentType: AttachmentType.P12,
        ownerId: contract.user.id,
        ownerType: 'user',
      },
    )

    const paymentMethod = this.paymentMethodRepository.create({
      type: activateContractDto.paymentMethodType,
      details: JSON.stringify(activateContractDto.paymentDetails),
      user: contract.user,
    })

    await this.paymentMethodRepository.save(paymentMethod)

    contract.paymentMethod = paymentMethod
    contract.status = ContractStatus.ACTIVE

    const p12Attachment = this.attachmentRepository.create({
      fileName: p12File.originalname,
      fileUrl: p12UploadResult.url,
      type: AttachmentType.P12,
      description: 'P12 certificate file',
      contract,
    })

    await this.attachmentRepository.save(p12Attachment)

    return await this.contractRepository.save(contract)
  }

  private calculatePayments(startDate: Date, endDate: Date, frequency: PaymentFrequency): number {
    const monthsBetween = DateUtils.monthsBetween(startDate, endDate)

    switch (frequency) {
      case PaymentFrequency.MONTHLY:
        return monthsBetween
      case PaymentFrequency.QUARTERLY:
        return Math.ceil(monthsBetween / 3)
      case PaymentFrequency.YEARLY:
        return Math.ceil(monthsBetween / 12)
      default:
        return monthsBetween
    }
  }

  private calculateTotalPrice(
    price: number,
    coverages: InsuranceCoverageRelation[],
    benefits: InsuranceBenefitRelation[],
    frequency: PaymentFrequency,
    startDate: Date,
    endDate: Date,
  ): number {
    const frecuencyMultiplier =
      frequency === PaymentFrequency.QUARTERLY ? 3 : frequency === PaymentFrequency.YEARLY ? 12 : 1

    const coveragesPrice =
      coverages?.reduce((acc, coverage) => acc + coverage.additionalCost * frecuencyMultiplier, 0) ?? 0
    const benefitsPrice = benefits?.reduce((acc, benefit) => acc + benefit.additionalCost * frecuencyMultiplier, 0) ?? 0

    const totalAmount = (price + coveragesPrice + benefitsPrice) * this.calculatePayments(startDate, endDate, frequency)

    return Math.round(totalAmount * 100) / 100
  }

  async findAll(
    query: any,
    user: User,
  ): Promise<{ contracts: Contract[]; total: number; page: number; limit: number }> {
    if (user.role.name === RoleType.CLIENT) {
      query.userId = user.id
    }

    const page = query.page ? parseInt(query.pages as string, 10) : 1
    const limit = query.limit ? parseInt(query.limit as string, 10) : 10
    const skip = (page - 1) * limit

    const queryBuilder = this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.beneficiaries', 'beneficiaries')
      .leftJoinAndSelect('contract.transactions', 'transactions')
      .leftJoinAndSelect('contract.attachments', 'attachments')
      .loadRelationIdAndMap('contract.user', 'contract.user')
      .leftJoinAndSelect('contract.insurance', 'insurance')
      .select(['contract', 'beneficiaries', 'transactions', 'attachments', 'insurance.id', 'insurance.name'])
      .skip(skip)
      .take(limit)
      .orderBy('contract.createdAt', 'DESC')

    if (query.status) {
      queryBuilder.andWhere('contract.status = :status', { status: query.status.toLowerCase() })
    }

    if (query.userId) {
      queryBuilder.andWhere('contract.user_id = :userId', { userId: query.userId })
    }

    if (query.hasDuePayments === 'true') {
      queryBuilder.andWhere('transactions.status = :paymentStatus', { paymentStatus: TransactionStatus.PENDING })
    }

    const [contracts, total] = await queryBuilder.getManyAndCount()

    return { contracts, total, page, limit }
  }

  async findOne(id: string): Promise<Contract> {
    const contract = await this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.beneficiaries', 'beneficiaries')
      .leftJoinAndSelect('contract.transactions', 'transactions')
      .leftJoinAndSelect('contract.attachments', 'attachments')
      .loadRelationIdAndMap('contract.user', 'contract.user')
      .leftJoinAndSelect('contract.insurance', 'insurance')
      .select(['contract', 'beneficiaries', 'transactions', 'attachments', 'insurance.id', 'insurance.name'])
      .where('contract.id = :id', { id })
      .getOne()

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`)
    }

    return contract
  }

  async update(id: string, updateContractDto: UpdateContractDto): Promise<Contract> {
    const contract = await this.findOne(id)

    if (contract.status === ContractStatus.ACTIVE) {
      throw new BadRequestException('Cannot update a contract that is active')
    }

    const updatedContract = Object.assign(contract, {
      ...updateContractDto,
      beneficiaries: contract.beneficiaries,
      attachments: contract.attachments,
    })

    if (updateContractDto.beneficiaries && updateContractDto.beneficiaries.length > 0) {
      await this.beneficiaryRepository.delete({ contract: { id } })

      const beneficiaries = updateContractDto.beneficiaries.map((beneficiary) => {
        const nameParts = (beneficiary.name || '').split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        const relationshipStr = (beneficiary.relationship || '').toLowerCase()
        let relationship = RelationshipType.OTHER

        if (Object.values(RelationshipType).includes(relationshipStr as RelationshipType)) {
          relationship = relationshipStr as RelationshipType
        }

        const beneficiaryEntity = this.beneficiaryRepository.create({
          firstName,
          lastName,
          relationship,
          percentage: beneficiary.percentage || 0,
          contactInfo: beneficiary.contactInfo,
        })

        beneficiaryEntity.contract = updatedContract
        return beneficiaryEntity
      })

      await this.beneficiaryRepository.save(beneficiaries)
    }

    if (
      updateContractDto.paymentFrequency !== contract.paymentFrequency ||
      updateContractDto?.startDate !== contract.startDate?.toISOString() ||
      updateContractDto?.endDate !== contract.endDate?.toISOString()
    ) {
      await this.paymentService.deletePaymentsForContract(id)

      await this.paymentService.generatePaymentSchedule(updatedContract)
    }

    return await this.contractRepository.save(updatedContract)
  }

  async addAttachment(
    contractId: string,
    attachmentData: { fileName: string; fileUrl: string; type: AttachmentType; description?: string },
  ): Promise<Contract> {
    const contract = await this.findOne(contractId)

    const attachment = this.attachmentRepository.create({
      ...attachmentData,
      contract,
    })

    await this.attachmentRepository.save(attachment)

    return this.findOne(contractId)
  }

  async changeStatus(id: string, status: ContractStatus): Promise<Contract> {
    const contract = await this.findOne(id)

    if (status === ContractStatus.ACTIVE && contract.status !== ContractStatus.AWAITING_CLIENT_CONFIRMATION) {
      throw new BadRequestException('Contract must be confirmed before becoming active')
    }

    contract.status = status

    return await this.contractRepository.save(contract)
  }

  async remove(id: string): Promise<void> {
    const contract = await this.findOne(id)

    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException('Only draft contracts can be deleted')
    }

    await this.contractRepository.remove(contract)
  }
}
