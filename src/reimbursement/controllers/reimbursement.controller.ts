import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common'
import { ReimbursementService } from '../services/reimbursement.service'
import { CreateReimbursementDto } from '../dto/create-reimbursement.dto'
import { UpdateReimbursementDto } from '../dto/update-reimbursement.dto'
import { ReviewReimbursementDto } from '../dto/review-reimbursement.dto'
import { ApiResponseDto } from '../../common/dto/api-response.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import { User } from '../../auth/entities/user.entity'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { RoleType } from '../../auth/entities/role.entity'
import { FilesInterceptor } from '@nestjs/platform-express'
import { FileStorageService } from '../../common/services/file-storage.service'

@Controller('reimbursements')
export class ReimbursementController {
  constructor(
    private readonly reimbursementService: ReimbursementService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.CLIENT)
  @UseInterceptors(FilesInterceptor('invoices'))
  async create(
    @Body() formData: any,
    @UploadedFiles() invoices: Express.Multer.File[],
    @CurrentUser() user: User,
  ): Promise<ApiResponseDto> {
    const data: CreateReimbursementDto = {
      contractId: formData.contractId,
      items: JSON.parse(formData.items as string),
    }

    const reimbursement = await this.reimbursementService.create(data, user)

    if (invoices && invoices.length > 0) {
      for (let i = 0; i < invoices.length; i++) {
        const invoice = invoices[i]
        const item = reimbursement.items[i]

        if (item && invoice.buffer) {
          const uploadResult = await this.fileStorageService.uploadEntityFile(
            invoice.buffer,
            'reimbursement',
            reimbursement.id,
            'invoice',
            {
              originalName: invoice.originalname,
              contentType: invoice.mimetype,
              ownerId: user.id,
              ownerType: 'user',
              customMetadata: {
                itemId: item.id,
                itemType: item.type,
              },
            },
          )

          await this.reimbursementService.updateItemDocument(item.id, uploadResult.url)
        }
      }
    }

    return new ApiResponseDto({ success: true, data: reimbursement })
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.REVIEWER, RoleType.CLIENT)
  async findAll(@Query() query, @CurrentUser() user: User): Promise<ApiResponseDto> {
    const { reimbursements, total, page, limit } = await this.reimbursementService.findAll(query, user)
    return new ApiResponseDto({
      success: true,
      data: reimbursements,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.REVIEWER, RoleType.CLIENT)
  async findOne(@Param('id') id: string): Promise<ApiResponseDto> {
    const reimbursement = await this.reimbursementService.findOne(id)
    return new ApiResponseDto({ success: true, data: reimbursement })
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.CLIENT, RoleType.REVIEWER, RoleType.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateReimbursementDto: UpdateReimbursementDto,
  ): Promise<ApiResponseDto> {
    const reimbursement = await this.reimbursementService.update(id, updateReimbursementDto)
    return new ApiResponseDto({ success: true, data: reimbursement })
  }

  @Put(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.REVIEWER)
  async reviewReimbursement(
    @Param('id') id: string,
    @Body() reviewReimbursementDto: ReviewReimbursementDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponseDto> {
    const reimbursement = await this.reimbursementService.reviewReimbursement(id, reviewReimbursementDto, user)
    return new ApiResponseDto({ success: true, data: reimbursement })
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.REVIEWER)
  async remove(@Param('id') id: string): Promise<ApiResponseDto> {
    await this.reimbursementService.remove(id)
    return new ApiResponseDto({ success: true })
  }
}
