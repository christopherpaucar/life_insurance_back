import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { User } from '../../auth/entities/user.entity'

export enum PaymentMethodType {
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
}

@Entity('payment_methods')
export class PaymentMethod extends BaseEntity {
  @Column({ type: 'enum', enum: PaymentMethodType })
  type: PaymentMethodType

  @Column()
  details: string

  @Column({ default: true })
  isValid: boolean

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User
}
