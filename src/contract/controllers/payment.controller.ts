import { Controller, Post } from '@nestjs/common'
import { PaymentService } from '../services/payment.service'

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('dunning/process')
  async processDunning() {
    await this.paymentService.processDunning()
    return { message: 'Dunning process completed' }
  }
}
