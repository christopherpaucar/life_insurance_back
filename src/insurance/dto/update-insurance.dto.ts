import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'
import { InsuranceType, PaymentFrequency } from '../entities/insurance.entity'

export class UpdateInsuranceDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(InsuranceType)
  @IsOptional()
  type?: InsuranceType

  @IsNumber()
  @IsOptional()
  basePrice?: number

  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @IsArray()
  @IsOptional()
  requirements?: string[]

  @IsArray()
  @IsEnum(PaymentFrequency, { each: true })
  @IsOptional()
  availablePaymentFrequencies?: PaymentFrequency[]
}
