'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { itemSchema, type ItemFormData } from '@/lib/validations/item';
import { useCreateItem, useUpdateItem } from '@/lib/hooks/use-items';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Item } from '@/lib/api/items';
import { useEffect } from 'react';

interface RegisterItemModalProps {
  open: boolean;
  onClose: () => void;
  item?: Item | null;
}

export function RegisterItemModal({ open, onClose, item }: RegisterItemModalProps) {
  const isEditMode = !!item;
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      sku: '',
      name: '',
      category: '',
      unitOfMeasure: '',
      description: '',
      reorderThreshold: 0,
    },
  });

  // Reset form when modal opens/closes or item changes
  useEffect(() => {
    if (open) {
      if (item) {
        form.reset({
          sku: item.sku,
          name: item.name,
          category: item.category,
          unitOfMeasure: item.unitOfMeasure,
          description: item.description || '',
          reorderThreshold: item.reorderThreshold,
        });
      } else {
        form.reset({
          sku: '',
          name: '',
          category: '',
          unitOfMeasure: '',
          description: '',
          reorderThreshold: 0,
        });
      }
    }
  }, [open, item, form]);

  const onSubmit = async (data: ItemFormData) => {
    try {
      if (isEditMode && item) {
        await updateItem.mutateAsync({ id: item.id, data });
      } else {
        await createItem.mutateAsync(data);
      }
      form.reset();
      onClose();
    } catch {
      // Error handling is done in the mutation hooks
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Item' : 'Register New Item'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ITEM-001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Item name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Electronics" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitOfMeasure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit of Measure</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="EA, KG, L" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reorderThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Threshold</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Item description" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createItem.isPending || updateItem.isPending}
              >
                {isEditMode ? 'Update' : 'Register'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
