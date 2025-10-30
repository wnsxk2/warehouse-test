import { apiClient } from './client';

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const currenciesApi = {
  getAll: async (): Promise<Currency[]> => {
    const response = await apiClient.get('/currencies');
    return response.data;
  },
};
