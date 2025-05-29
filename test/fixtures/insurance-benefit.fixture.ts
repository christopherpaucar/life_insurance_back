import { InsuranceBenefit } from '../../src/insurance/entities/insurance-benefit.entity'

export const createInsuranceBenefitFixture = (): Partial<InsuranceBenefit> => ({
  id: '1',
  name: 'Test Benefit',
  description: 'Test Benefit Description',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: undefined,
})
