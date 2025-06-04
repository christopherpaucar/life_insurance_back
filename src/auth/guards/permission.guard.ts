import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RoleService } from '../services/role.service'
import { PERMISSION_KEY } from '../decorators/require-permission.decorator'
import { Role, RoleType } from '../entities/role.entity'
import { PermissionType } from '../decorators/require-permission.decorator'

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private roleService: RoleService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<PermissionType>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredPermission) {
      return true
    }

    const { user } = context.switchToHttp().getRequest()

    if (!user || !user.role) {
      throw new UnauthorizedException('User not authenticated or missing role')
    }

    if (user.role.name === RoleType.SUPER_ADMIN) {
      return true
    }

    return this.roleService.hasPermission(user.role as Role, requiredPermission)
  }
}
