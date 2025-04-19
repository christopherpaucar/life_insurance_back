import { Test } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule } from '@nestjs/config'
import { getTestDatabaseConfig } from '../test-database.config'
import { User } from '../../src/auth/entities/user.entity'

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
