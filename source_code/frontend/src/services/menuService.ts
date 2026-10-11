import { apiClient } from './apiClient';
import type {
  ApiResponse,
  CreateMenuPayload,
  MenuDto,
  MenuStatus,
  UpdateMenuPayload,
} from './types';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const menuService = {
  // --- Public ---
  async getActiveMenus(): Promise<MenuDto[]> {
    const res = await apiClient.get<ApiResponse<MenuDto[]>>('/menus');
    return res.data.data;
  },

  async getMenuById(id: number): Promise<MenuDto> {
    const res = await apiClient.get<ApiResponse<MenuDto>>(`/menus/${id}`);
    return res.data.data;
  },

  // --- Admin ---
  async getAdminMenus(params?: {
    keyword?: string;
    status?: MenuStatus;
    page?: number;
    size?: number;
  }): Promise<PageResponse<MenuDto>> {
    const res = await apiClient.get<ApiResponse<PageResponse<MenuDto>>>('/admin/menus', { params });
    return res.data.data;
  },

  async getAdminMenuById(id: number): Promise<MenuDto> {
    const res = await apiClient.get<ApiResponse<MenuDto>>(`/admin/menus/${id}`);
    return res.data.data;
  },

  async createMenu(payload: CreateMenuPayload): Promise<MenuDto> {
    const res = await apiClient.post<ApiResponse<MenuDto>>('/admin/menus', payload);
    return res.data.data;
  },

  async updateMenu(id: number, payload: UpdateMenuPayload): Promise<MenuDto> {
    const res = await apiClient.put<ApiResponse<MenuDto>>(`/admin/menus/${id}`, payload);
    return res.data.data;
  },

  async updateMenuStatus(id: number, status: MenuStatus): Promise<MenuDto> {
    const res = await apiClient.patch<ApiResponse<MenuDto>>(`/admin/menus/${id}/status`, { status });
    return res.data.data;
  },
};
