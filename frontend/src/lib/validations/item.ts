import { z } from 'zod';

export const itemSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU must be at most 50 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  category: z.string().min(1, 'Category is required').max(50, 'Category must be at most 50 characters'),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required').max(20, 'Unit of measure must be at most 20 characters'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  reorderThreshold: z
    .number({ message: 'Reorder threshold must be a number' })
    .int('Reorder threshold must be an integer')
    .min(0, 'Reorder threshold must be at least 0'),
});

export type ItemFormData = z.infer<typeof itemSchema>;
