import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory';
import type { InventoryFormData, UpdateInventoryFormData } from '../validations/inventory';

export function useWarehouseInventory(warehouseId: string) {
  return useQuery({
    queryKey: ['warehouses', warehouseId, 'inventory'],
    queryFn: () => inventoryApi.getByWarehouse(warehouseId),
    enabled: !!warehouseId,
  });
}

export function useCreateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InventoryFormData) => inventoryApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['warehouses', variables.warehouseId, 'inventory']
      });
      queryClient.invalidateQueries({
        queryKey: ['warehouses', variables.warehouseId]
      });
      queryClient.invalidateQueries({
        queryKey: ['warehouses']
      });
    },
  });
}

export function useUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryFormData }) =>
      inventoryApi.update(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['warehouses', result.warehouseId, 'inventory']
      });
      queryClient.invalidateQueries({
        queryKey: ['warehouses', result.warehouseId]
      });
    },
  });
}
