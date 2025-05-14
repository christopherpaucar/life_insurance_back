import { Entity, Column, OneToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { User } from '../../auth/entities/user.entity'

@Entity('clients')
export class Client extends BaseEntity {
  @Column()
  firstName: string

  @Column()
  lastName: string

  @Column({ unique: true })
  email: string

  @Column()
  phone: string

  @Column({ nullable: true })
  address: string

  @Column({ type: 'date' })
  dateOfBirth: Date

  @Column({ nullable: true })
  identificationNumber: string

  @Column({ nullable: true })
  identificationDocumentUrl: string

  @OneToOne(() => User, { nullable: true })
  @JoinColumn()
  user: User

  // Inverse relationship will be defined in Contract entity
  // contracts: Contract[]

  // Helper methods
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`
  }
}
