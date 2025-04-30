import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Reimbursement } from './reimbursement.entity'

export enum ReimbursementItemType {
  MEDICATION = 'medication',
  CONSULTATION = 'consultation',
  SURGERY = 'surgery',
  DIAGNOSTIC = 'diagnostic',
  HOSPITALIZATION = 'hospitalization',
  OTHER = 'other',
}

export enum ReimbursementItemStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('reimbursement_items')
export class ReimbursementItem extends BaseEntity {
  @Column({ type: 'enum', enum: ReimbursementItemType })
  type: ReimbursementItemType

  @Column()
  description: string

  @Column('date')
  serviceDate: Date

  @Column('decimal', { precision: 10, scale: 2 })
  requestedAmount: number

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  approvedAmount: number

  @Column({ type: 'enum', enum: ReimbursementItemStatus, default: ReimbursementItemStatus.PENDING })
  status: ReimbursementItemStatus

  @Column({ nullable: true })
  rejectionReason: string

  @Column({ nullable: true })
  documentUrl: string

  @ManyToOne(() => Reimbursement, (reimbursement) => reimbursement.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reimbursement_id' })
  reimbursement: Reimbursement
}
