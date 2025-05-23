import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ContractController } from './controllers/contract.controller'
import { ContractService } from './services/contract.service'
import { Contract } from './entities/contract.entity'
import { Beneficiary } from './entities/beneficiary.entity'
import { Attachment } from './entities/attachment.entity'
import { Payment } from './entities/payment.entity'
import { AuthModule } from '../auth/auth.module'
import { InsuranceModule } from '../insurance/insurance.module'
import { PaymentService } from './services/payment.service'
import { SignatureService } from './services/signature.service'
import { FileStorageModule } from '../common/file-storage.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, Beneficiary, Attachment, Payment]),
    AuthModule,
    InsuranceModule,
    FileStorageModule,
  ],
  controllers: [ContractController],
  providers: [ContractService, PaymentService, SignatureService],
  exports: [ContractService, PaymentService],
})
export class ContractModule {}
