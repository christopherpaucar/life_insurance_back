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
import { ActivateContractDto } from '../dto/activate-contract.dto'
import { ApiResponseDto } from '../../common/dto/api-response.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../../auth/guards/permission.guard'
import { RequirePermission } from '../../auth/decorators/require-permission.decorator'
import { ContractStatus } from '../entities/contract.entity'
import { AttachmentType } from '../entities/attachment.entity'
import { FileStorageService } from '../../common/services/file-storage.service'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import { User } from '../../auth/entities/user.entity'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { RoleType } from '../../auth/entities/role.entity'

@Controller('contracts')
@UseGuards(JwtAuthGuard, PermissionGuard, RolesGuard)
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

  @Post(':id/activate')
  @Roles(RoleType.ADMIN, RoleType.AGENT)
  async activate(@Param('id') id: string) {
    await this.contractService.activate(id)

    return new ApiResponseDto({ success: true })
  }

  @Post(':id/confirm-activation')
  @Roles(RoleType.CLIENT)
  @UseInterceptors(FileInterceptor('p12File'))
  async confirmActivation(
    @Param('id') id: string,
    @Body() formData: Partial<ActivateContractDto>,
    @UploadedFile() p12File: Express.Multer.File,
  ) {
    const activateContractDto = {
      ...formData,
      paymentDetails:
        typeof formData.paymentDetails === 'string' ? JSON.parse(formData.paymentDetails) : formData.paymentDetails,
    } as ActivateContractDto
    const contract = await this.contractService.confirmActivation(id, activateContractDto, p12File)
    return new ApiResponseDto({ success: true, data: contract })
  }

  @Get()
  @Roles(RoleType.ADMIN, RoleType.AGENT, RoleType.CLIENT)
  async findAll(@Query() query: any, @CurrentUser() user: User): Promise<ApiResponseDto> {
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
  @Roles(RoleType.ADMIN, RoleType.AGENT)
  @RequirePermission('contract:update')
  async changeStatus(@Param('id') id: string, @Body('status') status: ContractStatus): Promise<ApiResponseDto> {
    const contract = await this.contractService.changeStatus(id, status)
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
    console.log('UPLOAD ATTACHMENT ENDPOINT CALLED')

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
  @Roles(RoleType.ADMIN)
  @RequirePermission('contract:delete')
  async remove(@Param('id') id: string): Promise<ApiResponseDto> {
    await this.contractService.remove(id)
    return new ApiResponseDto({ success: true })
  }
}
