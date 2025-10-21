import { apiClient } from './client';
import type { WarehouseFormData, UpdateWarehouseFormData } from '../validations/warehouse';

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  _count: {
    inventory: number;
  };
}

export interface InventoryItem {
  id: string;
  warehouseId: string;
  itemId: string;
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  createdAt: Date;
  updatedAt: Date;
  item: {
    id: string;
    name: string;
    sku: string;
    category: string;
  };
}

export const warehousesApi = {
  getAll: async (page = 1, limit = 10): Promise<Warehouse[]> => {
    const response = await apiClient.get('/warehouses', {
      params: { page, limit },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Warehouse> => {
    const response = await apiClient.get(`/warehouses/${id}`);
    return response.data;
  },

  create: async (data: WarehouseFormData): Promise<Warehouse> => {
    const response = await apiClient.post('/warehouses', data);
    return response.data;
  },

  update: async (id: string, data: UpdateWarehouseFormData): Promise<Warehouse> => {
    const response = await apiClient.patch(`/warehouses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/warehouses/${id}`);
  },

  getInventory: async (id: string): Promise<InventoryItem[]> => {
    const response = await apiClient.get(`/warehouses/${id}/inventory`);
    return response.data;
  },
};
