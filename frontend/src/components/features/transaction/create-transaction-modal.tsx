'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Plus, Trash2 } from 'lucide-react';
import { useCreateTransaction } from '@/lib/hooks/use-transactions';
import { useWarehouses } from '@/lib/hooks/use-warehouses';
import { useItems } from '@/lib/hooks/use-items';

const transactionItemSchema = z.object({
  warehouseId: z.string().min(1, '창고를 선택해주세요'),
  itemId: z.string().min(1, '아이템을 선택해주세요'),
  quantity: z.number().positive('수량은 0보다 커야 합니다'),
});

const bulkTransactionSchema = z.object({
  type: z.enum(['INBOUND', 'OUTBOUND']),
  items: z.array(transactionItemSchema).min(1, '최소 1개 이상의 아이템이 필요합니다'),
  notes: z.string().max(500, '메모는 최대 500자까지 입력 가능합니다').optional(),
});

type BulkTransactionFormData = z.infer<typeof bulkTransactionSchema>;

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

  const form = useForm<BulkTransactionFormData>({
    resolver: zodResolver(bulkTransactionSchema),
    defaultValues: {
      type: 'INBOUND',
      items: [
        {
          warehouseId: defaultWarehouseId || '',
          itemId: defaultItemId || '',
          quantity: 1,
        },
      ],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    if (open) {
      form.reset({
        type: 'INBOUND',
        items: [
          {
            warehouseId: defaultWarehouseId || '',
            itemId: defaultItemId || '',
            quantity: 1,
          },
        ],
        notes: '',
      });
    }
  }, [open, defaultWarehouseId, defaultItemId, form]);

  const onSubmit = async (data: BulkTransactionFormData) => {
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

  const handleAddItem = () => {
    append({
      warehouseId: defaultWarehouseId || '',
      itemId: '',
      quantity: 1,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>거래 등록</DialogTitle>
          <DialogDescription>
            입고 또는 출고 거래를 등록하세요. 여러 아이템을 한 번에 등록할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Transaction Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>거래 유형</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="거래 유형 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INBOUND">
                        📥 입고 (Inbound)
                      </SelectItem>
                      <SelectItem value="OUTBOUND">
                        📤 출고 (Outbound)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Items List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">아이템 목록</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  아이템 추가
                </Button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 border border-gray-300 rounded-lg space-y-3 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        아이템 #{index + 1}
                      </span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Warehouse */}
                      <FormField
                        control={form.control}
                        name={`items.${index}.warehouseId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>창고</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={warehousesLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="창고 선택" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {warehouses?.map((warehouse) => (
                                  <SelectItem
                                    key={warehouse.id}
                                    value={warehouse.id}
                                  >
                                    {warehouse.name} - {warehouse.location}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Item */}
                      <FormField
                        control={form.control}
                        name={`items.${index}.itemId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>아이템</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={itemsLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="아이템 선택" />
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

                      {/* Quantity */}
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              수량 {transactionType === 'INBOUND' ? '(입고)' : '(출고)'}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="1"
                                min="1"
                                placeholder="수량 입력"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value, 10))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>메모 (선택사항)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="추가 메모를 입력하세요..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button
                type="submit"
                disabled={createTransaction.isPending}
              >
                {createTransaction.isPending
                  ? '등록 중...'
                  : `거래 등록 (${fields.length}개 아이템)`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
