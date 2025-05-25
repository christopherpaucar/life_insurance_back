import { Entity, Column, ManyToMany, JoinTable } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Insurance } from './insurance.entity'

@Entity('insurance_coverages')
export class InsuranceCoverage extends BaseEntity {
  @Column()
  name: string

  @Column('text')
  description: string

  @Column('decimal', { precision: 10, scale: 2 })
  coverageAmount: number

  @Column('decimal', { precision: 10, scale: 2 })
  additionalCost: number

  @ManyToMany(() => Insurance, (insurance) => insurance.coverages)
  @JoinTable({
    name: 'insurance_coverage_relations',
    joinColumn: { name: 'coverage_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'insurance_id', referencedColumnName: 'id' },
  })
  insurances: Insurance[]
}
