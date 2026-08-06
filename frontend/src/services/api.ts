import axios, { type AxiosResponse, type AxiosError } from 'axios';
import type { FireApiResponse, BurnedAreaCollection, FireRiskCollection, WindCollection, SdisCollection, ExportRequest, ExportSuccessResponse, ExportListResponse, ApiErrorResponse } from '@types/index';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE, timeout: 30_000 });

api.interceptors.response.use(
  r => r,
  (e: AxiosError<ApiErrorResponse>) => Promise.reject(new Error(e.response?.data?.error || e.message))
);

export const fireApi = {
  getFires: (days = 1): Promise<AxiosResponse<FireApiResponse>> => api.get(`/fires?days=${days}`),
};

export const copernicusApi = {
  getBurnedAreas: (): Promise<AxiosResponse<{ data: BurnedAreaCollection }>> => api.get('/copernicus/burned-areas'),
  getFireRisk: (): Promise<AxiosResponse<{ data: FireRiskCollection }>> => api.get('/copernicus/fire-risk'),
};

export const meteoApi = {
  getWindData: (): Promise<AxiosResponse<{ data: WindCollection }>> => api.get('/meteo/wind'),
};

export const sdisApi = {
  getAllSdis: (): Promise<AxiosResponse<{ data: SdisCollection }>> => api.get('/sdis'),
};

export const exportApi = {
  saveExport: (d: ExportRequest): Promise<AxiosResponse<ExportSuccessResponse>> => api.post('/exports', d),
  listExports: (): Promise<AxiosResponse<ExportListResponse>> => api.get('/exports'),
};
