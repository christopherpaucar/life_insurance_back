import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ClientController } from './controllers/client.controller'
import { ClientService } from './services/client.service'
import { Client } from './entities/client.entity'
import { AuthModule } from '../auth/auth.module'
import { User } from '../auth/entities/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Client, User]), forwardRef(() => AuthModule)],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}
