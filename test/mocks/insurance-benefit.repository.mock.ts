import { BaseRepositoryMock } from './base.repository.mock'
import { InsuranceBenefit } from '../../src/insurance/entities/insurance-benefit.entity'

export class InsuranceBenefitRepositoryMock extends BaseRepositoryMock<InsuranceBenefit> {
  constructor() {
    super()
  }

  async remove(entity: InsuranceBenefit): Promise<InsuranceBenefit> {
    this.items = this.items.filter((item) => item.id !== entity.id)
    return Promise.resolve(entity)
  }
}
