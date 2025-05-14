import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In, Not, IsNull } from 'typeorm'
import { Insurance } from '../entities/insurance.entity'
import { CreateInsuranceDto } from '../dto/create-insurance.dto'
import { UpdateInsuranceDto } from '../dto/update-insurance.dto'
import { PaginationService } from '../../common/services/pagination.service'
import { PaginationDto } from '../../common/dto/pagination.dto'
import { PaginatedResponse } from '../../common/interfaces/pagination.interface'

@Injectable()
export class InsuranceService {
  constructor(
    @InjectRepository(Insurance)
    private insuranceRepository: Repository<Insurance>,
  ) {}

  async create(createInsuranceDto: CreateInsuranceDto): Promise<Insurance> {
    const insurance = this.insuranceRepository.create(createInsuranceDto)
    return await this.insuranceRepository.save(insurance)
  }

  async findAll(query): Promise<PaginatedResponse<Insurance>> {
    const paginationDto: PaginationDto = {
      page: query.page ? parseInt(query.page as string, 10) : 1,
      limit: query.limit ? parseInt(query.limit as string, 10) : 10,
    }

    const where = {
      deletedAt: query.includeInactive ? Not(IsNull()) : IsNull(),
    }

    const order = { createdAt: 'DESC' as const }

    const result = await PaginationService.paginate(this.insuranceRepository, where, paginationDto, order)

    if (result.data.length > 0) {
      result.data = await this.insuranceRepository.find({
        where: { id: In(result.data.map((insurance) => insurance.id)) },
        relations: ['coverages', 'benefits'],
      })
    }

    return result
  }

  async findOne(id: string): Promise<Insurance> {
    const insurance = await this.insuranceRepository.findOne({
      where: { id },
      relations: ['coverages', 'benefits'],
    })

    if (!insurance) {
      throw new NotFoundException(`Insurance with ID ${id} not found`)
    }

    return insurance
  }

  async update(id: string, updateInsuranceDto: UpdateInsuranceDto): Promise<Insurance> {
    const insurance = await this.findOne(id)
    const updated = Object.assign(insurance, updateInsuranceDto)
    return await this.insuranceRepository.save(updated)
  }

  async remove(id: string): Promise<void> {
    await this.insuranceRepository.softDelete(id)
  }
}
