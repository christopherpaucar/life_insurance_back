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
  clientId: string

  @IsUUID()
  insuranceId: string

  @IsDateString()
  startDate: string

  @IsDateString()
  endDate: string

  @IsNumber()
  @IsOptional()
  totalAmount?: number

  @IsEnum(PaymentFrequency)
  paymentFrequency: PaymentFrequency

  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus

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
