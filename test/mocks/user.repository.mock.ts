/* eslint-disable @typescript-eslint/no-unused-vars */
import { FindOneOptions, DeepPartial, SaveOptions } from 'typeorm'
import { User } from '../../src/auth/entities/user.entity'

export class UserRepositoryMock {
  findOne(_options?: FindOneOptions<User>): Promise<User | null> {
    // Implementation is stubbed for tests and will be mocked with vi.spyOn
    return Promise.resolve(null)
  }

  create(): User
  create(entityLike: DeepPartial<User>): User
  create(entityLikeArray: DeepPartial<User>[]): User[]
  create(entityLike?: DeepPartial<User> | DeepPartial<User>[]): User | User[] {
    if (Array.isArray(entityLike)) {
      return entityLike.map((entity) => ({ ...entity }) as User)
    }

    // For authentication tests, preserve existing properties to match the test expectations
    const now = new Date()
    return {
      id: '1', // Default ID to match UserFactory
      createdAt: now,
      updatedAt: now,
      ...(entityLike || {}),
    } as User
  }

  save<T>(_entity: any, _options?: SaveOptions): Promise<T> {
    return Promise.resolve({} as T)
  }

  createQueryBuilder(_alias?: string): any {
    return {
      leftJoin: () => ({}),
      select: () => ({}),
      where: () => ({}),
      getOne: () => Promise.resolve(null),
    }
  }
}
