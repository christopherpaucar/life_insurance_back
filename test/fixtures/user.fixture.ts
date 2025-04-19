import { User } from '../../src/auth/entities/user.entity'

export const testUsers: User[] = [
  {
    id: '1',
    email: 'test1@example.com',
    name: 'Test User 1',
    password: 'hashedPassword1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: new Date(),
  },
  {
    id: '2',
    email: 'test2@example.com',
    name: 'Test User 2',
    password: 'hashedPassword2',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: new Date(),
  },
]
