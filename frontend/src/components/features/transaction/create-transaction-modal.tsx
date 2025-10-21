'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCreateTransaction } from '@/lib/hooks/use-transactions';
import { useWarehouses } from '@/lib/hooks/use-warehouses';
import { useItems } from '@/lib/hooks/use-items';

const transactionSchema = z.object({
  type: z.enum(['INBOUND', 'OUTBOUND']),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  itemId: z.string().min(1, 'Item is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  notes: z.string().max(500, 'Notes must be at most 500 characters').optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface CreateTransactionModalProps {
  open: boolean;
  onClose: () => void;
  defaultWarehouseId?: string;
  defaultItemId?: string;
}

export function CreateTransactionModal({
  open,
  onClose,
  defaultWarehouseId,
  defaultItemId,
}: CreateTransactionModalProps) {
  const createTransaction = useCreateTransaction();
  const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();
  const { data: items, isLoading: itemsLoading } = useItems();

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'INBOUND',
      warehouseId: defaultWarehouseId || '',
      itemId: defaultItemId || '',
      quantity: 1,
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        type: 'INBOUND',
        warehouseId: defaultWarehouseId || '',
        itemId: defaultItemId || '',
        quantity: 1,
        notes: '',
      });
    }
  }, [open, defaultWarehouseId, defaultItemId, form]);

  const onSubmit = async (data: TransactionFormData) => {
    try {
      await createTransaction.mutateAsync(data);
      form.reset();
      onClose();
    } catch {
      // Error handling is done in the mutation hook
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const transactionType = form.watch('type');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Transaction</DialogTitle>
          <DialogDescription>
            Record an inbound or outbound transaction for inventory items.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INBOUND">
                        📥 Inbound (입고)
                      </SelectItem>
                      <SelectItem value="OUTBOUND">
                        📤 Outbound (출고)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="warehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warehouse</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={warehousesLoading || !!defaultWarehouseId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouses?.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} - {warehouse.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={itemsLoading || !!defaultItemId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Quantity {transactionType === 'INBOUND' ? '(입고 수량)' : '(출고 수량)'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Enter quantity"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTransaction.isPending}
              >
                {createTransaction.isPending ? 'Creating...' : 'Create Transaction'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
