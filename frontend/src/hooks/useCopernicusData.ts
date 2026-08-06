import { useQuery } from '@tanstack/react-query';
import { copernicusApi } from '@services/api';
import type { BurnedAreaCollection, FireRiskCollection } from '@types/index';

export const useBurnedAreas = () =>
  useQuery({
    queryKey: ['copernicus', 'burned'],
    queryFn: async (): Promise<BurnedAreaCollection> => (await copernicusApi.getBurnedAreas()).data.data,
    refetchInterval: 3_600_000,
    staleTime: 30 * 60 * 1000,
    retry: 2,
  });

export const useFireRisk = () =>
  useQuery({
    queryKey: ['copernicus', 'risk'],
    queryFn: async (): Promise<FireRiskCollection> => (await copernicusApi.getFireRisk()).data.data,
    refetchInterval: 3_600_000,
    staleTime: 30 * 60 * 1000,
    retry: 2,
  });
