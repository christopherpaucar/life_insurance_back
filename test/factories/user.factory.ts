import { User } from '../../src/auth/entities/user.entity'
import { vi } from 'vitest'

export class UserFactory {
  static create(overrides: Partial<User> = {}): User {
    const mockDate = new Date('2023-01-01T00:00:00Z')
    vi.setSystemTime(mockDate)

    const defaultUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedPassword',
      createdAt: mockDate,
      updatedAt: mockDate,
      deletedAt: mockDate,
      ...overrides,
    }

    return defaultUser
  }
}
