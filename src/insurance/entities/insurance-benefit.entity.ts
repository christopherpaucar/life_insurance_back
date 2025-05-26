import { Entity, Column, OneToMany } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { InsuranceBenefitRelation } from './insurance-benefit-relation.entity'

export interface InsuranceBenefitDTO {
  id: string
  name: string
  description: string
}

@Entity('insurance_benefits')
export class InsuranceBenefit extends BaseEntity {
  @Column()
  name: string

  @Column('text')
  description: string

  @OneToMany(() => InsuranceBenefitRelation, (relation) => relation.benefit)
  insurance: InsuranceBenefitRelation[]

  static toDTO(insuranceBenefit: InsuranceBenefit): InsuranceBenefitDTO {
    return {
      id: insuranceBenefit.id,
      name: insuranceBenefit.name,
      description: insuranceBenefit.description,
    }
  }
}
