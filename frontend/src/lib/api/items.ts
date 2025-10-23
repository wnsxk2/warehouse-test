import { apiClient } from './client';

export interface Item {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitOfMeasure: string;
  description?: string;
  reorderThreshold: number;
  companyId?: string;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  totalQuantity?: number;
}

export interface ItemFilters {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface WarehouseDistribution {
  warehouseId: string;
  warehouseName: string;
  warehouseLocation: string;
  quantity: number;
}

export interface ItemStockSummary {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  unitOfMeasure: string;
  reorderThreshold: number | null;
  totalQuantity: number;
  warehouseDistribution: WarehouseDistribution[];
  isLowStock: boolean;
}

export const itemsApi = {
  getAll: async (filters?: ItemFilters): Promise<Item[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `/items?${queryString}` : '/items';

    const response = await apiClient.get(url);
    return response.data;
  },

  getById: async (id: string): Promise<Item> => {
    const response = await apiClient.get(`/items/${id}`);
    return response.data;
  },

  create: async (data: {
    sku: string;
    name: string;
    category: string;
    unitOfMeasure: string;
    description?: string;
    reorderThreshold: number;
  }): Promise<Item> => {
    const response = await apiClient.post('/items', data);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      sku?: string;
      name?: string;
      category?: string;
      unitOfMeasure?: string;
      description?: string;
      reorderThreshold?: number;
    }
  ): Promise<Item> => {
    const response = await apiClient.patch(`/items/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<Item> => {
    const response = await apiClient.delete(`/items/${id}`);
    return response.data;
  },

  getStockSummary: async (): Promise<ItemStockSummary[]> => {
    const response = await apiClient.get('/items/stock-summary');
    return response.data;
  },
};
