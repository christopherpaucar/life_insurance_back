import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Contract } from '../../contract/entities/contract.entity'
import { ReimbursementItem } from './reimbursement-item.entity'
import { User } from '../../auth/entities/user.entity'

export enum ReimbursementStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  PARTIALLY_APPROVED = 'partially_approved',
  REJECTED = 'rejected',
  PAID = 'paid',
}

@Entity('reimbursements')
export class Reimbursement extends BaseEntity {
  @Column()
  requestNumber: string

  @Column({ type: 'enum', enum: ReimbursementStatus, default: ReimbursementStatus.SUBMITTED })
  status: ReimbursementStatus

  @Column({ nullable: true })
  reviewerNotes: string

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalRequestedAmount: number

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalApprovedAmount: number

  @Column({ nullable: true })
  paidAt: Date

  @Column({ nullable: true })
  reviewedAt: Date

  @Column({ nullable: true })
  reviewerId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract

  @OneToMany(() => ReimbursementItem, (item) => item.reimbursement, { cascade: true })
  items: ReimbursementItem[]
}
