import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { InsuranceCoverage } from '../entities/insurance-coverage.entity'
import { CreateInsuranceCoverageDto } from '../dto/create-insurance-coverage.dto'
import { UpdateInsuranceCoverageDto } from '../dto/update-insurance-coverage.dto'

@Injectable()
export class InsuranceCoverageService {
  constructor(
    @InjectRepository(InsuranceCoverage)
    private coverageRepository: Repository<InsuranceCoverage>,
  ) {}

  async create(createCoverageDto: CreateInsuranceCoverageDto): Promise<InsuranceCoverage> {
    const coverage = this.coverageRepository.create(createCoverageDto)
    return await this.coverageRepository.save(coverage)
  }

  async findAll(): Promise<InsuranceCoverage[]> {
    return await this.coverageRepository.find()
  }

  async findOne(id: string): Promise<InsuranceCoverage> {
    const coverage = await this.coverageRepository.findOne({
      where: { id },
    })

    if (!coverage) {
      throw new NotFoundException(`Coverage with ID ${id} not found`)
    }

    return coverage
  }

  async update(id: string, updateCoverageDto: UpdateInsuranceCoverageDto): Promise<InsuranceCoverage> {
    const coverage = await this.findOne(id)
    const updated = Object.assign(coverage, updateCoverageDto)
    return await this.coverageRepository.save(updated)
  }

  async remove(id: string): Promise<void> {
    const coverage = await this.findOne(id)
    await this.coverageRepository.remove(coverage)
  }
}
