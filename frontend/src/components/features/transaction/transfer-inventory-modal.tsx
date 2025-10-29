'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { warehousesApi } from '@/lib/api/warehouses';
import { itemsApi } from '@/lib/api/items';

const transferFormSchema = z.object({
  fromWarehouseId: z.string().min(1, '출발 창고를 선택해주세요'),
  toWarehouseId: z.string().min(1, '도착 창고를 선택해주세요'),
  itemId: z.string().min(1, '아이템을 선택해주세요'),
  quantity: z.number().min(1, '수량은 1 이상이어야 합니다'),
  notes: z.string().optional(),
}).refine(
  (data) => data.fromWarehouseId !== data.toWarehouseId,
  {
    message: '출발 창고와 도착 창고는 달라야 합니다',
    path: ['toWarehouseId'],
  }
);

type TransferFormValues = z.infer<typeof transferFormSchema>;

interface TransferInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TransferFormValues) => void;
}

export function TransferInventoryModal({
  open,
  onOpenChange,
  onSubmit,
}: TransferInventoryModalProps) {
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      fromWarehouseId: '',
      toWarehouseId: '',
      itemId: '',
      quantity: 1,
      notes: '',
    },
  });

  const fromWarehouseId = form.watch('fromWarehouseId');
  const itemId = form.watch('itemId');

  // Fetch warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.getAll(),
  });

  // Fetch items
  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.getAll(),
  });

  // Fetch warehouse inventory to show available items
  const { data: warehouseInventory = [] } = useQuery({
    queryKey: ['warehouse-inventory', fromWarehouseId],
    queryFn: () => warehousesApi.getInventory(fromWarehouseId),
    enabled: !!fromWarehouseId,
  });

  // Get available items in the source warehouse
  const availableItems = fromWarehouseId && warehouseInventory
    ? items.filter(item =>
        warehouseInventory.some(inv => inv.itemId === item.id && Number(inv.quantity) > 0)
      )
    : [];

  // Get available quantity for selected item
  const selectedItemInventory = warehouseInventory.find(
    inv => inv.itemId === itemId
  );
  const availableQuantity = selectedItemInventory ? Number(selectedItemInventory.quantity) : 0;

  const handleSubmit = (values: TransferFormValues) => {
    onSubmit(values);
    form.reset();
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>재고 이동</DialogTitle>
          <DialogDescription>
            창고 간 재고를 이동합니다.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fromWarehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>출발 창고</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('itemId', ''); // Reset item when warehouse changes
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="출발 창고 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} ({warehouse.location})
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
              name="toWarehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>도착 창고</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="도착 창고 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} ({warehouse.location})
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
                  <FormLabel>아이템</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!fromWarehouseId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          fromWarehouseId
                            ? "아이템 선택"
                            : "먼저 출발 창고를 선택하세요"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableItems.map((item) => {
                        const inventory = warehouseInventory.find(
                          inv => inv.itemId === item.id
                        );
                        const qty = inventory ? Number(inventory.quantity) : 0;
                        return (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.sku}) - 재고: {qty}{item.unitOfMeasure}
                          </SelectItem>
                        );
                      })}
                      {availableItems.length === 0 && fromWarehouseId && (
                        <SelectItem value="none" disabled>
                          재고가 없습니다
                        </SelectItem>
                      )}
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
                    수량
                    {itemId && availableQuantity > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        (사용 가능: {availableQuantity})
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={availableQuantity}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      value={field.value}
                      disabled={!itemId}
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
                  <FormLabel>메모 (선택사항)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="추가 메모를 입력하세요"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button type="submit">이동</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
