import { Entity, Column, OneToMany } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { InsuranceCoverageRelation } from './insurance-coverage-relation.entity'

export interface InsuranceCoverageDTO {
  id: string
  name: string
  description: string
}

@Entity('insurance_coverages')
export class InsuranceCoverage extends BaseEntity {
  @Column()
  name: string

  @Column('text')
  description: string

  @OneToMany(() => InsuranceCoverageRelation, (relation) => relation.coverage)
  insurance: InsuranceCoverageRelation[]

  static toDTO(insuranceCoverage: InsuranceCoverage): InsuranceCoverageDTO {
    return {
      id: insuranceCoverage.id,
      name: insuranceCoverage.name,
      description: insuranceCoverage.description,
    }
  }
}
