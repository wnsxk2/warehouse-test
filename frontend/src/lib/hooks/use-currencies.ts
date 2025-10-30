import { useQuery } from '@tanstack/react-query';
import { currenciesApi } from '../api/currencies';

export function useCurrencies() {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: () => currenciesApi.getAll(),
    staleTime: 60 * 60 * 1000, // 1 hour - currencies don't change frequently
  });
}
