import { IsString, IsNotEmpty, IsInt, Min, IsOptional, MaxLength, IsNumber } from 'class-validator';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sku!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unitOfMeasure!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  @Min(0)
  purchasePrice!: number;

  @IsInt()
  @Min(1)
  purchasePriceCurrencyId!: number;

  @IsNumber()
  @Min(0)
  salePrice!: number;

  @IsInt()
  @Min(1)
  salePriceCurrencyId!: number;

  @IsInt()
  @Min(0)
  reorderThreshold!: number;
}
