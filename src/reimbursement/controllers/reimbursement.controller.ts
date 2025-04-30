import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { ReimbursementService } from '../services/reimbursement.service'
import { CreateReimbursementDto } from '../dto/create-reimbursement.dto'
import { UpdateReimbursementDto } from '../dto/update-reimbursement.dto'
import { ReviewReimbursementDto } from '../dto/review-reimbursement.dto'
import { ApiResponseDto } from '../../common/dto/api-response.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../../auth/guards/permission.guard'
import { RequirePermission } from '../../auth/decorators/require-permission.decorator'

@Controller('reimbursements')
export class ReimbursementController {
  constructor(private readonly reimbursementService: ReimbursementService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('reimbursement:create')
  async create(@Body() createReimbursementDto: CreateReimbursementDto): Promise<ApiResponseDto> {
    const reimbursement = await this.reimbursementService.create(createReimbursementDto)
    return new ApiResponseDto({ success: true, data: reimbursement })
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('reimbursement:read')
  async findAll(@Query() query): Promise<ApiResponseDto> {
    const { reimbursements, total, page, limit } = await this.reimbursementService.findAll(query)
    return new ApiResponseDto({
      success: true,
      data: reimbursements,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  }

  @Get('client/:clientId')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('reimbursement:read')
  async findAllByClient(@Param('clientId') clientId: string, @Query() query): Promise<ApiResponseDto> {
    const { reimbursements, total, page, limit } = await this.reimbursementService.findAllByClient(clientId, query)
    return new ApiResponseDto({
      success: true,
      data: reimbursements,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('reimbursement:read')
  async findOne(@Param('id') id: string): Promise<ApiResponseDto> {
    const reimbursement = await this.reimbursementService.findOne(id)
    return new ApiResponseDto({ success: true, data: reimbursement })
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('reimbursement:update')
  async update(
    @Param('id') id: string,
    @Body() updateReimbursementDto: UpdateReimbursementDto,
  ): Promise<ApiResponseDto> {
    const reimbursement = await this.reimbursementService.update(id, updateReimbursementDto)
    return new ApiResponseDto({ success: true, data: reimbursement })
  }

  @Put(':id/review')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('reimbursement:approve')
  async reviewReimbursement(
    @Param('id') id: string,
    @Body() reviewReimbursementDto: ReviewReimbursementDto,
  ): Promise<ApiResponseDto> {
    const reimbursement = await this.reimbursementService.reviewReimbursement(id, reviewReimbursementDto)
    return new ApiResponseDto({ success: true, data: reimbursement })
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('reimbursement:delete')
  async remove(@Param('id') id: string): Promise<ApiResponseDto> {
    await this.reimbursementService.remove(id)
    return new ApiResponseDto({ success: true })
  }
}
