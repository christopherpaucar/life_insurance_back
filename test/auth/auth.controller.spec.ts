import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthController } from '../../src/auth/controllers/auth.controller'
import { AuthService } from '../../src/auth/services/auth.service'
import { LoginDto, RegisterDto } from '../../src/auth/dto/auth.dto'
import { IAuthResponse } from '../../src/common/interfaces/auth.interface'
import { validate } from 'class-validator'
import { UserRepositoryMock } from '../mocks/user.repository.mock'
import { UserFactory } from '../factories/user.factory'
import { JwtService } from '@nestjs/jwt'
import { Repository } from 'typeorm'
import { User } from '../../src/auth/entities/user.entity'

describe('AuthController', () => {
  let authController: AuthController
  let authService: AuthService
  let userRepository: UserRepositoryMock
  let jwtService: JwtService

  beforeEach(() => {
    userRepository = new UserRepositoryMock()
    jwtService = {
      sign: vi.fn().mockReturnValue('mock-token'),
    } as unknown as JwtService

    authService = new AuthService(userRepository as unknown as Repository<User>, jwtService)
    authController = new AuthController(authService)
  })

  describe('register', () => {
    it('should validate register input data', async () => {
      const registerDto = new RegisterDto()
      registerDto.email = 'test@example.com'
      registerDto.password = 'Password123!'
      registerDto.name = 'John Doe'

      const errors = await validate(registerDto)
      expect(errors).toHaveLength(0)
    })

    it('should return correct response structure', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }

      const mockUser = UserFactory.create({
        email: registerDto.email,
        name: registerDto.name,
      })

      const expectedResponse: IAuthResponse = {
        success: true,
        data: {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
          },
          token: 'mock-token',
        },
      }

      vi.spyOn(authService, 'register').mockResolvedValue(expectedResponse)
      const result = await authController.register(registerDto)

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('data')
      const response = result
      expect(response.data).toHaveProperty('user')
      expect(response.data).toHaveProperty('token')
      expect(response.data!.user).toHaveProperty('id')
      expect(response.data!.user).toHaveProperty('email')
      expect(response.data!.user).toHaveProperty('name')
    })
  })

  describe('login', () => {
    it('should validate login input data', async () => {
      const loginDto = new LoginDto()
      loginDto.email = 'test@example.com'
      loginDto.password = 'Password123!'

      const errors = await validate(loginDto)
      expect(errors).toHaveLength(0)
    })

    it('should return correct response structure', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockUser = UserFactory.create({
        email: loginDto.email,
        name: 'Test User',
      })

      const expectedResponse: IAuthResponse = {
        success: true,
        data: {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
          },
          token: 'mock-token',
        },
      }

      vi.spyOn(authService, 'login').mockResolvedValue(expectedResponse)
      const result = await authController.login(loginDto)

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('data')
      const response = result
      expect(response.data).toHaveProperty('user')
      expect(response.data).toHaveProperty('token')
      expect(response.data!.user).toHaveProperty('id')
      expect(response.data!.user).toHaveProperty('email')
      expect(response.data!.user).toHaveProperty('name')
    })
  })
})
