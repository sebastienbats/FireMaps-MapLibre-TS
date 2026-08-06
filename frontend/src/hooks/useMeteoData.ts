import { useQuery } from '@tanstack/react-query';
import { meteoApi } from '@services/api';
import type { WindCollection } from '@types/index';

export const useWindData = () =>
  useQuery({
    queryKey: ['meteo', 'wind'],
    queryFn: async (): Promise<WindCollection> => (await meteoApi.getWindData()).data.data,
    refetchInterval: 600_000,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
