import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { InsuranceCoverageService } from '../services/insurance-coverage.service'
import { CreateInsuranceCoverageDto } from '../dto/create-insurance-coverage.dto'
import { UpdateInsuranceCoverageDto } from '../dto/update-insurance-coverage.dto'
import { ApiResponseDto } from '../../common/dto/api-response.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../../auth/guards/permission.guard'
import { RequirePermission } from '../../auth/decorators/require-permission.decorator'

@Controller('coverages')
export class InsuranceCoverageController {
  constructor(private readonly coverageService: InsuranceCoverageService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('insurance:create')
  async create(@Body() createCoverageDto: CreateInsuranceCoverageDto): Promise<ApiResponseDto> {
    const coverage = await this.coverageService.create(createCoverageDto)
    return new ApiResponseDto({ success: true, data: coverage })
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('insurance:read')
  async findAll(): Promise<ApiResponseDto> {
    const coverages = await this.coverageService.findAll()
    return new ApiResponseDto({ success: true, data: coverages })
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('insurance:read')
  async findOne(@Param('id') id: string): Promise<ApiResponseDto> {
    const coverage = await this.coverageService.findOne(id)
    return new ApiResponseDto({ success: true, data: coverage })
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('insurance:update')
  async update(
    @Param('id') id: string,
    @Body() updateCoverageDto: UpdateInsuranceCoverageDto,
  ): Promise<ApiResponseDto> {
    const coverage = await this.coverageService.update(id, updateCoverageDto)
    return new ApiResponseDto({ success: true, data: coverage })
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  async remove(@Param('id') id: string): Promise<ApiResponseDto> {
    await this.coverageService.remove(id)
    return new ApiResponseDto({ success: true })
  }
}
