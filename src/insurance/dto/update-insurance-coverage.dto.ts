import { IsOptional, IsString } from 'class-validator'

export class UpdateInsuranceCoverageDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string
}
