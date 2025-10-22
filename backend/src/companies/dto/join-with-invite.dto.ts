import { IsString, IsNotEmpty } from 'class-validator';

export class JoinWithInviteDto {
  @IsString()
  @IsNotEmpty()
  code!: string;
}
