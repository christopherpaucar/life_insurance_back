import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../entities/user.entity'
import { Role, RoleType, DEFAULT_PERMISSIONS, ALL_PERMISSIONS } from '../entities/role.entity'
import { IAddRoleDto, IRemoveRoleDto } from '../../common/interfaces/auth.interface'
import { ApiResponseDto } from '../../common/dto/api-response.dto'
import { PermissionType } from '../decorators/require-permission.decorator'

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async init() {
    // Initialize default roles if they don't exist
    for (const roleType of Object.values(RoleType)) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleType },
      })

      if (!existingRole) {
        const role = this.roleRepository.create({
          name: roleType,
          description: `${roleType} role`,
          permissions: DEFAULT_PERMISSIONS[roleType],
        })
        await this.roleRepository.save(role)
      }
    }
  }

  async getAllRoles() {
    const roles = await this.roleRepository.find()

    return {
      roles,
      allPermissions: ALL_PERMISSIONS,
    }
  }

  async getRoleByType(roleType: RoleType): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { name: roleType },
    })

    if (!role) {
      throw new NotFoundException({
        success: false,
        error: {
          message: 'Role not found',
          code: 'ROLE_NOT_FOUND',
        },
      })
    }

    return role
  }

  async getRolePermissions(roleType: string) {
    // Validate if the role exists
    if (!Object.values(RoleType).includes(roleType as RoleType)) {
      throw new NotFoundException({
        success: false,
        error: {
          message: 'Rol no encontrado',
          code: 'ROLE_NOT_FOUND',
        },
      })
    }

    const role = await this.getRoleByType(roleType as RoleType)

    return new ApiResponseDto({
      success: true,
      data: {
        roleType,
        permissions: role.permissions,
      },
    })
  }

  async updateRolePermissions(roleType: string, permissions: string[]) {
    // Validate if the role exists
    if (!Object.values(RoleType).includes(roleType as RoleType)) {
      throw new NotFoundException({
        success: false,
        error: {
          message: 'Rol no encontrado',
          code: 'ROLE_NOT_FOUND',
        },
      })
    }

    // Validate permissions
    const invalidPermissions = permissions.filter((p) => !ALL_PERMISSIONS.includes(p) && !p.startsWith('all:'))

    if (invalidPermissions.length > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          message: `Permisos inválidos: ${invalidPermissions.join(', ')}`,
          code: 'INVALID_PERMISSIONS',
        },
      })
    }

    const role = await this.getRoleByType(roleType as RoleType)
    role.permissions = permissions
    await this.roleRepository.save(role)

    return new ApiResponseDto({
      success: true,
      data: {
        roleType,
        permissions: role.permissions,
      },
    })
  }

  async addRoleToUser(dto: IAddRoleDto) {
    // Validate role type
    if (!Object.values(RoleType).includes(dto.roleType as RoleType)) {
      throw new BadRequestException({
        success: false,
        error: {
          message: 'Tipo de rol inválido',
          code: 'INVALID_ROLE_TYPE',
        },
      })
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
      relations: ['role'],
    })

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: {
          message: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND',
        },
      })
    }

    // Find role
    const role = await this.getRoleByType(dto.roleType as RoleType)

    // Check if user already has this role
    if (user.role && user.role.id === role.id) {
      throw new BadRequestException({
        success: false,
        error: {
          message: 'El usuario ya tiene asignado este rol',
          code: 'ROLE_ALREADY_ASSIGNED',
        },
      })
    }

    // Initialize roles array if it doesn't exist
    if (!user.role) {
      user.role = undefined as any
    }

    // Add the role to user
    user.role = role

    // Save user with updated roles
    await this.userRepository.save(user)

    return new ApiResponseDto({
      success: true,
      data: {
        message: 'Rol asignado correctamente',
        userId: user.id,
        role: user.role,
      },
    })
  }

  async removeRoleFromUser(dto: IRemoveRoleDto) {
    // Find user
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
      relations: ['role'],
    })

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: {
          message: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND',
        },
      })
    }

    // Check if user has roles
    if (!user.role) {
      throw new BadRequestException({
        success: false,
        error: {
          message: 'El usuario no tiene roles asignados',
          code: 'NO_ROLES_ASSIGNED',
        },
      })
    }

    // Find role
    const roleToRemove = await this.getRoleByType(dto.roleType as RoleType)

    // Find role index
    if (user.role.id !== roleToRemove.id) {
      throw new BadRequestException({
        success: false,
        error: {
          message: 'El usuario no tiene asignado este rol',
          code: 'ROLE_NOT_ASSIGNED',
        },
      })
    }

    // Remove role
    user.role = undefined as any

    // Save user with updated roles
    await this.userRepository.save(user)

    return new ApiResponseDto({
      success: true,
      data: {
        message: 'Rol eliminado correctamente',
        userId: user.id,
        role: user.role,
      },
    })
  }

  async getUserRoles(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    })

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: {
          message: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND',
        },
      })
    }

    return new ApiResponseDto({
      success: true,
      data: {
        userId: user.id,
        role: user.role,
      },
    })
  }

  // Utility method to check if user has permission
  hasPermission(userRoles: Role[], requiredPermission: PermissionType): boolean {
    // Check if any of the user's roles has the required permission
    return userRoles.some((role) => {
      // Check for "all" permissions first
      if (role.permissions && (role.permissions.includes('all:manage') || role.permissions.includes('all:read'))) {
        // All-access for specific action types
        const actionType = requiredPermission.split(':')[1]
        if (role.permissions.includes(`all:${actionType}`)) {
          return true
        }
      }

      // Direct permission check
      return role.permissions && role.permissions.includes(requiredPermission)
    })
  }
}
