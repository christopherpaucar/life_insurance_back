import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddInitialBenefits1748213899620 implements MigrationInterface {
  name = 'AddInitialBenefits1748213899620'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.createBenefit(
      queryRunner,
      'Asistencia Médica 24/7',
      'Acceso a consultas médicas telefónicas y videollamadas las 24 horas del día, los 7 días de la semana',
    )
    await this.createBenefit(
      queryRunner,
      'Segunda Opinión Médica',
      'Consulta con especialistas de renombre para validar diagnósticos y tratamientos',
    )
    await this.createBenefit(
      queryRunner,
      'Traslado Médico',
      'Servicio de ambulancia y traslado médico en caso de emergencia',
    )
    await this.createBenefit(
      queryRunner,
      'Reembolso de Medicamentos',
      'Cobertura parcial o total de medicamentos recetados',
    )
    await this.createBenefit(
      queryRunner,
      'Chequeo Preventivo Anual',
      'Exámenes médicos preventivos anuales para detectar problemas de salud temprano',
    )
    await this.createBenefit(
      queryRunner,
      'Descuentos exclusivos en productos y servicios',
      'Acceso a descuentos especiales en productos y servicios de nuestros socios',
    )
    await this.createBenefit(
      queryRunner,
      'Asistencia Legal',
      'Asistencia legal en caso de accidentes o conflictos legales',
    )
    await this.createBenefit(
      queryRunner,
      'Asistencia Psicológica',
      'Asistencia psicológica en caso de crisis emocional o problemas de salud mental',
    )
    await this.createBenefit(
      queryRunner,
      'Asistencia Financiera',
      'Asistencia financiera en caso de pérdida de empleo o reducción de ingresos',
    )
    await this.createBenefit(
      queryRunner,
      'Asistencia en caso de pérdida de empleo',
      'Asistencia en caso de pérdida de empleo o reducción de ingresos',
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.deleteBenefit(queryRunner, 'Asistencia Médica 24/7')
    await this.deleteBenefit(queryRunner, 'Segunda Opinión Médica')
    await this.deleteBenefit(queryRunner, 'Traslado Médico')
    await this.deleteBenefit(queryRunner, 'Reembolso de Medicamentos')
    await this.deleteBenefit(queryRunner, 'Chequeo Preventivo Anual')
    await this.deleteBenefit(queryRunner, 'Descuentos exclusivos en productos y servicios')
    await this.deleteBenefit(queryRunner, 'Asistencia Legal')
    await this.deleteBenefit(queryRunner, 'Asistencia Psicológica')
    await this.deleteBenefit(queryRunner, 'Asistencia Financiera')
    await this.deleteBenefit(queryRunner, 'Asistencia en caso de pérdida de empleo')
  }

  public async createBenefit(queryRunner: QueryRunner, name: string, description: string): Promise<void> {
    await queryRunner.query(
      `INSERT INTO insurance_benefits (id, name, description, "createdAt", "updatedAt") VALUES (uuid_generate_v4(), $1, $2, NOW(), NOW())`,
      [name, description],
    )
  }

  public async deleteBenefit(queryRunner: QueryRunner, name: string): Promise<void> {
    await queryRunner.query(`DELETE FROM insurance_benefits WHERE name = $1`, [name])
  }
}
