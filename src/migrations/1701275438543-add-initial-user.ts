import { MigrationInterface, QueryRunner } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { RoleType } from '../auth/entities/role.entity'

export class AddInitialUser1701275438543 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const password = '12@Lenin'

    await this.createUser(queryRunner, 'super@super.com', 'Super Admin', password, RoleType.SUPER_ADMIN)
    await this.createUser(queryRunner, 'admin@admin.com', 'Admin', password, RoleType.ADMIN)
    await this.createUser(queryRunner, 'client@client.com', 'Client', password, RoleType.CLIENT)
    await this.createUser(queryRunner, 'agent@agent.com', 'Agent', password, RoleType.AGENT)
    await this.createUser(queryRunner, 'reviewer@reviewer.com', 'Reviewer', password, RoleType.REVIEWER)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.deleteUser(queryRunner, 'super@super.com')
    await this.deleteUser(queryRunner, 'admin@admin.com')
    await this.deleteUser(queryRunner, 'client@client.com')
    await this.deleteUser(queryRunner, 'agent@agent.com')
    await this.deleteUser(queryRunner, 'reviewer@reviewer.com')
  }

  public async createUser(
    queryRunner: QueryRunner,
    email: string,
    name: string,
    password: string,
    role: RoleType,
  ): Promise<void> {
    const passwordHash = await bcrypt.hash(password, 10)

    await queryRunner.query(
      `
      INSERT INTO users (id, email, name, password, "createdAt", "updatedAt", "role_id")
      VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), NOW(), (SELECT id FROM roles WHERE name = $4))
    `,
      [email, name, passwordHash, role],
    )
  }

  public async deleteUser(queryRunner: QueryRunner, email: string): Promise<void> {
    await queryRunner.query(
      `
      DELETE FROM users WHERE email = $1
    `,
      [email],
    )
  }
}
