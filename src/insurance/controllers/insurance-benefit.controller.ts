import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { InsuranceBenefitService } from '../services/insurance-benefit.service'
import { CreateInsuranceBenefitDto } from '../dto/create-insurance-benefit.dto'
import { UpdateInsuranceBenefitDto } from '../dto/update-insurance-benefit.dto'
import { ApiResponseDto } from '../../common/dto/api-response.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../../auth/guards/permission.guard'
import { RequirePermission } from '../../auth/decorators/require-permission.decorator'

@Controller('benefits')
export class InsuranceBenefitController {
  constructor(private readonly benefitService: InsuranceBenefitService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('insurance:create')
  async create(@Body() createBenefitDto: CreateInsuranceBenefitDto): Promise<ApiResponseDto> {
    const benefit = await this.benefitService.create(createBenefitDto)
    return new ApiResponseDto({ success: true, data: benefit })
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('insurance:read')
  async findAll(): Promise<ApiResponseDto> {
    const benefits = await this.benefitService.findAll()

    return new ApiResponseDto({ success: true, data: benefits })
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('insurance:read')
  async findOne(@Param('id') id: string): Promise<ApiResponseDto> {
    const benefit = await this.benefitService.findOne(id)
    return new ApiResponseDto({ success: true, data: benefit })
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('insurance:update')
  async update(@Param('id') id: string, @Body() updateBenefitDto: UpdateInsuranceBenefitDto): Promise<ApiResponseDto> {
    const benefit = await this.benefitService.update(id, updateBenefitDto)
    return new ApiResponseDto({ success: true, data: benefit })
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  async remove(@Param('id') id: string): Promise<ApiResponseDto> {
    await this.benefitService.remove(id)
    return new ApiResponseDto({ success: true })
  }
}
