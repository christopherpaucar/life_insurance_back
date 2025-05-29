import { InsuranceCoverage } from '../../src/insurance/entities/insurance-coverage.entity'

export const createInsuranceCoverageFixture = (): Partial<InsuranceCoverage> => ({
  id: '1',
  name: 'Test Coverage',
  description: 'Test Coverage Description',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: undefined,
})
