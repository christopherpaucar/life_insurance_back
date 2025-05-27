import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Contract } from './contract.entity'

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  IN_RETRY = 'in_retry',
}

@Entity('transactions')
export class Transaction extends BaseEntity {
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus

  @Column({ default: 0 })
  retryCount: number

  @Column({ type: 'date', nullable: true })
  nextPaymentDate: Date

  @Column({ type: 'date', nullable: true })
  nextRetryPaymentDate: Date

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract
}
