import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class CreateInsuranceCoverageDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  description: string

  @IsNumber()
  coverageAmount: number

  @IsNumber()
  additionalCost: number
}
