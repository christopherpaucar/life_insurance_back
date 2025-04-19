import { MigrationInterface, QueryRunner } from 'typeorm'

export class EnableUuidExtension1701275438541 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  public async down(queryRunner: QueryRunner): Promise<void> {
    // It's usually not recommended to drop the extension as it might be used by other tables
    // If you want to drop it anyway, uncomment the line below
    // await queryRunner.query('DROP EXTENSION "uuid-ossp";')
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
