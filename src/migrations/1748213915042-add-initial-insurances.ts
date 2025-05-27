import { MigrationInterface, QueryRunner } from 'typeorm'
import { InsuranceType } from '../insurance/entities/insurance.entity'
import { PaymentFrequency } from '../insurance/entities/insurance-price.entity'

export class AddInitialInsurances1748213915042 implements MigrationInterface {
  name = 'AddInitialInsurances1748213915042'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const healthInsuranceId = await this.createInsurance(
      queryRunner,
      'Seguro de Salud Básico',
      'Cobertura médica básica para consultas y emergencias',
      InsuranceType.HEALTH,
      ['Edad mínima: 18 años', 'Sin condiciones preexistentes'],
      1,
    )

    const lifeInsuranceId = await this.createInsurance(
      queryRunner,
      'Seguro de Vida Premium',
      'Protección financiera completa para tu familia',
      InsuranceType.LIFE,
      ['Edad mínima: 25 años', 'Examen médico requerido'],
      2,
    )

    const comprehensiveHealthId = await this.createInsurance(
      queryRunner,
      'Seguro de Salud Integral',
      'Cobertura médica completa con beneficios adicionales',
      InsuranceType.HEALTH,
      ['Edad mínima: 18 años', 'Sin condiciones preexistentes', 'Residencia permanente'],
      3,
    )

    await this.createInsurancePrices(queryRunner, healthInsuranceId, 50.0)
    await this.createInsurancePrices(queryRunner, lifeInsuranceId, 100.0)
    await this.createInsurancePrices(queryRunner, comprehensiveHealthId, 150.0)

    const coveragesIds = await this.getCurrentCoveragesIds(queryRunner)
    const benefitsIds = await this.getCurrentBenefitsIds(queryRunner)

    for (const insuranceId of [healthInsuranceId, lifeInsuranceId, comprehensiveHealthId]) {
      for (const coverageId of coveragesIds) {
        const coverageAmount =
          insuranceId === comprehensiveHealthId ? 100000 : insuranceId === lifeInsuranceId ? 50000 : 25000
        const additionalCost = insuranceId === comprehensiveHealthId ? 25 : insuranceId === lifeInsuranceId ? 15 : 10
        await this.createInsuranceCoverageRelation(queryRunner, insuranceId, coverageId, coverageAmount, additionalCost)
      }

      for (const benefitId of benefitsIds) {
        const additionalCost = insuranceId === comprehensiveHealthId ? 20 : insuranceId === lifeInsuranceId ? 15 : 10
        await this.createInsuranceBenefitRelation(queryRunner, insuranceId, benefitId, additionalCost)
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const insuranceIds = await this.getCurrentInsuranceIds(queryRunner)
    const coveragesIds = await this.getCurrentCoveragesIds(queryRunner)
    const benefitsIds = await this.getCurrentBenefitsIds(queryRunner)

    for (const insuranceId of insuranceIds) {
      await this.deleteInsurancePrices(queryRunner, insuranceId)

      for (const coverageId of coveragesIds) {
        await this.deleteInsuranceCoverageRelation(queryRunner, insuranceId, coverageId)
      }

      for (const benefitId of benefitsIds) {
        await this.deleteInsuranceBenefitRelation(queryRunner, insuranceId, benefitId)
      }

      await this.deleteInsurance(queryRunner, insuranceId)
    }
  }

  public async createInsurance(
    queryRunner: QueryRunner,
    name: string,
    description: string,
    type: InsuranceType,
    requirements: string[],
    order: number,
  ): Promise<string> {
    const result = await queryRunner.query(
      `INSERT INTO insurances (id, name, description, type, requirements, "order", "createdAt", "updatedAt") 
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
      [name, description, type, JSON.stringify(requirements), order],
    )

    return result[0].id
  }

  public async deleteInsurance(queryRunner: QueryRunner, id: string): Promise<void> {
    await queryRunner.query(`DELETE FROM insurances WHERE id = $1`, [id])
  }

  public async createInsuranceCoverageRelation(
    queryRunner: QueryRunner,
    insuranceId: string,
    coverageId: string,
    coverageAmount: number,
    additionalCost: number,
  ): Promise<void> {
    await queryRunner.query(
      `INSERT INTO insurance_coverage_relations (id, insurance_id, coverage_id, "coverageAmount", "additionalCost", "createdAt", "updatedAt") 
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW(), NOW())`,
      [insuranceId, coverageId, coverageAmount, additionalCost],
    )
  }

  public async deleteInsuranceCoverageRelation(
    queryRunner: QueryRunner,
    insuranceId: string,
    coverageId: string,
  ): Promise<void> {
    await queryRunner.query(`DELETE FROM insurance_coverage_relations WHERE insurance_id = $1 AND coverage_id = $2`, [
      insuranceId,
      coverageId,
    ])
  }

  public async createInsuranceBenefitRelation(
    queryRunner: QueryRunner,
    insuranceId: string,
    benefitId: string,
    additionalCost: number,
  ): Promise<void> {
    await queryRunner.query(
      `INSERT INTO insurance_benefit_relations (id, insurance_id, benefit_id, "additionalCost", "createdAt", "updatedAt") 
       VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), NOW())`,
      [insuranceId, benefitId, additionalCost],
    )
  }

  public async deleteInsuranceBenefitRelation(
    queryRunner: QueryRunner,
    insuranceId: string,
    benefitId: string,
  ): Promise<void> {
    await queryRunner.query(`DELETE FROM insurance_benefit_relations WHERE insurance_id = $1 AND benefit_id = $2`, [
      insuranceId,
      benefitId,
    ])
  }

  public async getCurrentBenefitsIds(queryRunner: QueryRunner): Promise<string[]> {
    const benefits = await queryRunner.query(`SELECT id FROM insurance_benefits`)
    return benefits.map((benefit: { id: string }) => benefit.id)
  }

  public async getCurrentCoveragesIds(queryRunner: QueryRunner): Promise<string[]> {
    const coverages = await queryRunner.query(`SELECT id FROM insurance_coverages`)
    return coverages.map((coverage: { id: string }) => coverage.id)
  }

  public async getCurrentInsuranceIds(queryRunner: QueryRunner): Promise<string[]> {
    const insurances = await queryRunner.query(`SELECT id FROM insurances`)
    return insurances.map((insurance: { id: string }) => insurance.id)
  }

  public async createInsurancePrices(queryRunner: QueryRunner, insuranceId: string, basePrice: number): Promise<void> {
    const frequencies = [PaymentFrequency.MONTHLY, PaymentFrequency.QUARTERLY, PaymentFrequency.YEARLY]

    for (const frequency of frequencies) {
      let price = basePrice
      if (frequency === PaymentFrequency.QUARTERLY) {
        price = basePrice * 3
      } else if (frequency === PaymentFrequency.YEARLY) {
        price = basePrice * 12
      }

      await queryRunner.query(
        `INSERT INTO insurance_prices (id, insurance_id, price, frequency, "createdAt", "updatedAt") 
         VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), NOW())`,
        [insuranceId, price, frequency],
      )
    }
  }

  public async deleteInsurancePrices(queryRunner: QueryRunner, insuranceId: string): Promise<void> {
    await queryRunner.query(`DELETE FROM insurance_prices WHERE insurance_id = $1`, [insuranceId])
  }
}
