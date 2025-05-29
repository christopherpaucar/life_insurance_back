import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RoleService } from '../../src/auth/services/role.service'
import { UserRepositoryMock } from '../mocks/user.repository.mock'
import { RoleRepositoryMock } from '../mocks/role.repository.mock'
import { UserFactory } from '../factories/user.factory'
import { RoleFactory } from '../factories/role.factory'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { User } from '../../src/auth/entities/user.entity'
import { Role, RoleType } from '../../src/auth/entities/role.entity'
import { Repository } from 'typeorm'

describe('RoleService', () => {
  let roleService: RoleService
  let userRepository: UserRepositoryMock
  let roleRepository: RoleRepositoryMock

  beforeEach(() => {
    userRepository = new UserRepositoryMock()
    roleRepository = new RoleRepositoryMock()

    roleService = new RoleService(
      userRepository as unknown as Repository<User>,
      roleRepository as unknown as Repository<Role>,
    )
  })

  describe('init', () => {
    it('should initialize default roles if they do not exist', async () => {
      vi.spyOn(roleRepository, 'findOne').mockResolvedValue(null)
      vi.spyOn(roleRepository, 'create').mockImplementation((entity) => entity as Role[])
      const saveSpy = vi.spyOn(roleRepository, 'save').mockImplementation((entity) => Promise.resolve(entity as Role))

      await roleService.init()

      // There are 5 default roles
      expect(saveSpy).toHaveBeenCalledTimes(5)
    })

    it('should not create roles that already exist', async () => {
      vi.spyOn(roleRepository, 'findOne').mockResolvedValue(RoleFactory.create())
      const saveSpy = vi.spyOn(roleRepository, 'save')

      await roleService.init()

      expect(saveSpy).not.toHaveBeenCalled()
    })
  })

  describe('getAllRoles', () => {
    it('should return all roles and permissions', async () => {
      const mockRoles = [
        RoleFactory.create({ name: RoleType.SUPER_ADMIN }),
        RoleFactory.create({ name: RoleType.ADMIN }),
        RoleFactory.create({ name: RoleType.CLIENT }),
      ]

      vi.spyOn(roleRepository, 'find').mockResolvedValue(mockRoles)

      const result = await roleService.getAllRoles()

      expect(result).toHaveProperty('roles')
      expect(result).toHaveProperty('allPermissions')
      expect(result.roles).toEqual(mockRoles)
      expect(Array.isArray(result.allPermissions)).toBe(true)
    })
  })

  describe('getRoleByType', () => {
    it('should return a role when it exists', async () => {
      const mockRole = RoleFactory.create({ name: RoleType.CLIENT })

      vi.spyOn(roleRepository, 'findOne').mockResolvedValue(mockRole)

      const result = await roleService.getRoleByType(RoleType.CLIENT)

      expect(result).toEqual(mockRole)
    })

    it('should throw NotFoundException when role does not exist', async () => {
      vi.spyOn(roleRepository, 'findOne').mockResolvedValue(null)

      await expect(roleService.getRoleByType(RoleType.CLIENT)).rejects.toThrow(NotFoundException)
    })
  })

  describe('addRoleToUser', () => {
    it('should add a role to a user successfully', async () => {
      const mockUser = UserFactory.create()
      const mockRole = RoleFactory.create({ name: RoleType.AGENT })

      vi.spyOn(userRepository, 'findOne').mockResolvedValue({
        ...mockUser,
        role: undefined as unknown as Role,
      })
      vi.spyOn(roleService, 'getRoleByType').mockResolvedValue(mockRole)
      vi.spyOn(userRepository, 'save').mockImplementation((entity) => Promise.resolve(entity as User))

      const result = await roleService.addRoleToUser({
        userId: mockUser.id,
        roleType: RoleType.AGENT,
      })

      expect(result.success).toBe(true)
      expect(result.data?.message).toBe('Rol asignado correctamente')
    })

    it('should throw BadRequestException when role is already assigned', async () => {
      const mockUser = UserFactory.create()
      const mockRole = RoleFactory.create({ name: RoleType.AGENT })

      vi.spyOn(userRepository, 'findOne').mockResolvedValue({
        ...mockUser,
        role: mockRole,
      })
      vi.spyOn(roleService, 'getRoleByType').mockResolvedValue(mockRole)

      await expect(
        roleService.addRoleToUser({
          userId: mockUser.id,
          roleType: RoleType.AGENT,
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException when user does not exist', async () => {
      vi.spyOn(userRepository, 'findOne').mockResolvedValue(null)

      await expect(
        roleService.addRoleToUser({
          userId: '99',
          roleType: RoleType.CLIENT,
        }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('removeRoleFromUser', () => {
    it('should remove a role from a user successfully', async () => {
      const mockRole = RoleFactory.create({ name: RoleType.AGENT })
      const mockUser = UserFactory.create({
        role: mockRole,
      })

      vi.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser)
      vi.spyOn(roleService, 'getRoleByType').mockResolvedValue(mockRole)
      vi.spyOn(userRepository, 'save').mockImplementation((entity) => Promise.resolve(entity as User))

      const result = await roleService.removeRoleFromUser({
        userId: mockUser.id,
        roleType: RoleType.AGENT,
      })

      expect(result.success).toBe(true)
      expect(result.data?.message).toBe('Rol eliminado correctamente')
    })

    it('should throw BadRequestException when user does not have the role', async () => {
      const mockUser = UserFactory.create({
        role: undefined,
      })
      const mockRole = RoleFactory.create({ name: RoleType.AGENT })

      vi.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser)
      vi.spyOn(roleService, 'getRoleByType').mockResolvedValue(mockRole)

      await expect(
        roleService.removeRoleFromUser({
          userId: mockUser.id,
          roleType: RoleType.AGENT,
        }),
      ).rejects.toThrow(BadRequestException)
    })
  })
})
