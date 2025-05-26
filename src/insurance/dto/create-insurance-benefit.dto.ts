import { IsNotEmpty, IsString } from 'class-validator'

export class CreateInsuranceBenefitDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  description: string
}
