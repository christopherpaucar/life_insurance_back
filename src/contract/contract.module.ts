import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Contract } from './entities/contract.entity'
import { Beneficiary } from './entities/beneficiary.entity'
import { Attachment } from './entities/attachment.entity'
import { Transaction } from './entities/transaction.entity'
import { PaymentMethod } from './entities/payment-method.entity'
import { ContractController } from './controllers/contract.controller'
import { ContractService } from './services/contract.service'
import { PaymentController } from './controllers/payment.controller'
import { PaymentService } from './services/payment.service'
import { AuthModule } from '../auth/auth.module'
import { InsuranceModule } from '../insurance/insurance.module'
import { SignatureService } from './services/signature.service'
import { FileStorageModule } from '../common/file-storage.module'
import { InsurancePrice } from '../insurance/entities/insurance-price.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, Beneficiary, Attachment, Transaction, PaymentMethod, InsurancePrice]),
    AuthModule,
    InsuranceModule,
    FileStorageModule,
  ],
  controllers: [ContractController, PaymentController],
  providers: [ContractService, PaymentService, SignatureService],
  exports: [ContractService, PaymentService],
})
export class ContractModule {}
