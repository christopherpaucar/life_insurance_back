import { MigrationInterface, QueryRunner } from 'typeorm'
import { RoleType, DEFAULT_PERMISSIONS } from '../auth/entities/role.entity'

export class AddInitialRoles1701275438542 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create roles with their default permissions
    for (const roleType of Object.values(RoleType)) {
      const permissions = DEFAULT_PERMISSIONS[roleType] || []
      const description = this.getRoleDescription(roleType)

      await queryRunner.query(
        `
        INSERT INTO roles (id, name, description, permissions, "createdAt", "updatedAt")
        VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), NOW())
        ON CONFLICT (name) DO NOTHING;
      `,
        [roleType, description, JSON.stringify(permissions)],
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all roles created by this migration
    for (const roleType of Object.values(RoleType)) {
      await queryRunner.query(`DELETE FROM roles WHERE name = $1`, [roleType])
    }
  }

  private getRoleDescription(roleType: RoleType): string {
    const descriptions = {
      [RoleType.SUPER_ADMIN]: 'Super administrador con acceso completo al sistema',
      [RoleType.ADMIN]: 'Administrador con acceso a gestión de usuarios y seguros',
      [RoleType.REVISOR]: 'Revisor de solicitudes de reembolso',
      [RoleType.CLIENTE]: 'Cliente del sistema de seguros',
      [RoleType.AGENTE]: 'Agente de ventas y servicio al cliente',
    }

    return descriptions[roleType] || `Rol ${roleType}`
  }
}
