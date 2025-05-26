import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Insurance } from './insurance.entity'
import { InsuranceCoverage } from './insurance-coverage.entity'

export interface InsuranceCoverageRelationDTO {
  id: string
  idRelation: string
  coverageAmount: number
  additionalCost: number
  name: string
  description: string
}

@Entity('insurance_coverage_relations')
export class InsuranceCoverageRelation extends BaseEntity {
  @Column('decimal', { precision: 10, scale: 2 })
  coverageAmount: number

  @Column('decimal', { precision: 10, scale: 2 })
  additionalCost: number

  @ManyToOne(() => Insurance, (insurance) => insurance.coverages)
  @JoinColumn({ name: 'insurance_id' })
  insurance: Insurance

  @ManyToOne(() => InsuranceCoverage, (coverage) => coverage.insurance)
  @JoinColumn({ name: 'coverage_id' })
  coverage: InsuranceCoverage
}
