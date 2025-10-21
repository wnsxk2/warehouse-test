import { IsString, IsNotEmpty, MinLength, IsEmail, IsEnum, IsOptional } from 'class-validator';

export class CreateUserAdminDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(['ADMIN', 'MANAGER', 'USER'])
  @IsNotEmpty()
  role!: string;

  @IsString()
  @IsNotEmpty()
  companyId!: string;
}
