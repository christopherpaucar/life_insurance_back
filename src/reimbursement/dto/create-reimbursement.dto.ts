import { Type } from 'class-transformer'
import { IsArray, IsNumber, IsString, IsUUID, ValidateNested } from 'class-validator'
import { ReimbursementItemType } from '../entities/reimbursement-item.entity'

export class CreateReimbursementItemDto {
  @IsString()
  description: string

  @IsString()
  type: ReimbursementItemType

  @IsString()
  serviceDate: string

  @IsNumber()
  requestedAmount: number
}

export class CreateReimbursementDto {
  @IsUUID()
  contractId: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReimbursementItemDto)
  items: CreateReimbursementItemDto[]
}
