import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { PaymentMethodService } from '../services/payment-method.service'
import { CreatePaymentMethodDto } from '../dto/create-payment-method.dto'
import { UpdatePaymentMethodDto } from '../dto/update-payment-method.dto'
import { ApiResponseDto } from '../../common/dto/api-response.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import { User } from '../../auth/entities/user.entity'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { RoleType } from '../../auth/entities/role.entity'

@Controller('payment-methods')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Post()
  @Roles(RoleType.CLIENT)
  async create(
    @Body() createPaymentMethodDto: CreatePaymentMethodDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponseDto> {
    const paymentMethod = await this.paymentMethodService.create(createPaymentMethodDto, user)
    return new ApiResponseDto({ success: true, data: paymentMethod })
  }

  @Get()
  @Roles(RoleType.CLIENT)
  async findAll(@CurrentUser() user: User): Promise<ApiResponseDto> {
    const paymentMethods = await this.paymentMethodService.findAll(user)
    return new ApiResponseDto({ success: true, data: paymentMethods })
  }

  @Get(':id')
  @Roles(RoleType.CLIENT)
  async findOne(@Param('id') id: string, @CurrentUser() user: User): Promise<ApiResponseDto> {
    const paymentMethod = await this.paymentMethodService.findOne(id, user)
    return new ApiResponseDto({ success: true, data: paymentMethod })
  }

  @Put(':id')
  @Roles(RoleType.CLIENT)
  async update(
    @Param('id') id: string,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponseDto> {
    const paymentMethod = await this.paymentMethodService.update(id, updatePaymentMethodDto, user)
    return new ApiResponseDto({ success: true, data: paymentMethod })
  }

  @Delete(':id')
  @Roles(RoleType.CLIENT)
  async remove(@Param('id') id: string, @CurrentUser() user: User): Promise<ApiResponseDto> {
    await this.paymentMethodService.remove(id, user)
    return new ApiResponseDto({ success: true, data: 'Payment method deleted successfully' })
  }
}
