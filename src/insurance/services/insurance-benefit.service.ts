import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { InsuranceBenefit } from '../entities/insurance-benefit.entity'
import { CreateInsuranceBenefitDto } from '../dto/create-insurance-benefit.dto'
import { UpdateInsuranceBenefitDto } from '../dto/update-insurance-benefit.dto'

@Injectable()
export class InsuranceBenefitService {
  constructor(
    @InjectRepository(InsuranceBenefit)
    private benefitRepository: Repository<InsuranceBenefit>,
  ) {}

  async create(createBenefitDto: CreateInsuranceBenefitDto): Promise<InsuranceBenefit> {
    const benefit = this.benefitRepository.create(createBenefitDto)
    return await this.benefitRepository.save(benefit)
  }

  async findAll(): Promise<InsuranceBenefit[]> {
    return await this.benefitRepository.find()
  }

  async findOne(id: string): Promise<InsuranceBenefit> {
    const benefit = await this.benefitRepository.findOne({
      where: { id },
    })

    if (!benefit) {
      throw new NotFoundException(`Benefit with ID ${id} not found`)
    }

    return benefit
  }

  async update(id: string, updateBenefitDto: UpdateInsuranceBenefitDto): Promise<InsuranceBenefit> {
    const benefit = await this.findOne(id)
    const updated = Object.assign(benefit, updateBenefitDto)
    return await this.benefitRepository.save(updated)
  }

  async remove(id: string): Promise<void> {
    const benefit = await this.findOne(id)
    await this.benefitRepository.remove(benefit)
  }
}
