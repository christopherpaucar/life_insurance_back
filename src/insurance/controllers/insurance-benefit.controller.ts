import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { InsuranceBenefitService } from '../services/insurance-benefit.service'
import { CreateInsuranceBenefitDto } from '../dto/create-insurance-benefit.dto'
import { UpdateInsuranceBenefitDto } from '../dto/update-insurance-benefit.dto'
import { ApiResponseDto } from '../../common/dto/api-response.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../../auth/guards/permission.guard'
import { RequirePermission } from '../../auth/decorators/require-permission.decorator'

@Controller('insurances/:insuranceId/benefits')
export class InsuranceBenefitController {
  constructor(private readonly benefitService: InsuranceBenefitService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('insurance:create')
  async create(
    @Param('insuranceId') insuranceId: string,
    @Body() createBenefitDto: CreateInsuranceBenefitDto,
  ): Promise<ApiResponseDto> {
    const benefit = await this.benefitService.create(insuranceId, createBenefitDto)
    return new ApiResponseDto({ success: true, data: benefit })
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('insurance:read')
  async findAll(@Param('insuranceId') insuranceId: string): Promise<ApiResponseDto> {
    const benefits = await this.benefitService.findAll(insuranceId)
    return new ApiResponseDto({ success: true, data: benefits })
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('insurance:read')
  async findOne(@Param('insuranceId') insuranceId: string, @Param('id') id: string): Promise<ApiResponseDto> {
    const benefit = await this.benefitService.findOne(insuranceId, id)
    return new ApiResponseDto({ success: true, data: benefit })
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('insurance:update')
  async update(
    @Param('insuranceId') insuranceId: string,
    @Param('id') id: string,
    @Body() updateBenefitDto: UpdateInsuranceBenefitDto,
  ): Promise<ApiResponseDto> {
    const benefit = await this.benefitService.update(insuranceId, id, updateBenefitDto)
    return new ApiResponseDto({ success: true, data: benefit })
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('insurance:delete')
  async remove(@Param('insuranceId') insuranceId: string, @Param('id') id: string): Promise<ApiResponseDto> {
    await this.benefitService.remove(insuranceId, id)
    return new ApiResponseDto({ success: true })
  }
}
