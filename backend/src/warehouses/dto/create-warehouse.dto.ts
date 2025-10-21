import { IsString, IsNotEmpty, IsInt, Min, MaxLength } from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  location!: string;

  @IsInt()
  @Min(0)
  capacity!: number;
}
