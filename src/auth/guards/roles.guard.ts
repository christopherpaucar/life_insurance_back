import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { User } from '../entities/user.entity'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler())
    if (!roles) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user as User

    if (!user || !user.roles) {
      return false
    }

    return user.roles.some((role) => roles.includes(role.name))
  }
}
