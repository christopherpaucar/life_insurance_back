import { Role, RoleType } from '../../src/auth/entities/role.entity'
import { vi } from 'vitest'

export class RoleFactory {
  static create(overrides: Partial<Role> = {}): Role {
    const mockDate = new Date('2023-01-01T00:00:00Z')
    vi.setSystemTime(mockDate)

    const defaultRole: Role = {
      id: '1',
      name: RoleType.CLIENTE,
      description: 'Client role',
      permissions: ['contract:read', 'reimbursement:create'],
      createdAt: mockDate,
      updatedAt: mockDate,
      deletedAt: mockDate,
      ...overrides,
    }

    return defaultRole
  }
}
