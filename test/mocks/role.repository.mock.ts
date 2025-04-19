/* eslint-disable @typescript-eslint/no-unused-vars */
import { FindOneOptions, DeepPartial, SaveOptions } from 'typeorm'
import { Role } from '../../src/auth/entities/role.entity'

export class RoleRepositoryMock {
  findOne(_options?: FindOneOptions<Role>): Promise<Role | null> {
    // Implementation is stubbed for tests and will be mocked with vi.spyOn
    return Promise.resolve(null)
  }

  find(): Promise<Role[]> {
    // Implementation is stubbed for tests and will be mocked with vi.spyOn
    return Promise.resolve([])
  }

  create(): Role
  create(entityLike: DeepPartial<Role>): Role
  create(entityLikeArray: DeepPartial<Role>[]): Role[]
  create(entityLike?: DeepPartial<Role> | DeepPartial<Role>[]): Role | Role[] {
    if (Array.isArray(entityLike)) {
      return entityLike.map((entity) => ({ ...entity }) as Role)
    }

    const now = new Date()
    return {
      id: '1',
      createdAt: now,
      updatedAt: now,
      ...(entityLike || {}),
    } as Role
  }

  save<T>(_entity: any, _options?: SaveOptions): Promise<T> {
    return Promise.resolve({} as T)
  }
}
