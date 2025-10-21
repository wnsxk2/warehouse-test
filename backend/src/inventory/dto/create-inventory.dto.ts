import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateInventoryDto {
  @IsString()
  @IsNotEmpty()
  warehouseId!: string;

  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsInt()
  @Min(0)
  quantity!: number;
}
