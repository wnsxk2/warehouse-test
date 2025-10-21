import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateUserRoleDto {
  @IsEnum(['ADMIN', 'MANAGER', 'USER'])
  @IsNotEmpty()
  role!: string;
}
