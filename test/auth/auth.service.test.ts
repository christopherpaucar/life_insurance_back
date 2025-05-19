import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService } from '../../src/auth/services/auth.service'
import { JwtService } from '@nestjs/jwt'
import { UserRepositoryMock } from '../mocks/user.repository.mock'
import { RoleRepositoryMock } from '../mocks/role.repository.mock'
import { UserFactory } from '../factories/user.factory'
import { RoleFactory } from '../factories/role.factory'
import { ILoginDto, IRegisterDto } from '../../src/common/interfaces/auth.interface'
import { ApiResponseDto } from '../../src/common/dto/api-response.dto'
import { UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { User } from '../../src/auth/entities/user.entity'
import { Role, RoleType } from '../../src/auth/entities/role.entity'
import { Repository } from 'typeorm'
import { RoleService } from '../../src/auth/services/role.service'
import { ClientService } from '../../src/client/services/client.service'

describe('AuthService', () => {
  let authService: AuthService
  let userRepository: UserRepositoryMock
  let roleRepository: RoleRepositoryMock
  let roleService: RoleService
  let jwtService: JwtService
  let clientService: ClientService

  beforeEach(() => {
    userRepository = new UserRepositoryMock()
    roleRepository = new RoleRepositoryMock()
    jwtService = {
      sign: vi.fn().mockReturnValue('mock-token'),
    } as unknown as JwtService

    roleService = new RoleService(
      userRepository as unknown as Repository<User>,
      roleRepository as unknown as Repository<Role>,
    )

    clientService = {
      createClientForUser: vi.fn().mockResolvedValue({}),
    } as unknown as ClientService

    vi.spyOn(roleService, 'addRoleToUser').mockResolvedValue({
      success: true,
      data: {
        message: 'Role assigned successfully',
        userId: '1',
        roles: [RoleFactory.create()],
      },
    })

    authService = new AuthService(userRepository as unknown as Repository<User>, jwtService, roleService, clientService)
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: IRegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: RoleType.CLIENT,
      }

      const mockUser = UserFactory.create({
        email: registerDto.email,
        name: registerDto.name,
        password: 'hashed-password',
      })

      const mockRole = RoleFactory.create()
      mockUser.roles = [mockRole]

      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password')
      vi.spyOn(userRepository, 'findOne').mockResolvedValue(null)
      vi.spyOn(userRepository, 'save').mockImplementation(() => Promise.resolve(mockUser))

      // Mock the query builder for fetching user with roles
      const mockQueryBuilder = {
        leftJoin: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue({
          ...mockUser,
          roles: [mockRole],
        }),
      }
      vi.spyOn(userRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any)

      const result = await authService.register(registerDto)

      expect(result).toBeInstanceOf(ApiResponseDto)
      expect(result.success).toBe(true)
      expect(result.data?.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        roles: [mockRole],
      })
      expect(result.data?.token).toBe('mock-token')
      expect(roleService.addRoleToUser).toHaveBeenCalledWith({
        userId: mockUser.id,
        roleType: RoleType.CLIENT,
      })
    })

    it('should throw UnauthorizedException when email already exists', async () => {
      const registerDto: IRegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: RoleType.CLIENT,
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

      const mockRole = RoleFactory.create()
      const mockUser = UserFactory.create({
        email: loginDto.email,
        name: 'Test User',
        password: 'hashed-password',
        roles: [mockRole],
      })

      // Mock the query builder for login
      const mockQueryBuilder = {
        leftJoin: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(mockUser),
      }
      vi.spyOn(userRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any)
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true)

      const result = await authService.login(loginDto)

      expect(result).toBeInstanceOf(ApiResponseDto)
      expect(result.success).toBe(true)
      expect(result.data?.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        roles: [mockRole],
      })
      expect(result.data?.token).toBe('mock-token')
    })

    it('should throw UnauthorizedException when user not found', async () => {
      const loginDto: ILoginDto = {
        email: 'test@example.com',
        password: 'password123',
      }

      // Mock the query builder for login with no user found
      const mockQueryBuilder = {
        leftJoin: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null),
      }
      vi.spyOn(userRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any)

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

      // Mock the query builder for login
      const mockQueryBuilder = {
        leftJoin: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(mockUser),
      }
      vi.spyOn(userRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any)
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false)

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })
  })
})
