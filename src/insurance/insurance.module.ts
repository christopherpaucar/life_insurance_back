import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { InsuranceController } from './controllers/insurance.controller'
import { InsuranceService } from './services/insurance.service'
import { InsuranceCoverageController } from './controllers/insurance-coverage.controller'
import { InsuranceCoverageService } from './services/insurance-coverage.service'
import { InsuranceBenefitController } from './controllers/insurance-benefit.controller'
import { InsuranceBenefitService } from './services/insurance-benefit.service'
import { Insurance } from './entities/insurance.entity'
import { InsuranceCoverage } from './entities/insurance-coverage.entity'
import { InsuranceBenefit } from './entities/insurance-benefit.entity'
import { AuthModule } from '../auth/auth.module'
import { InsuranceBenefitRelation } from './entities/insurance-benefit-relation.entity'
import { InsuranceCoverageRelation } from './entities/insurance-coverage-relation.entity'
import { InsurancePrice } from './entities/insurance-price.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Insurance,
      InsuranceCoverage,
      InsuranceBenefit,
      InsuranceBenefitRelation,
      InsuranceCoverageRelation,
      InsurancePrice,
    ]),
    AuthModule,
  ],
  controllers: [InsuranceController, InsuranceCoverageController, InsuranceBenefitController],
  providers: [InsuranceService, InsuranceCoverageService, InsuranceBenefitService],
  exports: [InsuranceService, InsuranceCoverageService, InsuranceBenefitService],
})
export class InsuranceModule {}
