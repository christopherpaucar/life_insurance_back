import { vi, beforeEach } from 'vitest'
import { Test } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule } from '@nestjs/config'
import { getTestDatabaseConfig } from './test-database.config'
import { User } from '../src/auth/entities/user.entity'

vi.mock('@nestjs/common', async () => {
  const actual = await vi.importActual('@nestjs/common')
  return {
    ...actual,
    Injectable: () => vi.fn(),
    Inject: () => vi.fn(),
  }
})

vi.mock('@nestjs/typeorm', async () => {
  const actual = await vi.importActual('@nestjs/typeorm')
  return {
    ...actual,
    InjectRepository: () => vi.fn(),
  }
})

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}))

export const createTestingModule = async (module: any) => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      TypeOrmModule.forRoot({
        ...getTestDatabaseConfig(),
        entities: [User],
      }),
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.register({
        secret: 'test-secret',
        signOptions: { expiresIn: '1d' },
      }),
      module,
    ],
  }).compile()

  return moduleRef
}

beforeEach(() => {
  vi.clearAllMocks()
})
