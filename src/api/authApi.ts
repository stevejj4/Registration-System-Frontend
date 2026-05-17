import { apiClient, setAuthToken } from './client';
import type { LoginPayload, AuthResponse } from '@/types/auth';

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const res = await apiClient.post('/auth/login', payload);
  const data = res.data as AuthResponse;
  // persist token for axios interceptor
  if (data?.token) setAuthToken(data.token);
  return data;
};

export const register = async (payload: unknown): Promise<AuthResponse> => {
  const res = await apiClient.post('/auth/register', payload as any);
  const data = res.data as AuthResponse;
  if (data?.token) setAuthToken(data.token);
  return data;
};
