import { apiClient } from './apiClient';
import type { ApiResponse, AuthResponse, UserDto } from './types';

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', payload);
    return res.data.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', payload);
    return res.data.data;
  },

  async getCurrentUser(): Promise<UserDto> {
    const res = await apiClient.get<ApiResponse<UserDto>>('/auth/me');
    return res.data.data;
  },
};
