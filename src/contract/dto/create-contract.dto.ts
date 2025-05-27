import {
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
  IsUUID,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
  IsArray,
} from 'class-validator'
import { Type } from 'class-transformer'
import { PaymentFrequency } from '../../insurance/entities/insurance-price.entity'

class CreateBeneficiaryDto {
  @IsString()
  name: string

  @IsString()
  relationship: string

  @IsNumber()
  percentage: number

  @IsOptional()
  @IsString()
  contactInfo?: string
}

export class CreateContractDto {
  @IsUUID()
  insuranceId: string

  @IsDateString()
  startDate: string

  @IsDateString()
  endDate: string

  @IsEnum(PaymentFrequency)
  paymentFrequency: PaymentFrequency

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => CreateBeneficiaryDto)
  beneficiaries?: CreateBeneficiaryDto[]

  @IsOptional()
  @IsString()
  notes?: string
}
