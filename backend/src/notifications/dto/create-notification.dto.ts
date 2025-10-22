import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum NotificationType {
  WAREHOUSE_CREATED = 'WAREHOUSE_CREATED',
  WAREHOUSE_DELETED = 'WAREHOUSE_DELETED',
  ITEM_CREATED = 'ITEM_CREATED',
  ITEM_DELETED = 'ITEM_DELETED',
  TRANSACTION_CREATED = 'TRANSACTION_CREATED',
}

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  companyId!: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  type!: NotificationType;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsOptional()
  relatedId?: string;
}
