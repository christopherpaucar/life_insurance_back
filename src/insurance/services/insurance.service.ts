import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Insurance } from '../entities/insurance.entity'
import { CreateInsuranceDto } from '../dto/create-insurance.dto'
import { UpdateInsuranceDto } from '../dto/update-insurance.dto'
import { PaginationService } from '../../common/services/pagination.service'
import { PaginationDto } from '../../common/dto/pagination.dto'
import { PaginatedResponse } from '../../common/interfaces/pagination.interface'
import { InsuranceCoverage } from '../entities/insurance-coverage.entity'
import { InsuranceBenefit } from '../entities/insurance-benefit.entity'
import { InsuranceBenefitRelation } from '../entities/insurance-benefit-relation.entity'
import { InsuranceCoverageRelation } from '../entities/insurance-coverage-relation.entity'
import { InsurancePrice, PaymentFrequency } from '../entities/insurance-price.entity'

@Injectable()
export class InsuranceService {
  constructor(
    @InjectRepository(Insurance)
    private insuranceRepository: Repository<Insurance>,
    @InjectRepository(InsuranceCoverage)
    private coverageRepository: Repository<InsuranceCoverage>,
    @InjectRepository(InsuranceBenefit)
    private benefitRepository: Repository<InsuranceBenefit>,
    @InjectRepository(InsuranceCoverageRelation)
    private coverageRelationRepository: Repository<InsuranceCoverageRelation>,
    @InjectRepository(InsuranceBenefitRelation)
    private benefitRelationRepository: Repository<InsuranceBenefitRelation>,
    @InjectRepository(InsurancePrice)
    private insurancePriceRepository: Repository<InsurancePrice>,
  ) {}

  async create(createInsuranceDto: CreateInsuranceDto): Promise<Insurance> {
    const {
      coverages: coveragesDto,
      benefits: benefitsDto,
      basePrice,
      availablePaymentFrequencies,
      ...insuranceData
    } = createInsuranceDto

    return await this.insuranceRepository.manager.transaction(async (manager) => {
      const insurance = manager.create(Insurance, insuranceData)
      const savedInsurance = await manager.save(insurance)

      await this.createPrices(manager, savedInsurance, basePrice, availablePaymentFrequencies)
      await this.createCoverages(manager, savedInsurance, coveragesDto)
      await this.createBenefits(manager, savedInsurance, benefitsDto)

      return this.findOne(savedInsurance.id, manager)
    })
  }

  private async createPrices(
    manager: any,
    insurance: Insurance,
    basePrice: number,
    frequencies: PaymentFrequency[],
  ): Promise<void> {
    const prices = frequencies.map((frequency) => {
      return manager.create(InsurancePrice, {
        insurance,
        price: this.calculatePriceByFrequency(basePrice, frequency),
        frequency,
      })
    })

    await manager.save(prices)
  }

  private async createCoverages(manager: any, insurance: Insurance, coveragesDto?: any[]): Promise<void> {
    if (!coveragesDto?.length) return

    const coverages = await manager.find(InsuranceCoverage, {
      where: { id: In(coveragesDto.map((coverage) => coverage.id)) },
    })

    if (coverages.length !== coveragesDto.length) {
      throw new NotFoundException('One or more coverages not found')
    }

    const coverageRelations = coveragesDto.map((coverageDto) => {
      const coverage = coverages.find((c) => c.id === coverageDto.id)
      return manager.create(InsuranceCoverageRelation, {
        insurance,
        coverage,
        coverageAmount: coverageDto.coverageAmount ?? 0,
        additionalCost: coverageDto.additionalCost ?? 0,
      })
    })

    await manager.save(coverageRelations)
  }

  private async createBenefits(manager: any, insurance: Insurance, benefitsDto?: any[]): Promise<void> {
    if (!benefitsDto?.length) return

    const benefits = await manager.find(InsuranceBenefit, {
      where: { id: In(benefitsDto.map((benefit) => benefit.id)) },
    })

    if (benefits.length !== benefitsDto.length) {
      throw new NotFoundException('One or more benefits not found')
    }

    const benefitRelations = benefitsDto.map((benefitDto) => {
      const benefit = benefits.find((b) => b.id === benefitDto.id)
      return manager.create(InsuranceBenefitRelation, {
        insurance,
        benefit,
        additionalCost: benefitDto.additionalCost ?? 0,
      })
    })

    await manager.save(benefitRelations)
  }

