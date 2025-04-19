import { Controller, Post, Body } from '@nestjs/common'
import { AuthService } from '../services/auth.service'
import { IAuthResponse } from '../../common/interfaces/auth.interface'
import { LoginDto, RegisterDto } from '../dto/auth.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<IAuthResponse> {
    return this.authService.register(dto)
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<IAuthResponse> {
    return this.authService.login(dto)
  }
}
