import { IsOptional, IsString } from 'class-validator'

export class UpdateInsuranceBenefitDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string
}
