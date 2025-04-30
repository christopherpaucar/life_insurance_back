import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { InsuranceController } from './controllers/insurance.controller'
import { InsuranceService } from './services/insurance.service'
import { Insurance } from './entities/insurance.entity'
import { InsuranceCoverage } from './entities/insurance-coverage.entity'
import { InsuranceBenefit } from './entities/insurance-benefit.entity'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TypeOrmModule.forFeature([Insurance, InsuranceCoverage, InsuranceBenefit]), AuthModule],
  controllers: [InsuranceController],
  providers: [InsuranceService],
  exports: [InsuranceService],
})
export class InsuranceModule {}
