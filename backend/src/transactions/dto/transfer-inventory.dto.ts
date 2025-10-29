import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class TransferInventoryDto {
  @IsString()
  @IsNotEmpty()
  fromWarehouseId!: string;

  @IsString()
  @IsNotEmpty()
  toWarehouseId!: string;

  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsString()
  notes?: string;
}
