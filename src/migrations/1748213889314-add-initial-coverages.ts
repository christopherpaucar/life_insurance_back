import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddInitialCoverages1748213889314 implements MigrationInterface {
  name = 'AddInitialCoverages1748213889314'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.createCoverage(queryRunner, 'Cobertura de enfermedad', 'Cobertura de enfermedad')
    await this.createCoverage(queryRunner, 'Cobertura de accidente', 'Cobertura de accidente')
    await this.createCoverage(queryRunner, 'Cobertura de muerte', 'Cobertura de muerte')
    await this.createCoverage(queryRunner, 'Cobertura de robo', 'Cobertura de robo')
    await this.createCoverage(queryRunner, 'Cobertura de incendio', 'Cobertura de incendio')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.deleteCoverage(queryRunner, 'Cobertura de enfermedad')
    await this.deleteCoverage(queryRunner, 'Cobertura de accidente')
    await this.deleteCoverage(queryRunner, 'Cobertura de muerte')
    await this.deleteCoverage(queryRunner, 'Cobertura de robo')
    await this.deleteCoverage(queryRunner, 'Cobertura de incendio')
  }

  public async createCoverage(queryRunner: QueryRunner, name: string, description: string): Promise<void> {
    await queryRunner.query(
      `INSERT INTO insurance_coverages (id, name, description, "createdAt", "updatedAt") VALUES (uuid_generate_v4(), $1, $2, NOW(), NOW())`,
      [name, description],
    )
  }

  public async deleteCoverage(queryRunner: QueryRunner, email: string): Promise<void> {
    await queryRunner.query(`DELETE FROM insurance_coverages WHERE name = $1`, [email])
  }
}
