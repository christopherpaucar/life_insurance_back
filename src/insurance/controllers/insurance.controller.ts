import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { InsuranceService } from '../services/insurance.service'
import { CreateInsuranceDto } from '../dto/create-insurance.dto'
import { UpdateInsuranceDto } from '../dto/update-insurance.dto'
import { ApiResponseDto } from '../../common/dto/api-response.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../../auth/guards/permission.guard'
import { RequirePermission } from '../../auth/decorators/require-permission.decorator'

@Controller('insurances')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('insurance:create')
  async create(@Body() createInsuranceDto: CreateInsuranceDto): Promise<ApiResponseDto> {
    const insurance = await this.insuranceService.create(createInsuranceDto)
    return new ApiResponseDto({ success: true, data: insurance })
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('insurance:read')
  async findAll(@Query() query): Promise<ApiResponseDto> {
    const { data, meta } = await this.insuranceService.findAll(query)

    return new ApiResponseDto({
      success: true,
      data,
      meta,
    })
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('insurance:read')
  async findOne(@Param('id') id: string): Promise<ApiResponseDto> {
    const insurance = await this.insuranceService.findOne(id)
    return new ApiResponseDto({ success: true, data: insurance })
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('insurance:update')
  async update(@Param('id') id: string, @Body() updateInsuranceDto: UpdateInsuranceDto): Promise<ApiResponseDto> {
    const insurance = await this.insuranceService.update(id, updateInsuranceDto)
    return new ApiResponseDto({ success: true, data: insurance })
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('insurance:delete')
  async remove(@Param('id') id: string): Promise<ApiResponseDto> {
    await this.insuranceService.remove(id)
    return new ApiResponseDto({ success: true })
  }
}
