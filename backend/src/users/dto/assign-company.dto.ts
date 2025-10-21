import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class AssignCompanyDto {
  @IsString()
  @IsNotEmpty()
  companyId!: string;

  @IsEnum(['ADMIN', 'MANAGER', 'USER'])
  @IsNotEmpty()
  role!: string;
}
