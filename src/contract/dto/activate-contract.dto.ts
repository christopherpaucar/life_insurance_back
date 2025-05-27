import { IsNotEmpty, IsString } from 'class-validator'

export class ActivateContractDto {
  @IsString()
  @IsNotEmpty()
  signatureData: string

  @IsString()
  @IsNotEmpty()
  documentUrl: string
}
