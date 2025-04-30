import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { InsuranceType, PaymentFrequency } from '../entities/insurance.entity'

export class CreateInsuranceDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  description: string

  @IsEnum(InsuranceType)
  type: InsuranceType

  @IsNumber()
  basePrice: number

  @IsBoolean()
  @IsOptional()
  isActive: boolean

  @IsArray()
  @IsOptional()
  requirements: string[]

  @IsArray()
  @IsEnum(PaymentFrequency, { each: true })
  @IsOptional()
  availablePaymentFrequencies: PaymentFrequency[]
}
