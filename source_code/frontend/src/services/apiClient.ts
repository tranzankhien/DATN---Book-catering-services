import axios, { AxiosError } from 'axios';
import type { ApiErrorResponse } from './types';

export const TOKEN_STORAGE_KEY = 'banquethub_access_token';
export const USER_STORAGE_KEY = 'banquethub_user_profile';

const baseURL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8080/api/v1' : '/api/v1');

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function extractErrorMessage(error: unknown, fallback = 'Đã xảy ra lỗi khi kết nối máy chủ.'): string {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<ApiErrorResponse>;
    const data = axiosErr.response?.data;
    if (data?.validationErrors) {
      const firstFieldMsg = Object.values(data.validationErrors)[0];
      if (firstFieldMsg) return firstFieldMsg;
    }
    if (data?.message) {
      return data.message;
    }
    if (axiosErr.code === 'ERR_NETWORK') {
      return 'Không thể kết nối tới Backend API (http://localhost:8080). Vui lòng kiểm tra server Spring Boot.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
