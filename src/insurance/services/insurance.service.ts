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
    const insurance = this.insuranceRepository.create(insuranceData)
    const savedInsurance = await this.insuranceRepository.save(insurance)

    const prices = availablePaymentFrequencies.map((frequency) => {
      let price = basePrice
      if (frequency === PaymentFrequency.QUARTERLY) {
        price = basePrice * 3
      } else if (frequency === PaymentFrequency.YEARLY) {
        price = basePrice * 12
      }

      return this.insurancePriceRepository.create({
        insurance: savedInsurance,
        price,
        frequency,
      })
    })

    await this.insurancePriceRepository.save(prices)

    if (coveragesDto?.length) {
      const coverages = await this.coverageRepository.findBy({ id: In(coveragesDto.map((coverage) => coverage.id)) })
      if (coverages.length !== coveragesDto.length) {
        throw new NotFoundException('One or more coverages not found')
      }

      const coverageRelations = coveragesDto.map((coverageDto) => {
        const coverage = coverages.find((c) => c.id === coverageDto.id)
        return this.coverageRelationRepository.create({
          insurance: savedInsurance,
          coverage,
          coverageAmount: coverageDto.coverageAmount ?? 0,
          additionalCost: coverageDto.additionalCost ?? 0,
        })
      })

      await this.coverageRelationRepository.save(coverageRelations)
    }

    if (benefitsDto?.length) {
      const benefits = await this.benefitRepository.findBy({ id: In(benefitsDto.map((benefit) => benefit.id)) })
      if (benefits.length !== benefitsDto.length) {
        throw new NotFoundException('One or more benefits not found')
      }

      const benefitRelations = benefitsDto.map((benefitDto) => {
        const benefit = benefits.find((b) => b.id === benefitDto.id)
        return this.benefitRelationRepository.create({
          insurance: savedInsurance,
          benefit,
          additionalCost: benefitDto.additionalCost ?? 0,
        })
      })

      await this.benefitRelationRepository.save(benefitRelations)
    }

    return this.findOne(savedInsurance.id)
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

  async findOne(id: string): Promise<Insurance> {
    const insurance = await this.insuranceRepository
      .createQueryBuilder('insurance')
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
    const { coverages: coveragesDto, benefits: benefitsDto, ...insuranceData } = updateInsuranceDto
    const insurance = await this.findOne(id)
    const updatedInsurance = Object.assign(insurance, insuranceData)
    await this.insuranceRepository.save(updatedInsurance)

    if (coveragesDto) {
      const coveragesToDelete = coveragesDto.filter((coverage) => coverage.delete)
      const coveragesToUpdate = coveragesDto.filter((coverage) => !coverage.delete)

      console.log('coveragesToDelete', coveragesToDelete)
      console.log('coveragesToUpdate', coveragesToUpdate)

      if (coveragesToDelete.length > 0) {
        await this.coverageRelationRepository.softDelete({
          insurance: { id },
          coverage: { id: In(coveragesToDelete.map((c) => c.id)) },
        })
      }

      if (coveragesToUpdate.length > 0) {
        const coverages = await this.coverageRepository.findBy({
          id: In(coveragesToUpdate.map((coverage) => coverage.id)),
        })
        if (coverages.length !== coveragesToUpdate.length) {
          throw new NotFoundException('One or more coverages not found')
        }

        const coverageRelations = coveragesToUpdate.map((coverageDto) => {
          const coverage = coverages.find((c) => c.id === coverageDto.id)
          return this.coverageRelationRepository.create({
            insurance: updatedInsurance,
            coverage,
            coverageAmount: coverageDto.coverageAmount ?? 0,
            additionalCost: coverageDto.additionalCost ?? 0,
          })
        })

        await this.coverageRelationRepository.save(coverageRelations)
      }
    }

    if (benefitsDto) {
      const benefitsToDelete = benefitsDto.filter((benefit) => benefit.delete)
      const benefitsToUpdate = benefitsDto.filter((benefit) => !benefit.delete)

      if (benefitsToDelete.length > 0) {
        await this.benefitRelationRepository.softDelete({
          insurance: { id },
          benefit: { id: In(benefitsToDelete.map((b) => b.id)) },
        })
      }

      if (benefitsToUpdate.length > 0) {
        const benefits = await this.benefitRepository.findBy({ id: In(benefitsToUpdate.map((benefit) => benefit.id)) })
        if (benefits.length !== benefitsToUpdate.length) {
          throw new NotFoundException('One or more benefits not found')
        }

        const benefitRelations = benefitsToUpdate.map((benefitDto) => {
          const benefit = benefits.find((b) => b.id === benefitDto.id)
          return this.benefitRelationRepository.create({
            insurance: updatedInsurance,
            benefit,
            additionalCost: benefitDto.additionalCost ?? 0,
          })
        })

        await this.benefitRelationRepository.save(benefitRelations)
      }
    }

    return this.findOne(id)
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
