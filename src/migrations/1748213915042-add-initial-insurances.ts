import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddInitialInsurances1748213915042 implements MigrationInterface {
  name = 'AddInitialInsurances1748213915042'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "insurance_coverage_relations" DROP CONSTRAINT "FK_2c575fff9d4c3c919dceba57542"`,
    )
    await queryRunner.query(
      `ALTER TABLE "insurance_coverage_relations" DROP CONSTRAINT "FK_fd02f37d7a37b1c9d24f0be21c1"`,
    )
    await queryRunner.query(
      `ALTER TABLE "insurance_benefit_relations" DROP CONSTRAINT "FK_da9355d3e1fd723e799fd3f2224"`,
    )
    await queryRunner.query(
      `ALTER TABLE "insurance_benefit_relations" DROP CONSTRAINT "FK_57d48cdeccf525bb19f945209eb"`,
    )
    await queryRunner.query(
      `ALTER TABLE "insurance_coverage_relations" ADD CONSTRAINT "FK_fd02f37d7a37b1c9d24f0be21c1" FOREIGN KEY ("coverage_id") REFERENCES "insurance_coverages"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE "insurance_coverage_relations" ADD CONSTRAINT "FK_2c575fff9d4c3c919dceba57542" FOREIGN KEY ("insurance_id") REFERENCES "insurances"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "insurance_benefit_relations" ADD CONSTRAINT "FK_57d48cdeccf525bb19f945209eb" FOREIGN KEY ("benefit_id") REFERENCES "insurance_benefits"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE "insurance_benefit_relations" ADD CONSTRAINT "FK_da9355d3e1fd723e799fd3f2224" FOREIGN KEY ("insurance_id") REFERENCES "insurances"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "insurance_benefit_relations" DROP CONSTRAINT "FK_da9355d3e1fd723e799fd3f2224"`,
    )
    await queryRunner.query(
      `ALTER TABLE "insurance_benefit_relations" DROP CONSTRAINT "FK_57d48cdeccf525bb19f945209eb"`,
    )
    await queryRunner.query(
      `ALTER TABLE "insurance_coverage_relations" DROP CONSTRAINT "FK_2c575fff9d4c3c919dceba57542"`,
    )
    await queryRunner.query(
      `ALTER TABLE "insurance_coverage_relations" DROP CONSTRAINT "FK_fd02f37d7a37b1c9d24f0be21c1"`,
    )
    await queryRunner.query(
      `ALTER TABLE "insurance_benefit_relations" ADD CONSTRAINT "FK_57d48cdeccf525bb19f945209eb" FOREIGN KEY ("benefit_id") REFERENCES "insurance_benefits"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE "insurance_benefit_relations" ADD CONSTRAINT "FK_da9355d3e1fd723e799fd3f2224" FOREIGN KEY ("insurance_id") REFERENCES "insurances"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "insurance_coverage_relations" ADD CONSTRAINT "FK_fd02f37d7a37b1c9d24f0be21c1" FOREIGN KEY ("coverage_id") REFERENCES "insurance_coverages"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE "insurance_coverage_relations" ADD CONSTRAINT "FK_2c575fff9d4c3c919dceba57542" FOREIGN KEY ("insurance_id") REFERENCES "insurances"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }
}
