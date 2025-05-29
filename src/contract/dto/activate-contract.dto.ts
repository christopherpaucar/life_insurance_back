import { IsNotEmpty, IsEnum, IsObject } from 'class-validator'
import { PaymentMethodType } from '../entities/payment-method.entity'

export class ActivateContractDto {
  @IsEnum(PaymentMethodType)
  @IsNotEmpty()
  paymentMethodType: PaymentMethodType

  @IsObject()
  @IsNotEmpty()
  paymentDetails: Record<string, any>
}
