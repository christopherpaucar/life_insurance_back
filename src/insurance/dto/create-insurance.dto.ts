import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { InsuranceType } from '../entities/insurance.entity'
import { Type } from 'class-transformer'
import { PaymentFrequency } from '../entities/insurance-price.entity'

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
  @Min(0)
  basePrice: number

  @IsArray()
  @IsEnum(PaymentFrequency, { each: true })
  availablePaymentFrequencies: PaymentFrequency[]

  @IsArray()
  @IsOptional()
  requirements?: string[]

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number

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
