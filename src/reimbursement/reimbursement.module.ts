import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ReimbursementController } from './controllers/reimbursement.controller'
import { ReimbursementService } from './services/reimbursement.service'
import { Reimbursement } from './entities/reimbursement.entity'
import { ReimbursementItem } from './entities/reimbursement-item.entity'
import { AuthModule } from '../auth/auth.module'
import { ClientModule } from '../client/client.module'
import { ContractModule } from '../contract/contract.module'

@Module({
  imports: [TypeOrmModule.forFeature([Reimbursement, ReimbursementItem]), AuthModule, ClientModule, ContractModule],
  controllers: [ReimbursementController],
  providers: [ReimbursementService],
  exports: [ReimbursementService],
})
export class ReimbursementModule {}
