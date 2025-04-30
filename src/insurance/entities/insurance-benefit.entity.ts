import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Insurance } from './insurance.entity'

@Entity('insurance_benefits')
export class InsuranceBenefit extends BaseEntity {
  @Column()
  name: string

  @Column('text')
  description: string

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  additionalCost: number

  @ManyToOne(() => Insurance, (insurance) => insurance.benefits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'insurance_id' })
  insurance: Insurance
}
