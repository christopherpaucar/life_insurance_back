import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { InsuranceBenefit } from '../entities/insurance-benefit.entity'
import { Insurance } from '../entities/insurance.entity'
import { CreateInsuranceBenefitDto } from '../dto/create-insurance-benefit.dto'
import { UpdateInsuranceBenefitDto } from '../dto/update-insurance-benefit.dto'

@Injectable()
export class InsuranceBenefitService {
  constructor(
    @InjectRepository(InsuranceBenefit)
    private benefitRepository: Repository<InsuranceBenefit>,
    @InjectRepository(Insurance)
    private insuranceRepository: Repository<Insurance>,
  ) {}

  async create(insuranceId: string, createBenefitDto: CreateInsuranceBenefitDto): Promise<InsuranceBenefit> {
    const insurance = await this.insuranceRepository.findOne({ where: { id: insuranceId } })
    if (!insurance) {
      throw new NotFoundException(`Insurance with ID ${insuranceId} not found`)
    }

    const benefit = this.benefitRepository.create({
      ...createBenefitDto,
      insurance,
    })

    return await this.benefitRepository.save(benefit)
  }

  async findAll(insuranceId: string): Promise<InsuranceBenefit[]> {
    return await this.benefitRepository.find({
      where: { insurance: { id: insuranceId } },
    })
  }

  async findOne(insuranceId: string, id: string): Promise<InsuranceBenefit> {
    const benefit = await this.benefitRepository.findOne({
      where: { id, insurance: { id: insuranceId } },
    })

    if (!benefit) {
      throw new NotFoundException(`Benefit with ID ${id} not found for insurance ${insuranceId}`)
    }

    return benefit
  }

  async update(
    insuranceId: string,
    id: string,
    updateBenefitDto: UpdateInsuranceBenefitDto,
  ): Promise<InsuranceBenefit> {
    const benefit = await this.findOne(insuranceId, id)
    const updated = Object.assign(benefit, updateBenefitDto)
    return await this.benefitRepository.save(updated)
  }

  async remove(insuranceId: string, id: string): Promise<void> {
    const benefit = await this.findOne(insuranceId, id)
    await this.benefitRepository.remove(benefit)
  }
}
