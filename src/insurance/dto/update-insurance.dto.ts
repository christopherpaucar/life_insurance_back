import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator'
import { InsuranceType, PaymentFrequency } from '../entities/insurance.entity'
import { Type } from 'class-transformer'

export class UpdateInsuranceCoverageRelationDto {
  @IsString()
  @IsNotEmpty()
  id: string

  @IsNumber()
  @IsOptional()
  coverageAmount?: number

  @IsNumber()
  @IsOptional()
  additionalCost?: number

  @IsBoolean()
  @IsOptional()
  delete?: boolean
}

export class UpdateInsuranceBenefitRelationDto {
  @IsString()
  @IsNotEmpty()
  id: string

  @IsNumber()
  @IsOptional()
  additionalCost?: number

  @IsBoolean()
  @IsOptional()
  delete?: boolean
}

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
  @ValidateNested({ each: true })
  @Type(() => UpdateInsuranceCoverageRelationDto)
  @IsOptional()
  coverages?: UpdateInsuranceCoverageRelationDto[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateInsuranceBenefitRelationDto)
  @IsOptional()
  benefits?: UpdateInsuranceBenefitRelationDto[]
}
