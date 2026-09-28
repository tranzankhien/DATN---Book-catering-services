import { apiClient } from './apiClient';
import type { ApiResponse, StockReceiptDto, SupplierDto, SupplierUpsertPayload } from './types';

export const supplierService = {
  async getSuppliers(params?: { keyword?: string; active?: boolean }): Promise<SupplierDto[]> {
    const res = await apiClient.get<ApiResponse<SupplierDto[]>>('/admin/suppliers', { params });
    return res.data.data;
  },

  async getSupplierById(id: number): Promise<SupplierDto> {
    const res = await apiClient.get<ApiResponse<SupplierDto>>(`/admin/suppliers/${id}`);
    return res.data.data;
  },

  async getSupplierReceipts(id: number): Promise<StockReceiptDto[]> {
    const res = await apiClient.get<ApiResponse<StockReceiptDto[]>>(`/admin/suppliers/${id}/receipts`);
    return res.data.data;
  },

  async createSupplier(payload: SupplierUpsertPayload): Promise<SupplierDto> {
    const res = await apiClient.post<ApiResponse<SupplierDto>>('/admin/suppliers', payload);
    return res.data.data;
  },

  async updateSupplier(id: number, payload: SupplierUpsertPayload): Promise<SupplierDto> {
    const res = await apiClient.put<ApiResponse<SupplierDto>>(`/admin/suppliers/${id}`, payload);
    return res.data.data;
  },

  async toggleSupplierActive(id: number): Promise<SupplierDto> {
    const res = await apiClient.patch<ApiResponse<SupplierDto>>(`/admin/suppliers/${id}/toggle-active`);
    return res.data.data;
  },
};

