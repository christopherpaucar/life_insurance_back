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
