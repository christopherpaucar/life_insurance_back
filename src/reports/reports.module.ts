import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ReportsController } from './reports.controller'
import { ReportsService } from './reports.service'
import { Contract } from '../contract/entities/contract.entity'
import { Reimbursement } from '../reimbursement/entities/reimbursement.entity'
import { Transaction } from '../contract/entities/transaction.entity'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TypeOrmModule.forFeature([Contract, Reimbursement, Transaction]), AuthModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
