import { z } from 'zod';

export const transactionSchema = z.object({
  type: z.enum(['INBOUND', 'OUTBOUND'], {
    message: 'Transaction type must be either INBOUND or OUTBOUND',
  }),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  itemId: z.string().min(1, 'Item is required'),
  quantity: z
    .number({ message: 'Quantity must be a number' })
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1'),
  notes: z.string().optional(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
