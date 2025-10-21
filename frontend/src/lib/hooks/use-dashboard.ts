'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useRecentTransactions() {
  return useQuery({
    queryKey: ['dashboard', 'recent-transactions'],
    queryFn: dashboardApi.getRecentTransactions,
    refetchInterval: 30000,
  });
}
