import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ContractService } from '../services/contract.service'
import { CreateContractDto } from '../dto/create-contract.dto'
import { UpdateContractDto } from '../dto/update-contract.dto'
import { SignContractDto } from '../dto/sign-contract.dto'
import { ApiResponseDto } from '../../common/dto/api-response.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../../auth/guards/permission.guard'
import { RequirePermission } from '../../auth/decorators/require-permission.decorator'
import { ContractStatus } from '../entities/contract.entity'
import { AttachmentType } from '../entities/attachment.entity'
import { FileStorageService } from '../../common/services/file-storage.service'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import { User } from '../../auth/entities/user.entity'

@Controller('contracts')
export class ContractController {
  constructor(
    private readonly contractService: ContractService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('contract:create')
  async create(@Body() createContractDto: CreateContractDto, @CurrentUser() user: User): Promise<ApiResponseDto> {
    const contract = await this.contractService.create(createContractDto, user)
    return new ApiResponseDto({ success: true, data: contract })
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('contract:read')
  async findAll(@Query() query, @CurrentUser() user: User): Promise<ApiResponseDto> {
    const { contracts, total, page, limit } = await this.contractService.findAll(query, user)

    return new ApiResponseDto({
      success: true,
      data: contracts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('contract:read')
  async findOne(@Param('id') id: string): Promise<ApiResponseDto> {
    const contract = await this.contractService.findOne(id)
    return new ApiResponseDto({ success: true, data: contract })
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('contract:update')
  async update(@Param('id') id: string, @Body() updateContractDto: UpdateContractDto): Promise<ApiResponseDto> {
    const contract = await this.contractService.update(id, updateContractDto)
    return new ApiResponseDto({ success: true, data: contract })
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('contract:update')
  async changeStatus(@Param('id') id: string, @Body('status') status: ContractStatus): Promise<ApiResponseDto> {
    const contract = await this.contractService.changeStatus(id, status)
    return new ApiResponseDto({ success: true, data: contract })
  }

  @Put(':id/sign')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('contract:sign')
  async signContract(@Param('id') id: string, @Body() signContractDto: SignContractDto): Promise<ApiResponseDto> {
    const contract = await this.contractService.signContract(id, signContractDto)
    return new ApiResponseDto({ success: true, data: contract })
  }

  @Post(':id/attachments')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('contract:upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: AttachmentType,
    @Body('description') description?: string,
  ): Promise<ApiResponseDto> {
    const contract = await this.contractService.findOne(id)

    const uploadResult = await this.fileStorageService.uploadEntityFile(
      file.buffer ?? Buffer.from(''),
      'contract',
      id,
      type,
      {
        originalName: file.originalname,
        contentType: file.mimetype,
        size: file.size,
        entityId: id,
        entityType: 'contract',
        documentType: type,
        ownerId: contract.user.id,
        ownerType: 'user',
      },
    )

    const updatedContract = await this.contractService.addAttachment(id, {
      fileName: file.originalname,
      fileUrl: uploadResult.url,
      type,
      description,
    })

    return new ApiResponseDto({ success: true, data: updatedContract })
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('contract:delete')
  async remove(@Param('id') id: string): Promise<ApiResponseDto> {
    await this.contractService.remove(id)
    return new ApiResponseDto({ success: true })
  }
}
