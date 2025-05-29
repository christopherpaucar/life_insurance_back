import { BaseRepositoryMock } from './base.repository.mock'
import { InsuranceCoverage } from '../../src/insurance/entities/insurance-coverage.entity'

export class InsuranceCoverageRepositoryMock extends BaseRepositoryMock<InsuranceCoverage> {
  constructor() {
    super()
  }

  async remove(entity: InsuranceCoverage): Promise<InsuranceCoverage> {
    this.items = this.items.filter((item) => item.id !== entity.id)
    return Promise.resolve(entity)
  }
}
