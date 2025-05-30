import { Controller, Post, Get, Query, UseGuards } from '@nestjs/common'
import { PaymentService } from '../services/payment.service'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { RoleType } from '../../auth/entities/role.entity'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import { User } from '../../auth/entities/user.entity'
import { ApiResponseDto } from '../../common/dto/api-response.dto'

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @Roles(RoleType.ADMIN, RoleType.AGENT, RoleType.CLIENT)
  async getPaymentHistory(@Query() query: any, @CurrentUser() user: User): Promise<ApiResponseDto> {
    const { transactions, total, page, limit } = await this.paymentService.getPaymentHistory(query, user)

    return new ApiResponseDto({
      success: true,
      data: transactions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  }

  @Post('dunning/process')
  async processDunning() {
    await this.paymentService.processDunning()
    return { message: 'Dunning process completed' }
  }
}
