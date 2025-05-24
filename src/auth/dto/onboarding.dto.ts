import { IsDate, IsString, IsNumber, IsOptional, IsObject, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class OnboardingDto {
  @IsDate()
  @Type(() => Date)
  birthDate: Date

  @IsString()
  bloodType: string

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
