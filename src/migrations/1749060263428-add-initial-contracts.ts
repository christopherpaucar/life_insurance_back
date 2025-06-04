import { MigrationInterface, QueryRunner } from 'typeorm'
import { ContractStatus } from '../contract/entities/contract.entity'
import { PaymentFrequency } from '../insurance/entities/insurance-price.entity'
import { RelationshipType } from '../contract/entities/beneficiary.entity'
import { AttachmentType } from '../contract/entities/attachment.entity'

export class AddInitialContracts1749060263428 implements MigrationInterface {
  name = 'AddInitialContracts1749060263428'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const clientId = await this.getClientId(queryRunner)
    const insurances = await this.getInsurances(queryRunner)
    const paymentMethods = await this.createPaymentMethods(queryRunner, clientId)

    const contractStates = [
      ContractStatus.DRAFT,
      ContractStatus.AWAITING_CLIENT_CONFIRMATION,
      ContractStatus.PENDING_BASIC_DOCUMENTS,
      ContractStatus.ACTIVE,
    ]

    for (let i = 0; i < insurances.length; i++) {
      const insurance = insurances[i]
      const contractNumber = `INS-${Date.now().toString().slice(-8)}-${i}`
      const startDate = new Date()
      const endDate = new Date()
      endDate.setFullYear(endDate.getFullYear() + 1)

      const contractResult = await queryRunner.query(
        `
        INSERT INTO contracts (
          id, "contractNumber", status, "startDate", "endDate", "totalAmount",
          "paymentFrequency", "user_id", "insurance_id", "payment_method_id",
          "createdAt", "updatedAt"
        )
        VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
        )
        RETURNING id
      `,
        [
          contractNumber,
          contractStates[i % contractStates.length],
          startDate,
          endDate,
          insurance.basePrice,
          PaymentFrequency.MONTHLY,
          clientId,
          insurance.id,
          paymentMethods[i % paymentMethods.length].id,
        ],
      )

      const contractId = contractResult[0].id

      await this.createBeneficiaries(queryRunner, contractId)
      await this.createAttachments(queryRunner, contractId)
      await this.createTransactions(queryRunner, contractId, insurance.basePrice)
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const clientId = await this.getClientId(queryRunner)
    const contracts = await queryRunner.query(`SELECT id FROM contracts WHERE user_id = $1`, [clientId])

    for (const contract of contracts) {
      await queryRunner.query(`DELETE FROM beneficiaries WHERE contract_id = $1`, [contract.id])
      await queryRunner.query(`DELETE FROM attachments WHERE contract_id = $1`, [contract.id])
      await queryRunner.query(`DELETE FROM transactions WHERE contract_id = $1`, [contract.id])
      await queryRunner.query(`DELETE FROM contracts WHERE id = $1`, [contract.id])
    }

    await queryRunner.query(`DELETE FROM payment_methods WHERE user_id = $1`, [clientId])
  }

  private async getClientId(queryRunner: QueryRunner): Promise<string> {
    const result = await queryRunner.query(`SELECT id FROM users WHERE email = $1`, ['client@client.com'])
    return result[0].id
  }

  private async getInsurances(queryRunner: QueryRunner): Promise<Array<{ id: string; basePrice: number }>> {
    const result = await queryRunner.query(
      `SELECT i.id, ip.price as "basePrice" 
       FROM insurances i 
       JOIN insurance_prices ip ON i.id = ip.insurance_id 
       WHERE ip.frequency = $1`,
      [PaymentFrequency.MONTHLY],
    )
    return result
  }

  private async createPaymentMethods(queryRunner: QueryRunner, userId: string): Promise<Array<{ id: string }>> {
    const paymentMethods = [
      {
        type: 'credit_card',
        details: {
          cardNumber: '4111111111111111',
          cardHolder: 'REJECTED',
          cardExpirationDate: '1225',
          cvv: '123',
        },
        isDefault: true,
      },
      {
        type: 'debit_card',
        details: {
          cardNumber: '4242424242424242',
          cardHolder: 'APPROVED',
          cardExpirationDate: '1225',
          cvv: '123',
        },
        isDefault: false,
      },
    ]

    const results: { id: string }[] = []

    for (const method of paymentMethods) {
      const result = await queryRunner.query(
        `
        INSERT INTO payment_methods (
          id, type, details, "isDefault", "user_id", "createdAt", "updatedAt"
        )
        VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, NOW(), NOW()
        )
        RETURNING id
      `,
        [method.type, JSON.stringify(method.details), method.isDefault, userId],
      )
      results.push(result[0])
    }

    return results
  }

  private async createBeneficiaries(queryRunner: QueryRunner, contractId: string): Promise<void> {
    const beneficiaries = [
      {
        firstName: 'John',
        lastName: 'Doe',
        relationship: RelationshipType.SPOUSE,
        percentage: 50,
        contactInfo: 'john.doe@example.com',
      },
      {
        firstName: 'Jane',
        lastName: 'Doe',
        relationship: RelationshipType.CHILD,
        percentage: 50,
        contactInfo: 'jane.doe@example.com',
      },
    ]

    for (const beneficiary of beneficiaries) {
      await queryRunner.query(
        `
        INSERT INTO beneficiaries (
          id, "firstName", "lastName", relationship, percentage, "contactInfo",
          "contract_id", "createdAt", "updatedAt"
        )
        VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, $5, $6, NOW(), NOW()
        )
      `,
        [
          beneficiary.firstName,
          beneficiary.lastName,
          beneficiary.relationship,
          beneficiary.percentage,
          beneficiary.contactInfo,
          contractId,
        ],
      )
    }
  }

  private async createAttachments(queryRunner: QueryRunner, contractId: string): Promise<void> {
    const attachments = [
      {
        fileName: 'contract.pdf',
        fileUrl: 'https://example.com/contract.pdf',
        type: AttachmentType.CONTRACT,
        description: 'Contract document',
      },
      {
        fileName: 'certificate.p12',
        fileUrl: 'https://example.com/certificate.p12',
        type: AttachmentType.P12,
        description: 'P12 certificate file',
      },
    ]

    for (const attachment of attachments) {
      await queryRunner.query(
        `
        INSERT INTO attachments (
          id, "fileName", "fileUrl", type, description, "contract_id",
          "createdAt", "updatedAt"
        )
        VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, $5, NOW(), NOW()
        )
      `,
        [attachment.fileName, attachment.fileUrl, attachment.type, attachment.description, contractId],
      )
    }
  }

  private async createTransactions(queryRunner: QueryRunner, contractId: string, amount: number): Promise<void> {
    const startDate = new Date()
    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + 1)

    const months = this.calculateMonthsBetween(startDate, endDate)

    for (let i = 0; i < months; i++) {
      const nextPaymentDate = new Date(startDate)
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + i)

      await queryRunner.query(
        `
        INSERT INTO transactions (
          id, amount, status, "nextPaymentDate", "contract_id",
          "createdAt", "updatedAt"
        )
        VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, NOW(), NOW()
        )
      `,
        [amount, 'pending', nextPaymentDate, contractId],
      )
    }
  }

  private calculateMonthsBetween(startDate: Date, endDate: Date): number {
    return (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())
  }
}
