import { MigrationInterface, QueryRunner } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { RoleType } from '../auth/entities/role.entity'

export class AddSuperAdminUser1701275438543 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create super admin user
    const passwordHash = await bcrypt.hash('12@Lenin', 10)

    // Insert the user
    await queryRunner.query(
      `
      INSERT INTO users (id, email, name, password, "createdAt", "updatedAt", "role_id")
      VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), NOW(), (SELECT id FROM roles WHERE name = $4))
    `,
      ['super@super.com', 'Super Admin', passwordHash, RoleType.SUPER_ADMIN],
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete the super admin user
    await queryRunner.query(
      `
      DELETE FROM users WHERE email = $1
    `,
      ['super@super.com'],
    )
  }
}
