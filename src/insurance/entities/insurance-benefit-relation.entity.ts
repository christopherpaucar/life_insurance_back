import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Insurance } from './insurance.entity'
import { InsuranceBenefit } from './insurance-benefit.entity'

export interface InsuranceBenefitRelationDTO {
  idRelation: string
  id: string
  additionalCost: number
  name: string
  description: string
}

@Entity('insurance_benefit_relations')
export class InsuranceBenefitRelation extends BaseEntity {
  @Column('decimal', { precision: 10, scale: 2 })
  additionalCost: number

  @ManyToOne(() => Insurance, (insurance) => insurance.benefits)
  @JoinColumn({ name: 'insurance_id' })
  insurance: Insurance

  @ManyToOne(() => InsuranceBenefit, (benefit) => benefit.insurance)
  @JoinColumn({ name: 'benefit_id' })
  benefit: InsuranceBenefit

  static toDTO(insuranceBenefitRelation: InsuranceBenefitRelation): InsuranceBenefitRelationDTO {
    const prevData = InsuranceBenefit.toDTO(insuranceBenefitRelation.benefit)

    return {
      ...prevData,
      idRelation: insuranceBenefitRelation.id,
      additionalCost: Number(insuranceBenefitRelation.additionalCost),
    }
  }
}
