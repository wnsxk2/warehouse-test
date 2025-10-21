'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Button } from '@/components/ui/button';
import { inventorySchema, type InventoryFormData } from '@/lib/validations/inventory';
import { useCreateInventory } from '@/lib/hooks/use-inventory';
import { useItems } from '@/lib/hooks/use-items';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface AddItemToWarehouseModalProps {
  warehouseId: string;
}

export function AddItemToWarehouseModal({ warehouseId }: AddItemToWarehouseModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createInventory = useCreateInventory();
  const { data: items, isLoading: itemsLoading } = useItems();

  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      warehouseId,
      itemId: '',
      quantity: 0,
    },
  });

  const onSubmit = async (data: InventoryFormData) => {
    try {
      await createInventory.mutateAsync(data);
      toast({
        title: 'Success',
        description: 'Item added to warehouse successfully',
      });
      setOpen(false);
      form.reset({
        warehouseId,
        itemId: '',
        quantity: 0,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to add item to warehouse',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Item to Warehouse</DialogTitle>
          <DialogDescription>
            Assign an item to this warehouse with an initial quantity.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={itemsLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item" />
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
                  <FormDescription>
                    Choose which item to add to this warehouse
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Starting quantity for this item in the warehouse
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createInventory.isPending}>
                {createInventory.isPending ? 'Adding...' : 'Add Item'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
