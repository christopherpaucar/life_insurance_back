import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator'
import { InsuranceType, PaymentFrequency } from '../entities/insurance.entity'
import { Type } from 'class-transformer'

export class CreateInsuranceCoverageRelationDto {
  @IsString()
  @IsNotEmpty()
  id: string

  @IsNumber()
  @IsNotEmpty()
  coverageAmount: number

  @IsNumber()
  @IsNotEmpty()
  additionalCost: number
}

export class CreateInsuranceBenefitRelationDto {
  @IsString()
  @IsNotEmpty()
  id: string

  @IsNumber()
  @IsNotEmpty()
  additionalCost: number
}

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
  @ValidateNested({ each: true })
  @Type(() => CreateInsuranceCoverageRelationDto)
  @IsOptional()
  coverages?: CreateInsuranceCoverageRelationDto[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInsuranceBenefitRelationDto)
  @IsOptional()
  benefits?: CreateInsuranceBenefitRelationDto[]
}
