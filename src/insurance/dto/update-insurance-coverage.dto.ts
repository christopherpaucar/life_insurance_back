import { IsNumber, IsOptional, IsString } from 'class-validator'

export class UpdateInsuranceCoverageDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsNumber()
  @IsOptional()
  coverageAmount?: number

  @IsNumber()
  @IsOptional()
  additionalCost?: number
}
