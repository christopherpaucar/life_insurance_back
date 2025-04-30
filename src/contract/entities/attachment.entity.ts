import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Contract } from './contract.entity'

export enum AttachmentType {
  IDENTIFICATION = 'identification',
  MEDICAL_RECORD = 'medical_record',
  MEDICAL_EXAM = 'medical_exam',
  CONTRACT = 'contract',
  REIMBURSEMENT = 'reimbursement',
  INVOICE = 'invoice',
  OTHER = 'other',
}

@Entity('attachments')
export class Attachment extends BaseEntity {
  @Column()
  fileName: string

  @Column()
  fileUrl: string

  @Column({ type: 'enum', enum: AttachmentType })
  type: AttachmentType

  @Column({ nullable: true })
  description: string

  @ManyToOne(() => Contract, (contract) => contract.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract
}
