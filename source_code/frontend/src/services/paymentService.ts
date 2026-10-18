import { apiClient } from './apiClient';
import type { ApiResponse, OrderDto, OrderStatus, PaymentStatus } from './types';
import type { PageResponse } from './menuService';

export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | 'REVIEW_REQUIRED' | 'REVIEW_CLOSED';
export type ReviewAction = 'RETRY_SETTLEMENT' | 'CLOSE_MANUALLY';
export interface PaymentView {
  id: number; orderId: number; provider: string; transactionReference: string; providerTransactionNo?: string;
  amount: number; status: TransactionStatus; bankCode?: string; paidAt?: string;
  expiresAt: string; failureReason?: string; createdAt: string;
}
export interface PaymentState {
  orderId: number; orderStatus: OrderStatus; paymentStatus: PaymentStatus; transactions: PaymentView[];
  checkoutConfigured: boolean;
  reservation: OrderDto['reservation'];
  statusHistories: OrderDto['statusHistories'];
}
export interface NotificationView {
  id: number; orderId: number; eventType: string; status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';
  attempts: number; lastError?: string; createdAt: string; sentAt?: string;
}
export const paymentService = {
  async create(orderId: number) {
    return (await apiClient.post<ApiResponse<{ checkoutUrl: string; fields: Record<string, string>; paymentAttemptId: number; transactionReference: string; expiresAt: string }>>('/payments/sepay/create', { orderId })).data.data;
  },
  async status(orderId: number) {
    return (await apiClient.get<ApiResponse<PaymentState>>(`/orders/${orderId}/payment-status`)).data.data;
  },
  async reference(reference: string, signal?: AbortSignal) {
    return (await apiClient.get<ApiResponse<PaymentState>>(`/payments/reference/${encodeURIComponent(reference)}`, { signal })).data.data;
  },
  async list(page = 0, review = false, status?: string) {
    return (await apiClient.get<ApiResponse<PageResponse<PaymentView>>>(`/admin/payments${review ? '/review' : ''}`, { params: { page, size: 10, status: status || undefined } })).data.data;
  },
  async query(id: number) {
    return (await apiClient.post<ApiResponse<PaymentView>>(`/admin/payments/${id}/query`)).data.data;
  },
  async resolve(id: number, action: ReviewAction, reason: string, resolutionReference?: string) {
    return (await apiClient.post<ApiResponse<PaymentView>>(`/admin/payments/${id}/resolve`, { action, reason, resolutionReference })).data.data;
  },
  async notifications(page = 0, status?: string) {
    return (await apiClient.get<ApiResponse<PageResponse<NotificationView>>>('/admin/notifications', { params: { page, size: 10, status: status || undefined } })).data.data;
  },
  async retry(id: number) {
    return (await apiClient.post<ApiResponse<NotificationView>>(`/admin/notifications/${id}/retry`)).data.data;
  },
};

export const transactionLabels: Record<TransactionStatus, string> = {
  PENDING: 'Đang xác minh', SUCCESS: 'Thành công', FAILED: 'Thất bại', CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn', REVIEW_REQUIRED: 'Cần đối soát', REVIEW_CLOSED: 'Đã đóng đối soát',
};
