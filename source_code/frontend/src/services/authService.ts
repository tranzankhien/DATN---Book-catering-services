import { apiClient } from './apiClient';
import type { ApiResponse, AuthResponse, UserDto, VerifyEmailPayload, ResendVerificationPayload } from './types';

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

  async verifyEmail(payload: VerifyEmailPayload): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/verify-email', payload);
    return res.data.data;
  },

  async resendVerification(payload: ResendVerificationPayload): Promise<{ email: string; message: string }> {
    const res = await apiClient.post<ApiResponse<void>>('/auth/resend-verification', payload);
    return { email: payload.email, message: res.data.message };
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
