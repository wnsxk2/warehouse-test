import { z } from 'zod';

export const warehouseSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  location: z
    .string()
    .min(1, 'Location is required')
    .max(255, 'Location must be less than 255 characters'),
  capacity: z
    .number({ message: 'Capacity must be a number' })
    .int('Capacity must be an integer')
    .min(0, 'Capacity must be at least 0'),
});

export const updateWarehouseSchema = warehouseSchema.partial();

export type WarehouseFormData = z.infer<typeof warehouseSchema>;
export type UpdateWarehouseFormData = z.infer<typeof updateWarehouseSchema>;
