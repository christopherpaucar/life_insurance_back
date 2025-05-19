import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Contract, ContractStatus } from '../entities/contract.entity'
import { Beneficiary, RelationshipType } from '../entities/beneficiary.entity'
import { Attachment, AttachmentType } from '../entities/attachment.entity'
import { PaymentStatus } from '../entities/payment.entity'
import { CreateContractDto } from '../dto/create-contract.dto'
import { UpdateContractDto } from '../dto/update-contract.dto'
import { SignContractDto } from '../dto/sign-contract.dto'
import { PaymentService } from './payment.service'
import { SignatureService } from './signature.service'
import { format } from 'date-fns'
import { ClientService } from '../../client/services/client.service'
import { User } from '../../auth/entities/user.entity'
import { RoleType } from '../../auth/entities/role.entity'

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Beneficiary)
    private beneficiaryRepository: Repository<Beneficiary>,
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
    private clientService: ClientService,
    private paymentService: PaymentService,
    private signatureService: SignatureService,
  ) {}

  async create(createContractDto: CreateContractDto): Promise<Contract> {
    const contractNumber = `INS-${Date.now().toString().slice(-8)}`
    const client = await this.clientService.findOneByUserId(createContractDto.clientId)

    const contract = this.contractRepository.create({
      contractNumber,
      status: ContractStatus.DRAFT,
      startDate: new Date(createContractDto.startDate),
      endDate: new Date(createContractDto.endDate),
      totalAmount: createContractDto.totalAmount,
      paymentFrequency: createContractDto.paymentFrequency,
      notes: createContractDto.notes,
      client: { id: client.id },
      insurance: { id: createContractDto.insuranceId },
      installmentAmount: 0,
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

    await this.paymentService.generatePaymentSchedule(savedContract)
    return this.findOne(savedContract.id)
  }

  async findAll(query, user: User): Promise<{ contracts: Contract[]; total: number; page: number; limit: number }> {
    if (user.roles[0].name === RoleType.CLIENT) {
      query.userId = user.id
    }

    const page = query.page ? parseInt(query.pages as string, 10) : 1
    const limit = query.limit ? parseInt(query.limit as string, 10) : 10
    const skip = (page - 1) * limit

    const queryBuilder = this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.client', 'client')
      .leftJoinAndSelect('contract.insurance', 'insurance')
      .leftJoinAndSelect('contract.beneficiaries', 'beneficiaries')
      .leftJoinAndSelect('contract.payments', 'payments')
      .leftJoinAndSelect('contract.attachments', 'attachments')
      .skip(skip)
      .take(limit)
      .orderBy('contract.createdAt', 'DESC')

    if (query.status) {
      queryBuilder.andWhere('contract.status = :status', { status: query.status.toLowerCase() })
    }

    if (query.clientId) {
      queryBuilder.andWhere('contract.client_id = :clientId', { clientId: query.clientId })
    }

    if (query.hasDuePayments === 'true') {
      queryBuilder.andWhere('payments.status = :paymentStatus', { paymentStatus: PaymentStatus.OVERDUE })
    }

    if (query.userId) {
      queryBuilder.andWhere('client.userId = :userId', { userId: query.userId })
    }

    const [contracts, total] = await queryBuilder.getManyAndCount()

    return { contracts, total, page, limit }
  }

  async findOne(id: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['client', 'insurance', 'beneficiaries', 'payments', 'attachments'],
    })

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
      payments: contract.payments,
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
      (updateContractDto.startDate &&
        format(new Date(updateContractDto.startDate), 'yyyy-MM-dd') !== format(contract.startDate, 'yyyy-MM-dd')) ||
      (updateContractDto.endDate &&
        format(new Date(updateContractDto.endDate), 'yyyy-MM-dd') !== format(contract.endDate, 'yyyy-MM-dd')) ||
      updateContractDto.totalAmount !== contract.totalAmount
    ) {
      await this.paymentService.deletePaymentsForContract(id)

      await this.paymentService.generatePaymentSchedule(updatedContract)
    }

    return await this.contractRepository.save(updatedContract)
  }

  async signContract(id: string, signContractDto: SignContractDto): Promise<Contract> {
    const contract = await this.findOne(id)

    if (contract.status !== ContractStatus.PENDING_SIGNATURE) {
      throw new BadRequestException('Contract must be in PENDING_SIGNATURE status to be signed')
    }

    const signatureUrl = await this.signatureService.processSignature(signContractDto.signatureData)

    contract.signatureUrl = signatureUrl
    contract.signedAt = new Date()
    contract.status = ContractStatus.ACTIVE

    const contractAttachment = this.attachmentRepository.create({
      fileName: `Contract_${contract.contractNumber}.pdf`,
      fileUrl: signContractDto.documentUrl || `contracts/${contract.id}/contract.pdf`,
      type: AttachmentType.CONTRACT,
      description: 'Signed contract document',
      contract,
    })

    await this.attachmentRepository.save(contractAttachment)

    return await this.contractRepository.save(contract)
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

    if (status === ContractStatus.ACTIVE && contract.status !== ContractStatus.PENDING_SIGNATURE) {
      throw new BadRequestException('Contract must be signed before becoming active')
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