  async findAll(query): Promise<PaginatedResponse<Insurance>> {
    const paginationDto: PaginationDto = {
      page: query.page ? parseInt(query.page as string, 10) : 1,
      limit: query.limit ? parseInt(query.limit as string, 10) : 10,
    }

    const queryBuilder = this.insuranceRepository
      .createQueryBuilder('insurance')
      .leftJoinAndSelect('insurance.coverages', 'coverages')
      .leftJoinAndSelect('coverages.coverage', 'coverage')
      .leftJoinAndSelect('insurance.benefits', 'benefits')
      .leftJoinAndSelect('insurance.prices', 'prices')
      .leftJoinAndSelect('benefits.benefit', 'benefit')
      .where('insurance.deletedAt IS NULL')
      .orderBy('insurance.order', 'ASC')
      .addOrderBy('insurance.createdAt', 'DESC')

    const result = await PaginationService.paginateQueryBuilder(queryBuilder, paginationDto)
    return {
      data: result.data.map((insurance) => this.transformDecimalFields(insurance)),
      meta: result.meta,
    }
  }

  async findOne(id: string, manager?: any): Promise<Insurance> {
    const queryBuilder = await (manager?.createQueryBuilder(Insurance, 'insurance') ??
      this.insuranceRepository.createQueryBuilder('insurance'))

    const insurance = await queryBuilder
      .leftJoinAndSelect('insurance.coverages', 'coverages')
      .leftJoinAndSelect('coverages.coverage', 'coverage')
      .leftJoinAndSelect('insurance.benefits', 'benefits')
      .leftJoinAndSelect('benefits.benefit', 'benefit')
      .leftJoinAndSelect('insurance.prices', 'prices')
      .where('insurance.id = :id', { id })
      .getOne()

    if (!insurance) {
      throw new NotFoundException(`Insurance with ID ${id} not found`)
    }

    return this.transformDecimalFields(insurance)
  }

  async update(id: string, updateInsuranceDto: UpdateInsuranceDto): Promise<Insurance> {
    const {
      coverages: coveragesDto,
      benefits: benefitsDto,
      availablePaymentFrequencies,
      basePrice,
      ...insuranceData
    } = updateInsuranceDto

    return await this.insuranceRepository.manager.transaction(async (manager) => {
      const insurance = await this.findOne(id, manager)
      const updatedInsurance = Object.assign(insurance, insuranceData)
      await manager.save(updatedInsurance)

      await this.updatePrices(manager, id, insurance, availablePaymentFrequencies, basePrice)
      await this.updateCoverages(manager, id, updatedInsurance, coveragesDto)
      await this.updateBenefits(manager, id, updatedInsurance, benefitsDto)

      return this.findOne(id, manager)
    })
  }

  private async updatePrices(
    manager: any,
    id: string,
    insurance: Insurance,
    availablePaymentFrequencies?: PaymentFrequency[],
    basePrice?: number,
  ): Promise<void> {
    if (!availablePaymentFrequencies?.length && !basePrice) return

    const frequencies = availablePaymentFrequencies?.length
      ? availablePaymentFrequencies
      : insurance.prices.map((p) => p.frequency)

    const baseAmount = basePrice ?? insurance.prices.find((p) => p.frequency === PaymentFrequency.MONTHLY)?.price ?? 0

    const prices = frequencies.map((frequency) => {
      return manager.create(InsurancePrice, {
        insurance: { id },
        price: this.calculatePriceByFrequency(baseAmount, frequency),
        frequency,
      })
    })

    await manager.delete(InsurancePrice, { insurance: { id } })
    await manager.save(prices)
  }

  private calculatePriceByFrequency(basePrice: number, frequency: PaymentFrequency): number {
    return basePrice * (frequency === PaymentFrequency.QUARTERLY ? 3 : frequency === PaymentFrequency.YEARLY ? 12 : 1)
  }

