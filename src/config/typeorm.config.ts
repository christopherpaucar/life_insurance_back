import { DataSource, DataSourceOptions } from 'typeorm'
import { config } from 'dotenv'

config()

type DatabaseConfig = {
  host: string
  port: number
  username: string
  password: string
  database: string
}

const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'life_insurance',
}

const options: DataSourceOptions = {
  type: 'postgres',
  ...dbConfig,
  synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
  logging: process.env.TYPEORM_LOGGING === 'true',
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}', 'src/migrations/*{.ts,.js}'],
  migrationsRun: process.env.TYPEORM_MIGRATIONS_RUN === 'true',
}

export const AppDataSource = new DataSource(options)
