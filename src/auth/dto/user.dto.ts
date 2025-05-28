import { IsEmail, IsString, IsOptional, MinLength, MaxLength, Matches, IsEnum } from 'class-validator'
import { RoleType } from '../entities/role.entity'

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
  password?: string

  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType
}
