import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import api from './axiosInstance';
import adminApi from './adminAxios';

interface ApiCallerOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  params?: Record<string, unknown>;
  payload?: unknown;
  useAdmin?: boolean;
  responseType?: 'json' | 'blob' | 'arraybuffer' | 'text';
}

export async function apiCaller<T = unknown>(options: ApiCallerOptions): Promise<T> {
  const {
    method = 'GET',
    endpoint,
    params,
    payload,
    useAdmin = false,
    responseType,
  } = options;

  const instance: AxiosInstance = useAdmin ? adminApi : api;

  const config: AxiosRequestConfig = {
    method,
    url: endpoint,
    ...(params ? { params } : {}),
    ...(responseType ? { responseType } : {}),
  };

  if (['POST', 'PUT', 'PATCH'].includes(method) && payload !== undefined) {
    config.data = payload;
  }

  const response = await instance(config);
  return (responseType ? response : response.data) as T;
}
