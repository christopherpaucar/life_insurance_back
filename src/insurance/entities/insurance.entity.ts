import { Entity, Column, OneToMany } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { InsuranceCoverageRelation } from './insurance-coverage-relation.entity'
import { InsuranceBenefitRelation } from './insurance-benefit-relation.entity'

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
  order: number

  @Column({
    type: 'enum',
    enum: PaymentFrequency,
    array: true,
    default: [PaymentFrequency.MONTHLY],
  })
  availablePaymentFrequencies: PaymentFrequency[]

  @OneToMany(() => InsuranceCoverageRelation, (relation) => relation.insurance)
  coverages: InsuranceCoverageRelation[]

  @OneToMany(() => InsuranceBenefitRelation, (relation) => relation.insurance)
  benefits: InsuranceBenefitRelation[]
}
