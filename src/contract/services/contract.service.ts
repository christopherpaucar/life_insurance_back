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

  async findAll(query): Promise<{ contracts: Contract[]; total: number; page: number; limit: number }> {
    const page = query.page ? parseInt(query.page, 10) : 1
    const limit = query.limit ? parseInt(query.limit, 10) : 10
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

    // Apply filters if provided
    if (query.status) {
      queryBuilder.andWhere('contract.status = :status', { status: query.status })
    }

    if (query.clientId) {
      queryBuilder.andWhere('contract.client_id = :clientId', { clientId: query.clientId })
    }

    // Check for due payments
    if (query.hasDuePayments === 'true') {
      queryBuilder.andWhere('payments.status = :paymentStatus', { paymentStatus: PaymentStatus.OVERDUE })
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

    // Don't allow updates for signed contracts
    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException('Cannot update a contract that is not in draft status')
    }

    // Update basic contract info
    const updatedContract = Object.assign(contract, {
      ...updateContractDto,
      payments: contract.payments,
      beneficiaries: contract.beneficiaries,
      attachments: contract.attachments,
    })

    // Update beneficiaries if provided
    if (updateContractDto.beneficiaries && updateContractDto.beneficiaries.length > 0) {
      // Delete existing beneficiaries
      await this.beneficiaryRepository.delete({ contract: { id } })

      // Create new beneficiaries
      const beneficiaries = updateContractDto.beneficiaries.map((beneficiary) => {
        // Split the name into firstName and lastName
        const nameParts = (beneficiary.name || '').split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        // Map the string relationship to RelationshipType enum
        const relationshipStr = (beneficiary.relationship || '').toLowerCase()
        let relationship = RelationshipType.OTHER

        // Check if the relationship string is a valid enum value
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

    // Re-generate payment schedule if payment details changed
    if (
      updateContractDto.paymentFrequency !== contract.paymentFrequency ||
      format(updateContractDto.startDate ?? new Date(), 'yyyy-MM-dd') !== format(contract.startDate, 'yyyy-MM-dd') ||
      format(updateContractDto.endDate ?? new Date(), 'yyyy-MM-dd') !== format(contract.endDate, 'yyyy-MM-dd') ||
      updateContractDto.totalAmount !== contract.totalAmount
    ) {
      // Delete existing payments
      await this.paymentService.deletePaymentsForContract(id)

      // Re-generate payment schedule
      await this.paymentService.generatePaymentSchedule(updatedContract)
    }

    return await this.contractRepository.save(updatedContract)
  }

  async signContract(id: string, signContractDto: SignContractDto): Promise<Contract> {
    const contract = await this.findOne(id)

    // Verify the contract is ready for signature
    if (contract.status !== ContractStatus.PENDING_SIGNATURE) {
      throw new BadRequestException('Contract must be in PENDING_SIGNATURE status to be signed')
    }

    // Process signature using signature service
    const signatureUrl = await this.signatureService.processSignature(signContractDto.signatureData)

    // Update contract with signature information
    contract.signatureUrl = signatureUrl
    contract.signedAt = new Date()
    contract.status = ContractStatus.ACTIVE

    // Create a contract document attachment
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

    // Validate status transition
    if (status === ContractStatus.ACTIVE && contract.status !== ContractStatus.PENDING_SIGNATURE) {
      throw new BadRequestException('Contract must be signed before becoming active')
    }

    contract.status = status

    return await this.contractRepository.save(contract)
  }

  async remove(id: string): Promise<void> {
    const contract = await this.findOne(id)

    // Check if contract can be deleted
    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException('Only draft contracts can be deleted')
    }

    await this.contractRepository.remove(contract)
  }
}
