import { Type } from 'class-transformer'
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator'
import { ReimbursementStatus } from '../entities/reimbursement.entity'
import { ReimbursementItemStatus } from '../entities/reimbursement-item.entity'

export class ReviewReimbursementItemDto {
  @IsUUID()
  id: string

  @IsEnum(ReimbursementItemStatus)
  status: ReimbursementItemStatus

  @IsNumber()
  @IsOptional()
  approvedAmount?: number

  @IsString()
  @IsOptional()
  rejectionReason?: string
}

export class ReviewReimbursementDto {
  @IsEnum(ReimbursementStatus)
  @IsNotEmpty()
  status: ReimbursementStatus

  @IsString()
  @IsOptional()
  reviewerNotes?: string

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ReviewReimbursementItemDto)
  items?: ReviewReimbursementItemDto[]
}
