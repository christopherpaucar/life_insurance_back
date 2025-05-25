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
