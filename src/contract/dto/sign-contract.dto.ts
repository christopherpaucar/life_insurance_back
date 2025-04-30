import { IsString, IsOptional, IsNotEmpty } from 'class-validator'

export class SignContractDto {
  @IsString()
  @IsNotEmpty()
  signatureData: string

  @IsString()
  @IsOptional()
  documentUrl?: string
}
