import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  firstName: string

  @IsString()
  @IsNotEmpty()
  lastName: string

  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @IsNotEmpty()
  phone: string

  @IsString()
  @IsOptional()
  address?: string

  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string

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
