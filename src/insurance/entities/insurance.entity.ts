import { Entity, Column, OneToMany } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { InsuranceCoverageRelation } from './insurance-coverage-relation.entity'
import { InsuranceBenefitRelation } from './insurance-benefit-relation.entity'
import { InsurancePrice } from './insurance-price.entity'

export enum InsuranceType {
  LIFE = 'life',
  HEALTH = 'health',
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

  @Column('json', { nullable: true })
  requirements: string[]

  @Column('int', { default: 0 })
  order: number

  @OneToMany(() => InsuranceCoverageRelation, (relation) => relation.insurance)
  coverages: InsuranceCoverageRelation[]

  @OneToMany(() => InsuranceBenefitRelation, (relation) => relation.insurance)
  benefits: InsuranceBenefitRelation[]

  @OneToMany(() => InsurancePrice, (price) => price.insurance)
  prices: InsurancePrice[]
}
