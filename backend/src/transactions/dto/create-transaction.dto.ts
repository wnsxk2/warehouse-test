import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TransactionType {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export class TransactionItemDto {
  @IsString()
  @IsNotEmpty()
  warehouseId!: string;

  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type!: TransactionType;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one transaction item is required' })
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items!: TransactionItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}
