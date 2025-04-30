import { Controller, Get, UseGuards } from '@nestjs/common'
import { AppService } from './app.service'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'
import { PermissionGuard } from './auth/guards/permission.guard'
import { RequirePermission } from './auth/decorators/require-permission.decorator'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('all:read')
  getHello(): string {
    return this.appService.getHello()
  }
}
