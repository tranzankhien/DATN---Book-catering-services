import { apiClient } from './apiClient';
import type {
  ApiResponse,
  ExpenseCategory,
  ExpensePaymentStatus,
  ExpenseRequest,
  ExpenseResponse,
  ExpenseSummaryResponse,
} from './types';

export const expenseService = {
  async getExpenses(params?: {
    startDate?: string;
    endDate?: string;
    category?: ExpenseCategory | '';
    status?: ExpensePaymentStatus | '';
    search?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<{ content: ExpenseResponse[]; totalElements: number; totalPages: number; number: number }>> {
    const res = await apiClient.get<ApiResponse<{ content: ExpenseResponse[]; totalElements: number; totalPages: number; number: number }>>(
      '/admin/expenses',
      { params }
    );
    return res.data;
  },

  async getExpenseSummary(params?: {
    startDate?: string;
    endDate?: string;
    category?: ExpenseCategory | '';
  }): Promise<ApiResponse<ExpenseSummaryResponse>> {
    const res = await apiClient.get<ApiResponse<ExpenseSummaryResponse>>('/admin/expenses/summary', { params });
    return res.data;
  },

  async getCategories(): Promise<ApiResponse<{ code: ExpenseCategory; name: string }[]>> {
    const res = await apiClient.get<ApiResponse<{ code: ExpenseCategory; name: string }[]>>('/admin/expenses/categories');
    return res.data;
  },

  async getExpenseById(id: number): Promise<ApiResponse<ExpenseResponse>> {
    const res = await apiClient.get<ApiResponse<ExpenseResponse>>(`/admin/expenses/${id}`);
    return res.data;
  },

  async createExpense(payload: ExpenseRequest): Promise<ApiResponse<ExpenseResponse>> {
    const res = await apiClient.post<ApiResponse<ExpenseResponse>>('/admin/expenses', payload);
    return res.data;
  },

  async updateExpense(id: number, payload: ExpenseRequest): Promise<ApiResponse<ExpenseResponse>> {
    const res = await apiClient.put<ApiResponse<ExpenseResponse>>(`/admin/expenses/${id}`, payload);
    return res.data;
  },

  async markAsPaid(id: number, paidAt?: string): Promise<ApiResponse<ExpenseResponse>> {
    const res = await apiClient.patch<ApiResponse<ExpenseResponse>>(`/admin/expenses/${id}/pay`, null, {
      params: paidAt ? { paidAt } : undefined,
    });
    return res.data;
  },

  async deleteExpense(id: number): Promise<ApiResponse<null>> {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/expenses/${id}`);
    return res.data;
  },
};
