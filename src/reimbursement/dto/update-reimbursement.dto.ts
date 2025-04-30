import { Type } from 'class-transformer'
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator'

export class UpdateReimbursementItemDto {
  @IsUUID()
  id: string

  @IsString()
  @IsOptional()
  description?: string

  @IsNumber()
  @IsOptional()
  requestedAmount?: number

  @IsString()
  @IsOptional()
  documentUrl?: string
}

export class UpdateReimbursementDto {
  @IsString()
  @IsOptional()
  notes?: string

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateReimbursementItemDto)
  items?: UpdateReimbursementItemDto[]
}
