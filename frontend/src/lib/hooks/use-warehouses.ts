import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesApi } from '../api/warehouses';
import type { WarehouseFormData, UpdateWarehouseFormData } from '../validations/warehouse';

export function useWarehouses(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['warehouses', page, limit],
    queryFn: () => warehousesApi.getAll(page, limit),
  });
}

export function useWarehouse(id: string) {
  return useQuery({
    queryKey: ['warehouse', id],
    queryFn: () => warehousesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WarehouseFormData) => warehousesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWarehouseFormData }) =>
      warehousesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse', variables.id] });
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => warehousesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
}

export function useWarehouseInventory(id: string) {
  return useQuery({
    queryKey: ['warehouse', id, 'inventory'],
    queryFn: () => warehousesApi.getInventory(id),
    enabled: !!id,
  });
}
