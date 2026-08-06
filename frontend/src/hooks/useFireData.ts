import { useQuery } from '@tanstack/react-query';
import { fireApi } from '@services/api';
import type { FireCollection } from '@types/index';

export const useFireData = (days: number = 1) =>
  useQuery({
    queryKey: ['fires', days],
    queryFn: async (): Promise<FireCollection> => (await fireApi.getFires(days)).data.data,
    refetchInterval: 300_000,
    staleTime: 60_000,
    retry: 3,
    retryDelay: i => Math.min(1000 * 2 ** i, 30_000),
    placeholderData: p => p,
  });
