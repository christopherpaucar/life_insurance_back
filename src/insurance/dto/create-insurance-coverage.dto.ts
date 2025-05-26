import { IsNotEmpty, IsString } from 'class-validator'

export class CreateInsuranceCoverageDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  description: string
}
