import apiClient from './client';

export interface TransactionItem {
  id: string;
  warehouseId: string;
  itemId: string;
  quantity: number;
  warehouse: {
    id: string;
    name: string;
    location: string;
  };
  item: {
    id: string;
    sku: string;
    name: string;
    unitOfMeasure: string;
  };
}

export interface Transaction {
  id: string;
  type: 'INBOUND' | 'OUTBOUND';
  notes?: string;
  createdAt: string;
  items: TransactionItem[];
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TransactionFilters {
  type?: 'INBOUND' | 'OUTBOUND';
  warehouseId?: string;
  itemId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const transactionsApi = {
  getAll: async (filters?: TransactionFilters): Promise<Transaction[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
    if (filters?.itemId) params.append('itemId', filters.itemId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `/transactions?${queryString}` : '/transactions';

    const response = await apiClient.get(url);
    return response.data;
  },

  getById: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get(`/transactions/${id}`);
    return response.data;
  },

  create: async (data: {
    type: 'INBOUND' | 'OUTBOUND';
    items: Array<{
      warehouseId: string;
      itemId: string;
      quantity: number;
    }>;
    notes?: string;
  }): Promise<Transaction> => {
    const response = await apiClient.post('/transactions', data);
    return response.data;
  },
};