  private async updateCoverages(manager: any, id: string, insurance: Insurance, coveragesDto?: any[]): Promise<void> {
    if (!coveragesDto) return

    const coveragesToDelete = coveragesDto.filter((coverage) => coverage.delete)
    const coveragesToUpdate = coveragesDto.filter((coverage) => !coverage.delete)

    if (coveragesToDelete.length > 0) {
      await this.deleteCoverages(manager, id, coveragesToDelete)
    }

    if (coveragesToUpdate.length > 0) {
      await this.updateCoverageRelations(manager, insurance, coveragesToUpdate)
    }
  }

  private async deleteCoverages(manager: any, id: string, coveragesToDelete: any[]): Promise<void> {
    await manager.softDelete(InsuranceCoverageRelation, {
      insurance: { id },
      coverage: { id: In(coveragesToDelete.map((c) => c.id)) },
    })
  }

  private async updateCoverageRelations(manager: any, insurance: Insurance, coveragesToUpdate: any[]): Promise<void> {
    const coverages = await manager.find(InsuranceCoverage, {
      where: { id: In(coveragesToUpdate.map((coverage) => coverage.id)) },
    })

    if (coverages.length !== coveragesToUpdate.length) {
      throw new NotFoundException('One or more coverages not found')
    }

    const coverageRelations = coveragesToUpdate.map((coverageDto) => {
      const coverage = coverages.find((c) => c.id === coverageDto.id)
      return manager.create(InsuranceCoverageRelation, {
        insurance,
        coverage,
        coverageAmount: coverageDto.coverageAmount ?? 0,
        additionalCost: coverageDto.additionalCost ?? 0,
      })
    })

    await manager.save(coverageRelations)
  }

  private async updateBenefits(manager: any, id: string, insurance: Insurance, benefitsDto?: any[]): Promise<void> {
    if (!benefitsDto) return

    const benefitsToDelete = benefitsDto.filter((benefit) => benefit.delete)
    const benefitsToUpdate = benefitsDto.filter((benefit) => !benefit.delete)

    if (benefitsToDelete.length > 0) {
      await this.deleteBenefits(manager, id, benefitsToDelete)
    }

    if (benefitsToUpdate.length > 0) {
      await this.updateBenefitRelations(manager, insurance, benefitsToUpdate)
    }
  }

  private async deleteBenefits(manager: any, id: string, benefitsToDelete: any[]): Promise<void> {
    await manager.softDelete(InsuranceBenefitRelation, {
      insurance: { id },
      benefit: { id: In(benefitsToDelete.map((b) => b.id)) },
    })
  }

  private async updateBenefitRelations(manager: any, insurance: Insurance, benefitsToUpdate: any[]): Promise<void> {
    const benefits = await manager.find(InsuranceBenefit, {
      where: { id: In(benefitsToUpdate.map((benefit) => benefit.id)) },
    })

    if (benefits.length !== benefitsToUpdate.length) {
      throw new NotFoundException('One or more benefits not found')
    }

    const benefitRelations = benefitsToUpdate.map((benefitDto) => {
      const benefit = benefits.find((b) => b.id === benefitDto.id)
      return manager.create(InsuranceBenefitRelation, {
        insurance,
        benefit,
        additionalCost: benefitDto.additionalCost ?? 0,
      })
    })

    await manager.save(benefitRelations)
  }

  async remove(id: string): Promise<void> {
    await this.coverageRelationRepository.delete({ insurance: { id } })
    await this.benefitRelationRepository.delete({ insurance: { id } })
    await this.insuranceRepository.softDelete(id)
  }

  /**
   * Useful to transform decimal fields to numbers
   *
   * @param insurance
   * @returns
   */
  private transformDecimalFields(insurance: Insurance): Insurance {
    if (insurance.coverages) {
      insurance.coverages = insurance.coverages.map((coverage) => ({
        ...coverage,
        coverageAmount: Number(coverage.coverageAmount),
        additionalCost: Number(coverage.additionalCost),
      }))
    }
    if (insurance.benefits) {
      insurance.benefits = insurance.benefits.map((benefit) => ({
        ...benefit,
        additionalCost: Number(benefit.additionalCost),
      }))
    }
    if (insurance.prices) {
      insurance.prices = insurance.prices.map((price) => ({
        ...price,
        price: Number(price.price),
      }))
    }
    return insurance
  }
}
