import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, Repository } from 'typeorm'
import { Contract, ContractStatus } from '../contract/entities/contract.entity'
import { Reimbursement, ReimbursementStatus } from '../reimbursement/entities/reimbursement.entity'
import { Transaction, TransactionStatus } from '../contract/entities/transaction.entity'

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Reimbursement)
    private reimbursementRepository: Repository<Reimbursement>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async getUnpaidInsurances(startDate?: string, endDate?: string) {
    const where: any = {
      status: ContractStatus.ACTIVE,
    }

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate))
    }

    const contracts = await this.contractRepository.find({
      where,
      relations: ['transactions'],
    })

    const unpaidContracts = contracts.filter((contract) => {
      const lastTransaction = contract.transactions[contract.transactions.length - 1]
      return !lastTransaction || lastTransaction.status !== TransactionStatus.SUCCESS
    })

    return {
      labels: unpaidContracts.map((contract) => contract.contractNumber),
      datasets: [
        {
          label: 'Unpaid Insurances',
          data: unpaidContracts.map(() => 1),
        },
      ],
    }
  }

  async getContractsByClient(startDate?: string, endDate?: string) {
    const where: any = {}

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate))
    }

    const contracts = await this.contractRepository.find({
      where,
      relations: ['user'],
    })

    const clientContracts = contracts.reduce((acc, contract) => {
      const clientName = contract.user.name
      if (!clientName) return acc

      acc[clientName] = (acc[clientName] || 0) + 1
      return acc
    }, {})

    return {
      labels: Object.keys(clientContracts),
      datasets: [
        {
          label: 'Contracts by Client',
          data: Object.values(clientContracts),
        },
      ],
    }
  }

  async getPendingRequests(startDate?: string, endDate?: string) {
    const where: any = {
      status: ReimbursementStatus.SUBMITTED,
    }

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate))
    }

    const reimbursements = await this.reimbursementRepository.find({
      where,
      relations: ['contract'],
    })

    return {
      labels: reimbursements.map((reimbursement) => reimbursement.requestNumber),
      datasets: [
        {
          label: 'Pending Requests',
          data: reimbursements.map(() => 1),
        },
      ],
    }
  }

  async getExpiringContracts(startDate?: string, endDate?: string) {
    const where: any = {
      status: ContractStatus.ACTIVE,
    }

    if (startDate && endDate) {
      where.endDate = Between(new Date(startDate), new Date(endDate))
    }

    const contracts = await this.contractRepository.find({
      where,
      relations: ['user'],
    })

    return {
      labels: contracts.map((contract) => contract.contractNumber),
      datasets: [
        {
          label: 'Expiring Contracts',
          data: contracts.map(() => 1),
        },
      ],
    }
  }
}
