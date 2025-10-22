import { IsString, IsNotEmpty, IsEmail, IsOptional, MaxLength, IsInt, Min } from 'class-validator';

export class SetupCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxUsers?: number;
}
