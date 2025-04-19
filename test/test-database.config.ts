import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { BetterSqlite3ConnectionOptions } from 'typeorm/driver/better-sqlite3/BetterSqlite3ConnectionOptions'

export const getTestDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'better-sqlite3',
  database: ':memory:',
  dropSchema: true,
  entities: ['dist/**/*.entity{.ts,.js}'],
  synchronize: true,
  logging: false,
})

export const createTestDataSource = async (): Promise<DataSource> => {
  const dataSource = new DataSource({
    ...getTestDatabaseConfig(),
    type: 'better-sqlite3',
    database: ':memory:',
  } as BetterSqlite3ConnectionOptions)

  await dataSource.initialize()
  return dataSource
}

export const closeTestDataSource = async (dataSource: DataSource): Promise<void> => {
  if (dataSource.isInitialized) {
    await dataSource.destroy()
  }
}
