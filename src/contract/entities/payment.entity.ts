import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Contract } from './contract.entity'

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  DIRECT_DEBIT = 'direct_debit',
  CASH = 'cash',
  OTHER = 'other',
}

@Entity('payments')
export class Payment extends BaseEntity {
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number

  @Column('date')
  dueDate: Date

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus

  @Column({ nullable: true })
  paidAt: Date

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod

  @Column({ nullable: true })
  transactionId: string

  @Column({ nullable: true })
  notes: string

  @ManyToOne(() => Contract, (contract) => contract.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract
}
