import { apiClient } from './apiClient';
import {
  VoucherDto,
  CreateVoucherRequest,
  UpdateVoucherRequest,
  VoucherValidationResponse,
} from './types';

export const voucherService = {
  async applyVoucher(code: string, orderAmount: number): Promise<VoucherValidationResponse> {
    const res = await apiClient.post<{ data: VoucherValidationResponse }>('/vouchers/apply', {
      code,
      orderAmount,
    });
    return res.data.data;
  },

  async getAdminVouchers(): Promise<VoucherDto[]> {
    const res = await apiClient.get<{ data: VoucherDto[] }>('/admin/vouchers');
    return res.data.data;
  },

  async getVoucherById(id: number): Promise<VoucherDto> {
    const res = await apiClient.get<{ data: VoucherDto }>(`/admin/vouchers/${id}`);
    return res.data.data;
  },

  async createVoucher(payload: CreateVoucherRequest): Promise<VoucherDto> {
    const res = await apiClient.post<{ data: VoucherDto }>('/admin/vouchers', payload);
    return res.data.data;
  },

  async updateVoucher(id: number, payload: UpdateVoucherRequest): Promise<VoucherDto> {
    const res = await apiClient.put<{ data: VoucherDto }>(`/admin/vouchers/${id}`, payload);
    return res.data.data;
  },

  async toggleVoucherStatus(id: number): Promise<VoucherDto> {
    const res = await apiClient.patch<{ data: VoucherDto }>(`/admin/vouchers/${id}/toggle-status`);
    return res.data.data;
  },

  async deleteVoucher(id: number): Promise<void> {
    await apiClient.delete(`/admin/vouchers/${id}`);
  },
};
