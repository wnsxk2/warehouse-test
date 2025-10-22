import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateInviteCodeDto {
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  maxUses?: number;

  @IsInt()
  @Min(1)
  @Max(365)
  @IsOptional()
  expiresInDays?: number;
}
