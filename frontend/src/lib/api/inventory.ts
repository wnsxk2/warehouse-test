import { apiClient } from './client';
import type { InventoryFormData, UpdateInventoryFormData } from '../validations/inventory';

export interface InventoryItem {
  id: string;
  warehouseId: string;
  itemId: string;
  quantity: number;
  lastRestockedAt: Date | null;
  updatedAt: Date;
  item: {
    id: string;
    name: string;
    sku: string;
    category: string | null;
  };
  warehouse?: {
    id: string;
    name: string;
    location: string;
  };
}

export const inventoryApi = {
  create: async (data: InventoryFormData): Promise<InventoryItem> => {
    const response = await apiClient.post('/inventory', data);
    return response.data;
  },

  update: async (id: string, data: UpdateInventoryFormData): Promise<InventoryItem> => {
    const response = await apiClient.patch(`/inventory/${id}`, data);
    return response.data;
  },

  getByWarehouse: async (warehouseId: string): Promise<InventoryItem[]> => {
    const response = await apiClient.get(`/warehouses/${warehouseId}/inventory`);
    return response.data;
  },
};
