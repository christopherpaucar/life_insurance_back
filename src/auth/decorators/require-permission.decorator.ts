import { SetMetadata } from '@nestjs/common'
import { ALL_PERMISSIONS } from '../entities/role.entity'

export type PermissionType = (typeof ALL_PERMISSIONS)[number]

export const PERMISSION_KEY = 'required_permission'
export const RequirePermission = (permission: PermissionType) => SetMetadata(PERMISSION_KEY, permission)
