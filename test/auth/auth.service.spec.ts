import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService } from '../../src/auth/services/auth.service'
import { JwtService } from '@nestjs/jwt'
import { UserRepositoryMock } from '../mocks/user.repository.mock'
import { UserFactory } from '../factories/user.factory'
import { ILoginDto, IRegisterDto } from '../../src/common/interfaces/auth.interface'
import { ApiResponseDto } from '../../src/common/dto/api-response.dto'
import { UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { User } from '../../src/auth/entities/user.entity'
import { Repository } from 'typeorm'

describe('AuthService', () => {
  let authService: AuthService
  let userRepository: UserRepositoryMock
  let jwtService: JwtService

  beforeEach(() => {
    userRepository = new UserRepositoryMock()
    jwtService = {
      sign: vi.fn().mockReturnValue('mock-token'),
    } as unknown as JwtService

    authService = new AuthService(userRepository as unknown as Repository<User>, jwtService)
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: IRegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }

      const mockUser = UserFactory.create({
        email: registerDto.email,
        name: registerDto.name,
        password: 'hashed-password',
      })

      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password')
      vi.spyOn(userRepository, 'findOne').mockResolvedValue(null)
      vi.spyOn(userRepository, 'save').mockImplementation(() => Promise.resolve(mockUser))

      const result = await authService.register(registerDto)

      expect(result).toBeInstanceOf(ApiResponseDto)
      expect(result.success).toBe(true)
      console.log(result.data?.user)
      expect(result.data?.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
      expect(result.data?.token).toBe('mock-token')
    })

    it('should throw UnauthorizedException when email already exists', async () => {
      const registerDto: IRegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }

      const existingUser = UserFactory.create({
        email: registerDto.email,
        name: 'Existing User',
        password: 'hashed-password',
      })

      vi.spyOn(userRepository, 'findOne').mockResolvedValue(existingUser)

      await expect(authService.register(registerDto)).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginDto: ILoginDto = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockUser = UserFactory.create({
        email: loginDto.email,
        name: 'Test User',
        password: 'hashed-password',
      })

      vi.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser)
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true)

      const result = await authService.login(loginDto)

      expect(result).toBeInstanceOf(ApiResponseDto)
      expect(result.success).toBe(true)
      expect(result.data?.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      })
      expect(result.data?.token).toBe('mock-token')
    })

    it('should throw UnauthorizedException when user not found', async () => {
      const loginDto: ILoginDto = {
        email: 'test@example.com',
        password: 'password123',
      }

      vi.spyOn(userRepository, 'findOne').mockResolvedValue(null)

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const loginDto: ILoginDto = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockUser = UserFactory.create({
        email: loginDto.email,
        name: 'Test User',
        password: 'hashed-password',
      })

      vi.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser)
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false)

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })
  })
})
