import { Entity, Column } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'

export enum RoleType {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMINISTRADOR',
  REVISOR = 'REVISOR',
  CLIENTE = 'CLIENTE',
  AGENTE = 'AGENTE',
}

// Define default permissions for each role
export const DEFAULT_PERMISSIONS = {
  [RoleType.SUPER_ADMIN]: ['all:create', 'all:read', 'all:update', 'all:delete', 'all:manage'],
  [RoleType.ADMIN]: [
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'role:read',
    'role:create',
    'role:update',
    'role:delete',
    'insurance:read',
    'insurance:create',
    'insurance:update',
    'insurance:delete',
    'client:read',
    'client:create',
    'client:update',
    'client:delete',
    'contract:read',
    'contract:create',
    'contract:update',
    'contract:delete',
    'reimbursement:read',
    'reimbursement:approve',
    'reimbursement:reject',
    'report:view',
  ],
  [RoleType.AGENTE]: [
    'client:read',
    'client:create',
    'client:update',
    'client:delete',
    'contract:read',
    'contract:create',
    'contract:update',
    'reimbursement:read',
    'reimbursement:approve',
    'reimbursement:reject',
    'report:view',
  ],
  [RoleType.REVISOR]: [
    'client:read',
    'contract:read',
    'reimbursement:read',
    'reimbursement:approve',
    'reimbursement:reject',
  ],
  [RoleType.CLIENTE]: [
    'contract:read',
    'contract:sign',
    'contract:upload',
    'payment:view',
    'reimbursement:create',
    'reimbursement:read',
    'reimbursement:upload',
  ],
}

// List all available permissions in the system
export const ALL_PERMISSIONS = [
  // User management
  'user:create',
  'user:read',
  'user:update',
  'user:delete',

  // Role management
  'role:create',
  'role:read',
  'role:update',
  'role:delete',

  // Insurance management
  'insurance:create',
  'insurance:read',
  'insurance:update',
  'insurance:delete',

  // Client management
  'client:create',
  'client:read',
  'client:update',
  'client:delete',

  // Contract management
  'contract:create',
  'contract:read',
  'contract:update',
  'contract:delete',
  'contract:sign',
  'contract:upload',

  // Reimbursement management
  'reimbursement:create',
  'reimbursement:read',
  'reimbursement:approve',
  'reimbursement:reject',
  'reimbursement:upload',

  // Payment management
  'payment:create',
  'payment:read',
  'payment:update',
  'payment:delete',
  'payment:view',

  // Report management
  'report:view',

  // Super admin permissions
  'all:create',
  'all:read',
  'all:update',
  'all:delete',
  'all:manage',
]

@Entity('roles')
export class Role extends BaseEntity {
  @Column({
    type: 'enum',
    enum: RoleType,
    default: RoleType.CLIENTE,
    unique: true,
  })
  name: RoleType

  @Column()
  description: string

  @Column({ type: 'json', nullable: true })
  permissions: string[]
}
