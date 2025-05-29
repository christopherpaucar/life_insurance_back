import { BaseRepositoryMock } from './base.repository.mock'
import { InsuranceCoverage } from '../../src/insurance/entities/insurance-coverage.entity'

export class InsuranceCoverageRepositoryMock extends BaseRepositoryMock<InsuranceCoverage> {
  constructor() {
    super()
  }
}
