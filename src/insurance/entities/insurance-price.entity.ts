import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Insurance } from './insurance.entity'

export enum PaymentFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

@Entity('insurance_prices')
export class InsurancePrice extends BaseEntity {
  @Column('decimal', { precision: 10, scale: 2 })
  price: number

  @Column({
    type: 'enum',
    enum: PaymentFrequency,
  })
  frequency: PaymentFrequency

  @ManyToOne(() => Insurance, (insurance) => insurance.prices)
  @JoinColumn({ name: 'insurance_id' })
  insurance: Insurance
}
