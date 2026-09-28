import { apiClient } from './apiClient';
import type {
  ApiResponse,
  IngredientDto,
  IngredientStockDetailDto,
  InventorySummaryDto,
  StockAdjustmentDto,
  StockAdjustmentPayload,
  StockMovementDto,
  StockReceiptCreatePayload,
  StockReceiptDto,
  StockReceiptPaymentPayload,
} from './types';

export const inventoryService = {
  // --- Inventory & Ingredients ---
  async getInventoryOverview(): Promise<InventorySummaryDto> {
    const res = await apiClient.get<ApiResponse<InventorySummaryDto>>('/admin/inventory/overview');
    return res.data.data;
  },

  async getInventoryIngredients(params?: {
    keyword?: string;
    active?: boolean;
    lowStockOnly?: boolean;
  }): Promise<IngredientDto[]> {
    const res = await apiClient.get<ApiResponse<IngredientDto[]>>('/admin/inventory/ingredients', { params });
    return res.data.data;
  },

  async getIngredientDetail(id: number): Promise<IngredientStockDetailDto> {
    const res = await apiClient.get<ApiResponse<IngredientStockDetailDto>>(`/admin/inventory/ingredients/${id}`);
    return res.data.data;
  },

  async deleteIngredient(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/admin/inventory/ingredients/${id}`);
  },

  async getLowStockIngredients(): Promise<IngredientDto[]> {
    const res = await apiClient.get<ApiResponse<IngredientDto[]>>('/admin/inventory/low-stock');
    return res.data.data;
  },

  async adjustStock(payload: StockAdjustmentPayload): Promise<StockAdjustmentDto> {
    const res = await apiClient.post<ApiResponse<StockAdjustmentDto>>('/admin/inventory/adjustments', payload);
    return res.data.data;
  },

  async getStockMovements(params?: {
    ingredientId?: number;
    movementType?: string;
    fromTime?: string;
    toTime?: string;
    page?: number;
    size?: number;
    limit?: number;
  }): Promise<StockMovementDto[]> {
    const res = await apiClient.get<ApiResponse<StockMovementDto[]>>('/admin/inventory/movements', { params });
    return res.data.data;
  },

  async getStockMovementsPaged(params?: {
    ingredientId?: number;
    movementType?: string;
    fromTime?: string;
    toTime?: string;
    page?: number;
    size?: number;
  }): Promise<{ items: StockMovementDto[]; totalCount: number; totalPages: number; currentPage: number; pageSize: number }> {
    const res = await apiClient.get<ApiResponse<StockMovementDto[]>>('/admin/inventory/movements', { params });
    const totalCount = parseInt(res.headers['x-total-count'] || '0', 10);
    const totalPages = parseInt(res.headers['x-total-pages'] || '1', 10);
    const currentPage = parseInt(res.headers['x-current-page'] || '0', 10);
    const pageSize = parseInt(res.headers['x-page-size'] || '20', 10);
    return {
      items: res.data.data,
      totalCount: Number.isNaN(totalCount) ? res.data.data.length : totalCount,
      totalPages: Number.isNaN(totalPages) ? 1 : totalPages,
      currentPage: Number.isNaN(currentPage) ? 0 : currentPage,
      pageSize: Number.isNaN(pageSize) ? 20 : pageSize,
    };
  },

  // --- Stock Receipts (Phiếu nhập nguyên liệu) ---
  async getStockReceipts(params?: {
    supplierId?: number;
    status?: string;
    paymentStatus?: string;
    fromDate?: string;
    toDate?: string;
    keyword?: string;
  }): Promise<StockReceiptDto[]> {
    const res = await apiClient.get<ApiResponse<StockReceiptDto[]>>('/admin/stock-receipts', { params });
    return res.data.data;
  },

  async getStockReceiptById(id: number): Promise<StockReceiptDto> {
    const res = await apiClient.get<ApiResponse<StockReceiptDto>>(`/admin/stock-receipts/${id}`);
    return res.data.data;
  },

  async createStockReceipt(payload: StockReceiptCreatePayload): Promise<StockReceiptDto> {
    const res = await apiClient.post<ApiResponse<StockReceiptDto>>('/admin/stock-receipts', payload);
    return res.data.data;
  },

  async updateDraftReceipt(id: number, payload: StockReceiptCreatePayload): Promise<StockReceiptDto> {
    const res = await apiClient.put<ApiResponse<StockReceiptDto>>(`/admin/stock-receipts/${id}`, payload);
    return res.data.data;
  },

  async deleteDraftReceipt(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/admin/stock-receipts/${id}`);
  },

  async confirmStockReceipt(id: number): Promise<StockReceiptDto> {
    const res = await apiClient.post<ApiResponse<StockReceiptDto>>(`/admin/stock-receipts/${id}/confirm`);
    return res.data.data;
  },

  async recordPayment(id: number, payload: StockReceiptPaymentPayload): Promise<StockReceiptDto> {
    const res = await apiClient.post<ApiResponse<StockReceiptDto>>(`/admin/stock-receipts/${id}/payments`, payload);
    return res.data.data;
  },

  async downloadReceiptPdf(id: number, code: string): Promise<void> {
    const res = await apiClient.get(`/admin/stock-receipts/${id}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `phieu-nhap-${code}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

