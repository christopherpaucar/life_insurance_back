import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Insurance } from '../../insurance/entities/insurance.entity'
import { Beneficiary } from './beneficiary.entity'
import { PaymentFrequency } from '../../insurance/entities/insurance-price.entity'
import { Attachment } from './attachment.entity'
import { User } from '../../auth/entities/user.entity'
import { PaymentMethod } from './payment-method.entity'
import { Transaction } from './transaction.entity'

export enum ContractStatus {
  DRAFT = 'draft',
  AWAITING_CLIENT_CONFIRMATION = 'awaiting_client_confirmation',
  PENDING_BASIC_DOCUMENTS = 'pending_basic_documents',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  INACTIVE = 'inactive',
}

@Entity('contracts')
export class Contract extends BaseEntity {
  @Column()
  contractNumber: string

  @Column({ type: 'enum', enum: ContractStatus, default: ContractStatus.DRAFT })
  status: ContractStatus

  @Column('date')
  startDate: Date

  @Column('date')
  endDate: Date

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  totalAmount: number

  @Column({ type: 'enum', enum: PaymentFrequency })
  paymentFrequency: PaymentFrequency

  @Column({ nullable: true })
  signatureUrl: string

  @Column({ nullable: true })
  signedAt: Date

  @Column({ nullable: true })
  notes: string

  @Column({ nullable: true })
  retireDate: Date

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => Insurance)
  @JoinColumn({ name: 'insurance_id' })
  insurance: Insurance

  @OneToMany(() => Beneficiary, (beneficiary) => beneficiary.contract, { cascade: true })
  beneficiaries: Beneficiary[]

  @OneToMany(() => Attachment, (attachment) => attachment.contract, { cascade: true })
  attachments: Attachment[]

  @ManyToOne(() => PaymentMethod)
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod

  @OneToMany(() => Transaction, (transaction) => transaction.contract, { cascade: true })
  transactions: Transaction[]
}
