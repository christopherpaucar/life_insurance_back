import { Entity, Column, ManyToMany, JoinTable } from 'typeorm'
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

  @Column('int', { default: 0 })
  rank: number

  @Column({
    type: 'enum',
    enum: PaymentFrequency,
    array: true,
    default: [PaymentFrequency.MONTHLY],
  })
  availablePaymentFrequencies: PaymentFrequency[]

  @ManyToMany(() => InsuranceCoverage, (coverage) => coverage.insurances)
  @JoinTable({
    name: 'insurance_coverage_relations',
    joinColumn: { name: 'insurance_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'coverage_id', referencedColumnName: 'id' },
  })
  coverages: InsuranceCoverage[]

  @ManyToMany(() => InsuranceBenefit, (benefit) => benefit.insurances)
  @JoinTable({
    name: 'insurance_benefit_relations',
    joinColumn: { name: 'insurance_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'benefit_id', referencedColumnName: 'id' },
  })
  benefits: InsuranceBenefit[]
}
