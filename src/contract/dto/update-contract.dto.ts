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
import { ContractStatus } from '../entities/contract.entity'
import { PaymentFrequency } from '../../insurance/entities/insurance.entity'

class UpdateBeneficiaryDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  relationship?: string

  @IsNumber()
  @IsOptional()
  percentage?: number

  @IsOptional()
  @IsString()
  contactInfo?: string
}

export class UpdateContractDto {
  @IsUUID()
  @IsOptional()
  clientId?: string

  @IsUUID()
  @IsOptional()
  insuranceId?: string

  @IsDateString()
  @IsOptional()
  startDate?: string

  @IsDateString()
  @IsOptional()
  endDate?: string

  @IsNumber()
  @IsOptional()
  totalAmount?: number

  @IsString()
  @IsOptional()
  @IsEnum(PaymentFrequency)
  paymentFrequency?: PaymentFrequency

  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => UpdateBeneficiaryDto)
  beneficiaries?: UpdateBeneficiaryDto[]

  @IsOptional()
  @IsString()
  notes?: string
}
