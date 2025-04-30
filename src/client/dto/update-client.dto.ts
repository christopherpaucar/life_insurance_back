import { IsDateString, IsEmail, IsOptional, IsString, IsUUID } from 'class-validator'

export class UpdateClientDto {
  @IsString()
  @IsOptional()
  firstName?: string

  @IsString()
  @IsOptional()
  lastName?: string

  @IsEmail()
  @IsOptional()
  email?: string

  @IsString()
  @IsOptional()
  phone?: string

  @IsString()
  @IsOptional()
  address?: string

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string

  @IsString()
  @IsOptional()
  identificationNumber?: string

  @IsString()
  @IsOptional()
  identificationDocumentUrl?: string

  @IsUUID()
  @IsOptional()
  userId?: string
}
