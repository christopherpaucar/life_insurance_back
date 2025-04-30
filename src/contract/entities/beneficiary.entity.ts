import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Contract } from './contract.entity'

export enum RelationshipType {
  SPOUSE = 'spouse',
  CHILD = 'child',
  PARENT = 'parent',
  SIBLING = 'sibling',
  OTHER = 'other',
}

@Entity('beneficiaries')
export class Beneficiary extends BaseEntity {
  @Column()
  firstName: string

  @Column()
  lastName: string

  @Column({ type: 'enum', enum: RelationshipType })
  relationship: RelationshipType

  @Column('decimal', { precision: 5, scale: 2 })
  percentage: number

  @Column({ nullable: true })
  identificationNumber: string

  @Column({ nullable: true })
  contactInfo: string

  @ManyToOne(() => Contract, (contract) => contract.beneficiaries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract
}
