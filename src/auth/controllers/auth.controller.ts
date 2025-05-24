import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { AuthService } from '../services/auth.service'
import { LoginDto, RegisterDto } from '../dto/auth.dto'
import { OnboardingDto } from '../dto/onboarding.dto'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { RolesGuard } from '../guards/roles.guard'
import { Roles } from '../decorators/roles.decorator'
import { RoleType } from '../entities/role.entity'
import { ApiResponseDto } from '../../common/dto/api-response.dto'
import { CurrentUser } from '../decorators/current-user.decorator'
import { User } from '../entities/user.entity'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto)

    return new ApiResponseDto({ success: true, data: user })
  }

  @Post('register/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  async registerAdmin(@Body() dto: RegisterDto, @CurrentUser() user: User) {
    const newUser = await this.authService.register(dto, user)

    return new ApiResponseDto({ success: true, data: newUser })
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.login(dto)

    return new ApiResponseDto({ success: true, data: user })
  }

  @Post('onboarding')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.CLIENT)
  async onboarding(@Body() dto: OnboardingDto, @CurrentUser() user: User) {
    const updatedUser = await this.authService.onboarding(user, dto)

    return new ApiResponseDto({ success: true, data: updatedUser })
  }
}
