import { z } from 'zod';

export const inventorySchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required'),
  itemId: z.string().min(1, 'Item is required'),
  quantity: z
    .number({ message: 'Quantity must be a number' })
    .int('Quantity must be an integer')
    .min(0, 'Quantity must be at least 0'),
});

export const updateInventorySchema = z.object({
  quantity: z
    .number({ message: 'Quantity must be a number' })
    .int('Quantity must be an integer')
    .min(0, 'Quantity must be at least 0'),
});

export type InventoryFormData = z.infer<typeof inventorySchema>;
export type UpdateInventoryFormData = z.infer<typeof updateInventorySchema>;
