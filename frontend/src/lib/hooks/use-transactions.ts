import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi, type TransactionFilters } from '../api/transactions';
import { useToast } from '@/hooks/use-toast';

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionsApi.getAll(filters),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transactions', id],
    queryFn: () => transactionsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: transactionsApi.create,
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      const itemCount = transaction.items.length;
      toast({
        title: '성공',
        description: `${itemCount}개 아이템의 거래가 등록되었습니다`,
      });
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: '오류',
        description: err.response?.data?.message || '거래 등록에 실패했습니다',
        variant: 'destructive',
      });
    },
  });
}
