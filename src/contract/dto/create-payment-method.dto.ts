import { IsBoolean, IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { PaymentMethodType } from '../entities/payment-method.entity'

export class CreatePaymentMethodDto {
  @IsEnum(PaymentMethodType)
  @IsNotEmpty()
  type: PaymentMethodType

  @IsString()
  @IsNotEmpty()
  details: string

  @IsBoolean()
  @IsNotEmpty()
  isDefault: boolean
}
