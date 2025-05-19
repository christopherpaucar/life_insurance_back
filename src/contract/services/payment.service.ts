import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { Contract } from '../entities/contract.entity'
import { Payment, PaymentStatus } from '../entities/payment.entity'
import { PaymentFrequency } from '../../insurance/entities/insurance.entity'
import { addMonths, addYears } from 'date-fns'

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async generatePaymentSchedule(contract: Contract): Promise<Payment[]> {
    const payments: Payment[] = []

    const startDate = new Date(contract.startDate)
    const endDate = new Date(contract.endDate)
    const frequency = contract.paymentFrequency

    let numberOfPayments: number

    switch (frequency) {
      case PaymentFrequency.MONTHLY:
        numberOfPayments = this.calculateMonthsBetween(startDate, endDate)
        break
      case PaymentFrequency.QUARTERLY:
        numberOfPayments = Math.ceil(this.calculateMonthsBetween(startDate, endDate) / 3)
        break
      case PaymentFrequency.YEARLY:
        numberOfPayments = Math.ceil(this.calculateMonthsBetween(startDate, endDate) / 12)
        break
      default:
        numberOfPayments = 1
    }

    const installmentAmount = Math.round((contract.totalAmount / numberOfPayments) * 100) / 100

    for (let i = 0; i < numberOfPayments; i++) {
      let dueDate = new Date(startDate)

      if (i > 0) {
        switch (frequency) {
          case PaymentFrequency.MONTHLY:
            dueDate = addMonths(startDate, i)
            break
          case PaymentFrequency.QUARTERLY:
            dueDate = addMonths(startDate, i * 3)
            break
          case PaymentFrequency.YEARLY:
            dueDate = addYears(startDate, i)
            break
        }
      }

      const payment = this.paymentRepository.create({
        amount:
          i === numberOfPayments - 1
            ? contract.totalAmount - installmentAmount * (numberOfPayments - 1)
            : installmentAmount,
        dueDate,
        status: PaymentStatus.PENDING,
        contract,
      })

      payments.push(payment)
    }

    await this.paymentRepository.save(payments)
    return payments
  }

  async recordPayment(
    paymentId: string,
    paymentData: {
      status: PaymentStatus
      paymentMethod?: string
      transactionId?: string
      notes?: string
    },
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['contract'],
    })

    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found`)
    }

    payment.status = paymentData.status

    if (paymentData.paymentMethod) {
      payment.paymentMethod = paymentData.paymentMethod as any
    }

    if (paymentData.transactionId) {
      payment.transactionId = paymentData.transactionId
    }

    if (paymentData.notes) {
      payment.notes = paymentData.notes
    }

    if (payment.status === PaymentStatus.PAID) {
      payment.paidAt = new Date()
    }

    return await this.paymentRepository.save(payment)
  }

  async deletePaymentsForContract(contractId: string): Promise<void> {
    await this.paymentRepository.delete({ contract: { id: contractId } })
  }

  async findOverduePayments(): Promise<Payment[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return this.paymentRepository.find({
      where: {
        status: PaymentStatus.PENDING,
        dueDate: LessThan(today),
      },
      relations: ['contract', 'contract.client'],
    })
  }

  async updateOverduePayments(): Promise<void> {
    const overduePayments = await this.findOverduePayments()

    for (const payment of overduePayments) {
      payment.status = PaymentStatus.OVERDUE
      await this.paymentRepository.save(payment)
    }
  }

  // Helper method to calculate months between two dates
  private calculateMonthsBetween(startDate: Date, endDate: Date): number {
    const years = endDate.getFullYear() - startDate.getFullYear()
    const months = endDate.getMonth() - startDate.getMonth()

    return years * 12 + months + 1 // +1 to include the start month
  }
}
