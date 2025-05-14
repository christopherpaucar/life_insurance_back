import { Entity, Column, OneToMany } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { InsuranceCoverage } from './insurance-coverage.entity'
import { InsuranceBenefit } from './insurance-benefit.entity'

export enum InsuranceType {
  LIFE = 'life',
  HEALTH = 'health',
}

export enum PaymentFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

@Entity('insurances')
export class Insurance extends BaseEntity {
  @Column()
  name: string

  @Column('text')
  description: string

  @Column({
    type: 'enum',
    enum: InsuranceType,
  })
  type: InsuranceType

  @Column('decimal', { precision: 10, scale: 2 })
  basePrice: number

  @Column('json', { nullable: true })
  requirements: string[]

  @Column({
    type: 'enum',
    enum: PaymentFrequency,
    array: true,
    default: [PaymentFrequency.MONTHLY],
  })
  availablePaymentFrequencies: PaymentFrequency[]

  @OneToMany(() => InsuranceCoverage, (coverage) => coverage.insurance)
  coverages: InsuranceCoverage[]

  @OneToMany(() => InsuranceBenefit, (benefit) => benefit.insurance)
  benefits: InsuranceBenefit[]
}
