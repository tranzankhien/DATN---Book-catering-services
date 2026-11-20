import { apiClient } from './apiClient';
import type { ApiResponse, Role, UserDto } from './types';

export interface AdminUserSummary {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  role: Role;
  active: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  employeeId?: number | null;
  employeeCode?: string | null;
  employeePosition?: string | null;
  orderCount: number;
}

export interface UserOrderSummary {
  id: number;
  orderCode: string;
  eventDateTime: string;
  tableCount: number;
  orderStatus: string;
  totalAmount: number;
  createdAt: string;
}

export interface UserEmployeeInfo {
  id: number;
  employeeCode: string;
  fullName: string;
  position: string;
  hireDate: string;
  baseSalary: number;
  status: string;
}

export interface AdminUserDetail {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  role: Role;
  active: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  totalOrders: number;
  totalSpent: number;
  recentOrders: UserOrderSummary[];
  employeeInfo?: UserEmployeeInfo | null;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
  active?: boolean;
  employeeId?: number | null;
}

export interface UpdateUserPayload {
  fullName: string;
  phone?: string;
  role: Role;
  active?: boolean;
  employeeId?: number | null;
}

export interface UpdateProfilePayload {
  fullName: string;
  phone?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AdminResetPasswordResponse {
  userId: number;
  email: string;
  newPassword: string;
  message: string;
}

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface UserFilterParams {
  search?: string;
  role?: string;
  active?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export const userService = {
  async getUsers(params: UserFilterParams = {}): Promise<PageResult<AdminUserSummary>> {
    const query = new URLSearchParams();
    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.role) query.set('role', params.role);
    if (params.active !== undefined) query.set('active', String(params.active));
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortDirection) query.set('sortDirection', params.sortDirection);

    const res = await apiClient.get<ApiResponse<PageResult<AdminUserSummary>>>(
      `/admin/users?${query.toString()}`
    );
    return res.data.data;
  },

  async getUserDetail(id: number): Promise<AdminUserDetail> {
    const res = await apiClient.get<ApiResponse<AdminUserDetail>>(`/admin/users/${id}`);
    return res.data.data;
  },

  async getUnlinkedEmployees(includeUserId?: number): Promise<UserEmployeeInfo[]> {
    const query = includeUserId ? `?includeUserId=${includeUserId}` : '';
    const res = await apiClient.get<ApiResponse<UserEmployeeInfo[]>>(
      `/admin/users/unlinked-employees${query}`
    );
    return res.data.data;
  },

  async createUser(payload: CreateUserPayload): Promise<UserDto> {
    const res = await apiClient.post<ApiResponse<UserDto>>('/admin/users', payload);
    return res.data.data;
  },

  async updateUser(id: number, payload: UpdateUserPayload): Promise<UserDto> {
    const res = await apiClient.put<ApiResponse<UserDto>>(`/admin/users/${id}`, payload);
    return res.data.data;
  },

  async updateUserStatus(id: number, active: boolean, reason?: string): Promise<UserDto> {
    const res = await apiClient.patch<ApiResponse<UserDto>>(`/admin/users/${id}/status`, {
      active,
      reason,
    });
    return res.data.data;
  },

  async resetPassword(id: number, newPassword?: string): Promise<AdminResetPasswordResponse> {
    const res = await apiClient.post<ApiResponse<AdminResetPasswordResponse>>(
      `/admin/users/${id}/reset-password`,
      newPassword ? { newPassword } : {}
    );
    return res.data.data;
  },

  async deleteUser(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/admin/users/${id}`);
  },

  async getProfile(): Promise<UserDto> {
    const res = await apiClient.get<ApiResponse<UserDto>>('/users/profile');
    return res.data.data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<UserDto> {
    const res = await apiClient.put<ApiResponse<UserDto>>('/users/profile', payload);
    return res.data.data;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/users/change-password', payload);
  },
};
