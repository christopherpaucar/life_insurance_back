import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
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

  @ManyToOne(() => Insurance, (insurance) => insurance.coverages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'insurance_id' })
  insurance: Insurance
}
