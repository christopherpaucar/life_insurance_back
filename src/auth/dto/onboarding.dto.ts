import { IsDate, IsString, IsNumber, IsOptional, IsObject, Min, Max, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'

export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

export class OnboardingDto {
  @IsDate()
  @Type(() => Date)
  birthDate: Date

  @IsEnum(BloodType)
  bloodType: BloodType

  @IsString()
  gender: string

  @IsNumber()
  @Min(0)
  @Max(300)
  height: number

  @IsNumber()
  @Min(0)
  @Max(500)
  weight: number

  @IsString()
  address: string

  @IsString()
  phoneNumber: string

  @IsString()
  emergencyContact: string

  @IsString()
  emergencyPhone: string

  @IsObject()
  @IsOptional()
  medicalHistory?: Record<string, any>

  @IsObject()
  @IsOptional()
  lifestyle?: Record<string, any>
}

export class UpdateOnboardingDto {
  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsString()
  phoneNumber?: string

  @IsOptional()
  @IsString()
  emergencyContact?: string

  @IsOptional()
  @IsString()
  emergencyPhone?: string

  @IsOptional()
  @IsObject()
  medicalHistory?: Record<string, any>

  @IsOptional()
  @IsObject()
  lifestyle?: Record<string, any>

  @IsOptional()
  @IsString()
  gender?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  height?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  weight?: number

  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType

  @IsOptional()
  @IsString()
  birthDate?: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  email?: string
}
