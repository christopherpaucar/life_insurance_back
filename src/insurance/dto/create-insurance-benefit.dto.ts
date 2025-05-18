import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class CreateInsuranceBenefitDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  description: string

  @IsNumber()
  additionalCost: number
}
