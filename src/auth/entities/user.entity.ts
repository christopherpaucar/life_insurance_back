import { Entity, Column, Index, ManyToMany, JoinTable } from 'typeorm'
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

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'users_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[]
}
