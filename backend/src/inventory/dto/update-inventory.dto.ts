import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateInventoryDto } from './create-inventory.dto';

// Omit warehouseId and itemId from updates - these shouldn't change
export class UpdateInventoryDto extends PartialType(
  OmitType(CreateInventoryDto, ['warehouseId', 'itemId'] as const),
) {}
