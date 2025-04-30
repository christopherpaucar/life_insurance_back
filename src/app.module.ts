import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { InsuranceModule } from './insurance/insurance.module'
import { ClientModule } from './client/client.module'
import { ContractModule } from './contract/contract.module'
import { ReimbursementModule } from './reimbursement/reimbursement.module'
import { FileStorageModule } from './common/file-storage.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        logging: true,
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
    AuthModule,
    InsuranceModule,
    ClientModule,
    ContractModule,
    ReimbursementModule,
    FileStorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
