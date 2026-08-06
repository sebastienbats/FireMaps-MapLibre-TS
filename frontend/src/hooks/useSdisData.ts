import { useQuery } from '@tanstack/react-query';
import { sdisApi } from '@services/api';
import type { SdisCollection } from '@types/index';

export const useSdisData = () =>
  useQuery({
    queryKey: ['sdis', 'all'],
    queryFn: async (): Promise<SdisCollection> => (await sdisApi.getAllSdis()).data.data,
    refetchInterval: 86_400_000,
    staleTime: 60 * 60 * 1000,
    retry: 2,
  });
