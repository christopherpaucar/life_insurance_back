import { MigrationInterface, QueryRunner } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { RoleType } from '../auth/entities/role.entity'

export class AddSuperAdminUser1701275438543 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create super admin user
    const passwordHash = await bcrypt.hash('12@Lenin', 10)

    // Insert the user
    const insertUserResult = await queryRunner.query(
      `
      INSERT INTO users (id, email, name, password, "createdAt", "updatedAt")
      VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), NOW())
      RETURNING id;
    `,
      ['super@super.com', 'Super Admin', passwordHash],
    )

    // Get the user id
    const userId = insertUserResult[0].id

    // Get the role id for SUPER_ADMIN
    const roleResult = await queryRunner.query(
      `
      SELECT id FROM roles WHERE name = $1
    `,
      [RoleType.SUPER_ADMIN],
    )

    if (roleResult.length > 0) {
      const roleId = roleResult[0].id

      // Create the user-role relationship with correct column names
      await queryRunner.query(
        `
        INSERT INTO users_roles (user_id, role_id)
        VALUES ($1, $2);
      `,
        [userId, roleId],
      )
    }
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
