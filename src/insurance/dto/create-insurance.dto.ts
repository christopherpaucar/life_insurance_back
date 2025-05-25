import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requirements?: string[]

  @IsNumber()
  @IsOptional()
  order?: number

  @IsEnum(PaymentFrequency, { each: true })
  @IsOptional()
  availablePaymentFrequencies?: PaymentFrequency[]

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  coverageIds?: string[]

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  benefitIds?: string[]
}
