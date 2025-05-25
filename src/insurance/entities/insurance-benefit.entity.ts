import { Entity, Column, ManyToMany, JoinTable } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Insurance } from './insurance.entity'

@Entity('insurance_benefits')
export class InsuranceBenefit extends BaseEntity {
  @Column()
  name: string

  @Column('text')
  description: string

  @Column('decimal', { precision: 10, scale: 2 })
  additionalCost: number

  @ManyToMany(() => Insurance, (insurance) => insurance.benefits)
  @JoinTable({
    name: 'insurance_benefit_relations',
    joinColumn: { name: 'benefit_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'insurance_id', referencedColumnName: 'id' },
  })
  insurances: Insurance[]
}
