import { NotFoundException } from '@nestjs/common'
import { BaseEntity } from '../../src/common/entities/base.entity'

interface EntityWithId extends BaseEntity {
  id: string
}

interface EntityWithInsurance extends EntityWithId {
  insurance?: { id: string }
}

export class QueryBuilderMock {
  private joins: string[] = []
  private whereClause: string | null = null
  private whereParams: any = {}
  private orderByClause: string | null = null
  private additionalOrderBy: string | null = null
  private skipValue: number | null = null
  private takeValue: number | null = null
  private getOneResult: any = null

  leftJoinAndSelect(relation: string, alias: string) {
    this.joins.push(`${relation} as ${alias}`)
    return this
  }

  leftJoin(relation: string, alias: string) {
    this.joins.push(`${relation} as ${alias}`)
    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  select(columns: string[]) {
    return this
  }

  where(condition: string, params?: any) {
    this.whereClause = condition
    this.whereParams = params || {}
    return this
  }

  andWhere(condition: string, params?: any) {
    this.whereClause = this.whereClause ? `${this.whereClause} AND ${condition}` : condition
    this.whereParams = { ...this.whereParams, ...params }
    return this
  }

  orderBy(column: string, order: string) {
    this.orderByClause = `${column} ${order}`
    return this
  }

  addOrderBy(column: string, order: string) {
    this.additionalOrderBy = `${column} ${order}`
    return this
  }

  skip(value: number) {
    this.skipValue = value
    return this
  }

  take(value: number) {
    this.takeValue = value
    return this
  }

  getOne() {
    return Promise.resolve(this.getOneResult)
  }

  getManyAndCount() {
    return Promise.resolve([[], 0])
  }

  setGetOneResult(result: any) {
    this.getOneResult = result
  }
}

export class BaseRepositoryMock<T extends EntityWithId> {
  public items: Partial<T>[] = []
  public queryBuilder: QueryBuilderMock
  public manager: {
    save: (entity: any) => Promise<any>
    find: (options?: any) => Promise<any[]>
    findOne: () => Promise<any>
    create: (entity: any, data: any) => any
    delete: () => Promise<void>
    transaction: (callback: (manager: any) => Promise<any>) => Promise<any>
  }

  constructor() {
    this.queryBuilder = new QueryBuilderMock()
  }

  create(dto: any): Partial<T> {
    return {
      ...dto,
      id: `${this.items.length + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
    } as Partial<T>
  }

  save(entity: any): Promise<Partial<T>> {
    if (Array.isArray(entity)) {
      const savedEntities = entity.map((e) => {
        if (e.id) {
          const index = this.items.findIndex((item) => item.id === e.id)
          if (index !== -1) {
            this.items[index] = { ...this.items[index], ...e }
            return this.items[index]
          }
        }
        const newEntity = this.create(e)
        this.items.push(newEntity)
        return newEntity
      })
      return Promise.resolve(savedEntities[0])
    }

    if (entity.id) {
      const index = this.items.findIndex((item) => item.id === entity.id)
      if (index !== -1) {
        this.items[index] = { ...this.items[index], ...entity }
        return Promise.resolve(this.items[index])
      }
    }
    const newEntity = this.create(entity)
    this.items.push(newEntity)
    return Promise.resolve(newEntity)
  }

  findOne(options: any): Promise<Partial<T> | null> {
    const { where } = options
    const id = where.id
    const item = this.items.find((item) => item.id === id)
    return Promise.resolve(item || null)
  }

  find(options?: any): Promise<Partial<T>[]> {
    if (options?.where?.id) {
      const ids = Array.isArray(options.where.id) ? options.where.id : [options.where.id]
      return Promise.resolve(this.items.filter((item) => ids.includes(item.id)))
    }
    return Promise.resolve(this.items)
  }

  createQueryBuilder() {
    return this.queryBuilder
  }

  async softDelete(id: string): Promise<void> {
    const index = this.items.findIndex((item) => item.id === id)
    if (index === -1) {
      throw new NotFoundException(`Entity with ID ${id} not found`)
    }
    this.items[index] = {
      ...this.items[index],
      deletedAt: new Date(),
    }
    await Promise.resolve()
  }

  async delete(criteria: any): Promise<void> {
    const { insurance } = criteria
    const index = this.items.findIndex((item) => (item as EntityWithInsurance).insurance?.id === insurance.id)
    if (index !== -1) {
      this.items.splice(index, 1)
    }
    await Promise.resolve()
  }

  async update(id: string, partialEntity: Partial<T>): Promise<void> {
    const index = this.items.findIndex((item) => item.id === id)
    if (index !== -1) {
      this.items[index] = {
        ...this.items[index],
        ...partialEntity,
        updatedAt: new Date(),
      }
    }
    await Promise.resolve()
  }
}
