import { Role, RoleType } from '../../auth/entities/role.entity'
import { User } from '../../auth/entities/user.entity'

export interface IUser {
  id: string
  email: string
  name: string
  password: string
  createdAt: Date
  updatedAt: Date
  role?: Role
}

export interface IAuthResponse {
  user: Partial<User> & { password?: string }
  token: string
}

export interface ILoginDto {
  email: string
  password: string
}

export interface IRegisterDto extends ILoginDto {
  name: string
  role: string
}

export interface IJwtPayload {
  sub: string
  email: string
  name: string
  role?: Role
}

export interface IAddRoleDto {
  userId: string
  roleType: string
}

export interface IRemoveRoleDto {
  userId: string
  roleType: string
}

export interface ICreateUserDto {
  email: string
  name: string
  roleType: RoleType
  temporaryPassword: string
}
