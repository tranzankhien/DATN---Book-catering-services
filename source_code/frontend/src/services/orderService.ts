import { apiClient } from './apiClient';
import type {
  ApiResponse,
  CreateOrderPayload,
  OrderDto,
  OrderPreviewPayload,
  OrderPreviewResponseDto,
  OrderStatus,
  PaymentStatus,
} from './types';
import type { PageResponse } from './menuService';

export const orderService = {
  // --- Public / Customer Preview & Create ---
  async previewOrder(payload: OrderPreviewPayload): Promise<OrderPreviewResponseDto> {
    const res = await apiClient.post<ApiResponse<OrderPreviewResponseDto>>('/orders/preview', payload);
    return res.data.data;
  },

  async previewMenu(menuId: number, tableCount: number): Promise<OrderPreviewResponseDto> {
    const res = await apiClient.get<ApiResponse<OrderPreviewResponseDto>>(`/menus/${menuId}/preview`, {
      params: { tableCount },
    });
    return res.data.data;
  },

  async createOrder(payload: CreateOrderPayload, idempotencyKey?: string): Promise<OrderDto> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const res = await apiClient.post<ApiResponse<OrderDto>>('/orders', payload, { headers });
    return res.data.data;
  },

  async getMyOrders(params?: {
    status?: OrderStatus;
    page?: number;
    size?: number;
  }): Promise<PageResponse<OrderDto>> {
    const res = await apiClient.get<ApiResponse<PageResponse<OrderDto>>>('/orders/my', { params });
    return res.data.data;
  },

  async getOrderById(id: number): Promise<OrderDto> {
    const res = await apiClient.get<ApiResponse<OrderDto>>(`/orders/${id}`);
    return res.data.data;
  },

  async getOrderByCode(code: string): Promise<OrderDto> {
    const res = await apiClient.get<ApiResponse<OrderDto>>(`/orders/code/${code}`);
    return res.data.data;
  },

  async cancelOrder(id: number, reason: string): Promise<OrderDto> {
    const res = await apiClient.post<ApiResponse<OrderDto>>(`/orders/${id}/cancel`, { reason });
    return res.data.data;
  },

  // --- Admin ---
  async getAdminOrders(params?: {
    keyword?: string;
    orderStatus?: OrderStatus;
    paymentStatus?: PaymentStatus;
    awaitingPayment?: boolean;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<OrderDto>> {
    const res = await apiClient.get<ApiResponse<PageResponse<OrderDto>>>('/admin/orders', { params });
    return res.data.data;
  },

  async getAdminOrderById(id: number): Promise<OrderDto> {
    const res = await apiClient.get<ApiResponse<OrderDto>>(`/admin/orders/${id}`);
    return res.data.data;
  },

  async adminCancelOrder(id: number, reason: string): Promise<OrderDto> {
    const res = await apiClient.post<ApiResponse<OrderDto>>(`/admin/orders/${id}/cancel`, { reason });
    return res.data.data;
  },

  async updateStatus(role: 'admin' | 'employee', id: number, status: 'PREPARING' | 'COMPLETED'): Promise<OrderDto> {
    const res = await apiClient.patch<ApiResponse<OrderDto>>(`/${role}/orders/${id}/status`, { status });
    return res.data.data;
  },

  // --- Employee ---
  async getEmployeeOrders(params?: {
    orderStatus?: OrderStatus;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<OrderDto>> {
    const res = await apiClient.get<ApiResponse<PageResponse<OrderDto>>>('/employee/orders', { params });
    return res.data.data;
  },

  async getEmployeeOrderById(id: number): Promise<OrderDto> {
    const res = await apiClient.get<ApiResponse<OrderDto>>(`/employee/orders/${id}`);
    return res.data.data;
  },
};
