import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { User } from '../entities/user.entity'
import { RoleType } from '../entities/role.entity'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler())

    if (!requiredRoles) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user as User

    if (!user || !user.role) {
      throw new UnauthorizedException('User not authenticated or missing role')
    }

    if (user.role.name === RoleType.SUPER_ADMIN) {
      return true
    }

    const hasRole = requiredRoles.some((role) => role.toLowerCase() === user.role.name.toLowerCase())

    if (!hasRole) {
      throw new UnauthorizedException('User does not have required role')
    }

    return true
  }
}
