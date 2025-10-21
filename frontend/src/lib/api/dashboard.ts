import apiClient from './client';

export interface DashboardStats {
  totalWarehouses: number;
  totalItems: number;
  lowStockItems: number;
  totalTransactions: number;
}

export interface RecentTransaction {
  id: string;
  type: 'INBOUND' | 'OUTBOUND';
  quantity: number;
  notes?: string;
  createdAt: string;
  warehouse: {
    id: string;
    name: string;
  };
  item: {
    id: string;
    name: string;
    sku: string;
  };
  user: {
    id: string;
    name: string;
  };
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get('/dashboard/stats');
    return data;
  },

  getRecentTransactions: async (): Promise<RecentTransaction[]> => {
    const { data } = await apiClient.get('/dashboard/recent-transactions');
    return data;
  },
};
