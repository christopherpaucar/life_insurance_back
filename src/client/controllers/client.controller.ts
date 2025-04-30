import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { ClientService } from '../services/client.service'
import { CreateClientDto } from '../dto/create-client.dto'
import { UpdateClientDto } from '../dto/update-client.dto'
import { ApiResponseDto } from '../../common/dto/api-response.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../../auth/guards/permission.guard'
import { RequirePermission } from '../../auth/decorators/require-permission.decorator'

@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('client:create')
  async create(@Body() createClientDto: CreateClientDto): Promise<ApiResponseDto> {
    const client = await this.clientService.create(createClientDto)
    return new ApiResponseDto({ success: true, data: client })
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('client:read')
  async findAll(@Query() query): Promise<ApiResponseDto> {
    const { clients, total, page, limit } = await this.clientService.findAll(query)
    return new ApiResponseDto({
      success: true,
      data: clients,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('client:read')
  async findOne(@Param('id') id: string): Promise<ApiResponseDto> {
    const client = await this.clientService.findOne(id)
    return new ApiResponseDto({ success: true, data: client })
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('client:update')
  async update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto): Promise<ApiResponseDto> {
    const client = await this.clientService.update(id, updateClientDto)
    return new ApiResponseDto({ success: true, data: client })
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('client:delete')
  async remove(@Param('id') id: string): Promise<ApiResponseDto> {
    await this.clientService.remove(id)
    return new ApiResponseDto({ success: true })
  }
}
