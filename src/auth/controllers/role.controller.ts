import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch } from '@nestjs/common'
import { RoleService } from '../services/role.service'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { PermissionGuard } from '../guards/permission.guard'
import { RequirePermission } from '../decorators/require-permission.decorator'
import { IAddRoleDto, IRemoveRoleDto } from '../../common/interfaces/auth.interface'

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermission('role:read')
  async getAllRoles() {
    return this.roleService.getAllRoles()
  }

  @Get(':roleType/permissions')
  @UseGuards(PermissionGuard)
  @RequirePermission('role:read')
  async getRolePermissions(@Param('roleType') roleType: string) {
    return this.roleService.getRolePermissions(roleType)
  }

  @Patch(':roleType/permissions')
  @UseGuards(PermissionGuard)
  @RequirePermission('role:update')
  async updateRolePermissions(@Param('roleType') roleType: string, @Body() body: { permissions: string[] }) {
    return this.roleService.updateRolePermissions(roleType, body.permissions)
  }

  @Post('assign')
  @UseGuards(PermissionGuard)
  @RequirePermission('role:update')
  async addRoleToUser(@Body() dto: IAddRoleDto) {
    return this.roleService.addRoleToUser(dto)
  }

  @Delete('remove')
  @UseGuards(PermissionGuard)
  @RequirePermission('role:update')
  async removeRoleFromUser(@Body() dto: IRemoveRoleDto) {
    return this.roleService.removeRoleFromUser(dto)
  }

  @Get('user/:userId')
  @UseGuards(PermissionGuard)
  @RequirePermission('role:read')
  async getUserRoles(@Param('userId') userId: string) {
    return this.roleService.getUserRoles(userId)
  }

  @Post('init')
  @UseGuards(PermissionGuard)
  @RequirePermission('role:create')
  async initRoles() {
    return this.roleService.init()
  }
}
