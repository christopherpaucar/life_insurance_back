export interface IUser {
  id: string
  email: string
  name: string
  password: string
  createdAt: Date
  updatedAt: Date
}

export interface IAuthResponse {
  success: boolean
  data?: {
    user: Omit<IUser, 'password' | 'createdAt' | 'updatedAt'>
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
}

export interface IJwtPayload {
  sub: string
  email: string
  name: string
}
