import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm'
import { IUser } from '../../common/interfaces/auth.interface'
import { BaseEntity } from '../../common/entities/base.entity'
import { Role } from './role.entity'
import { BloodType } from '../dto/onboarding.dto'

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

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role

  @Column({ default: false })
  onboardingCompleted: boolean

  @Column({ type: 'date', nullable: true })
  birthDate: Date

  @Column({ nullable: true, type: 'enum', enum: BloodType })
  bloodType: BloodType

  @Column({ nullable: true })
  gender: string

  @Column({ nullable: true })
  height: number

  @Column({ nullable: true })
  weight: number

  @Column({ nullable: true })
  address: string

  @Column({ nullable: true })
  phoneNumber: string

  @Column({ nullable: true })
  emergencyContact: string

  @Column({ nullable: true })
  emergencyPhone: string

  @Column({ type: 'jsonb', nullable: true })
  medicalHistory: Record<string, any>

  @Column({ type: 'jsonb', nullable: true })
  lifestyle: Record<string, any>

  static async hashPassword(password: string) {
    const bcrypt = await import('bcrypt')

    const saltRounds = 10
    return bcrypt.hash(password, saltRounds)
  }
}
