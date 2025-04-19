import { Role, RoleType } from '../../auth/entities/role.entity'

export interface IUser {
  id: string
  email: string
  name: string
  password: string
  createdAt: Date
  updatedAt: Date
  roles?: Role[]
}

export interface IAuthResponse {
  success: boolean
  data?: {
    user: Omit<IUser, 'password' | 'createdAt' | 'updatedAt'> & {
      roles?: Role[]
    }
    token: string
  }
  error?: {
    message: string
    code: string
  }
}

export interface ILoginDto {
  email: string
  password: string
}

export interface IRegisterDto {
  name: string
  email: string
  password: string
  role: RoleType
}

export interface IJwtPayload {
  sub: string
  email: string
  name: string
  roles?: Role[]
}

export interface IAddRoleDto {
  userId: string
  roleType: string
}

export interface IRemoveRoleDto {
  userId: string
  roleType: string
}
