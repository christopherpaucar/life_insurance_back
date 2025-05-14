import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { AuthService } from '../services/auth.service'
import { ICreateUserDto } from '../../common/interfaces/auth.interface'
import { LoginDto, RegisterDto } from '../dto/auth.dto'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { PermissionGuard } from '../guards/permission.guard'
import { RequirePermission } from '../decorators/require-permission.decorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Post('create-user')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('user:create')
  async createUser(@Body() dto: ICreateUserDto) {
    return this.authService.createUserWithRole(dto)
  }
}
