import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm'
import { IUser } from '../../common/interfaces/auth.interface'
import { BaseEntity } from '../../common/entities/base.entity'
import { Role } from './role.entity'

@Entity('users')
export class User extends BaseEntity implements IUser {
  @Index()
  @Column({ unique: true })
  email: string

  @Index()
  @Column()
  name: string

  @Column()
  password: string

  @Column({ default: false })
  isActive: boolean

  @Column({ nullable: true })
  lastLogin: Date

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role

  @Column({ default: false })
  onboardingCompleted: boolean
}
