import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { InsuranceCoverage } from '../entities/insurance-coverage.entity'
import { Insurance } from '../entities/insurance.entity'
import { CreateInsuranceCoverageDto } from '../dto/create-insurance-coverage.dto'
import { UpdateInsuranceCoverageDto } from '../dto/update-insurance-coverage.dto'

@Injectable()
export class InsuranceCoverageService {
  constructor(
    @InjectRepository(InsuranceCoverage)
    private coverageRepository: Repository<InsuranceCoverage>,
    @InjectRepository(Insurance)
    private insuranceRepository: Repository<Insurance>,
  ) {}

  async create(insuranceId: string, createCoverageDto: CreateInsuranceCoverageDto): Promise<InsuranceCoverage> {
    const insurance = await this.insuranceRepository.findOne({ where: { id: insuranceId } })
    if (!insurance) {
      throw new NotFoundException(`Insurance with ID ${insuranceId} not found`)
    }

    const coverage = this.coverageRepository.create({
      ...createCoverageDto,
      insurance,
    })

    return await this.coverageRepository.save(coverage)
  }

  async findAll(insuranceId: string): Promise<InsuranceCoverage[]> {
    return await this.coverageRepository.find({
      where: { insurance: { id: insuranceId } },
    })
  }

  async findOne(insuranceId: string, id: string): Promise<InsuranceCoverage> {
    const coverage = await this.coverageRepository.findOne({
      where: { id, insurance: { id: insuranceId } },
    })

    if (!coverage) {
      throw new NotFoundException(`Coverage with ID ${id} not found for insurance ${insuranceId}`)
    }

    return coverage
  }

  async update(
    insuranceId: string,
    id: string,
    updateCoverageDto: UpdateInsuranceCoverageDto,
  ): Promise<InsuranceCoverage> {
    const coverage = await this.findOne(insuranceId, id)
    const updated = Object.assign(coverage, updateCoverageDto)
    return await this.coverageRepository.save(updated)
  }

  async remove(insuranceId: string, id: string): Promise<void> {
    const coverage = await this.findOne(insuranceId, id)
    await this.coverageRepository.remove(coverage)
  }
}
