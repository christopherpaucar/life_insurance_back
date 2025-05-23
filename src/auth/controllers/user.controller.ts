import { Controller, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { RolesGuard } from '../guards/roles.guard'
import { Roles } from '../decorators/roles.decorator'
import { RoleType } from '../entities/role.entity'
import { UserService } from '../services/user.service'
import { UpdateUserDto } from '../dto/user.dto'
import { ApiResponseDto } from '../../common/dto/api-response.dto'
import { CurrentUser } from '../decorators/current-user.decorator'
import { User } from '../entities/user.entity'

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  async findAll(@CurrentUser() user: User) {
    const users = await this.userService.findAll(user)
    return new ApiResponseDto({ success: true, data: users })
  }

  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id)
    return new ApiResponseDto({ success: true, data: user })
  }

  @Put(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.userService.update(id, updateUserDto)
    return new ApiResponseDto({ success: true, data: user })
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    await this.userService.remove(id)
    return new ApiResponseDto({ success: true, data: 'User deleted successfully' })
  }

  @Put(':id/role')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  async updateRole(@Param('id') id: string, @Body('role') role: RoleType) {
    const user = await this.userService.updateRole(id, role)
    return new ApiResponseDto({ success: true, data: user })
  }

  @Put(':id/permissions')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  async updatePermissions(@Param('id') id: string, @Body('permissions') permissions: string[]) {
    const user = await this.userService.updatePermissions(id, permissions)
    return new ApiResponseDto({ success: true, data: user })
  }
}
