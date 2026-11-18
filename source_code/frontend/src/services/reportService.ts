import { apiClient } from './apiClient';
import type {
  ApiResponse,
  CashFlowReportResponse,
  CostBreakdownDto,
  DashboardAlertDto,
  DashboardOverviewResponse,
  IngredientValuationDto,
  InventoryReportResponse,
  OrderStatusStatDto,
  PaidOrderReportDto,
  PayrollReportResponse,
  ProfitReportResponse,
  RevenueSummaryResponse,
  SupplierPurchaseDto,
  TimeSeriesPoint,
  TopDishReportDto,
} from './types';

export interface DateFilterParams {
  startDate?: string;
  endDate?: string;
}

export const reportService = {
  // -------------------------------------------------------------------------
  // DASHBOARD APIS
  // -------------------------------------------------------------------------
  async getDashboardOverview(params?: DateFilterParams): Promise<ApiResponse<DashboardOverviewResponse>> {
    const res = await apiClient.get<ApiResponse<DashboardOverviewResponse>>('/admin/dashboard/overview', { params });
    return res.data;
  },

  async getRevenueChart(params?: DateFilterParams & { groupBy?: 'DAY' | 'WEEK' | 'MONTH' }): Promise<ApiResponse<TimeSeriesPoint[]>> {
    const res = await apiClient.get<ApiResponse<TimeSeriesPoint[]>>('/admin/dashboard/revenue-chart', { params });
    return res.data;
  },

  async getOrderStatusDistribution(params?: DateFilterParams): Promise<ApiResponse<OrderStatusStatDto[]>> {
    const res = await apiClient.get<ApiResponse<OrderStatusStatDto[]>>('/admin/dashboard/order-status-stats', { params });
    return res.data;
  },

  async getCostStructure(params?: DateFilterParams): Promise<ApiResponse<CostBreakdownDto[]>> {
    const res = await apiClient.get<ApiResponse<CostBreakdownDto[]>>('/admin/dashboard/cost-structure', { params });
    return res.data;
  },

  async getDashboardAlerts(): Promise<ApiResponse<DashboardAlertDto[]>> {
    const res = await apiClient.get<ApiResponse<DashboardAlertDto[]>>('/admin/dashboard/alerts');
    return res.data;
  },

  // -------------------------------------------------------------------------
  // REVENUE REPORTS
  // -------------------------------------------------------------------------
  async getRevenueSummary(params?: DateFilterParams): Promise<ApiResponse<RevenueSummaryResponse>> {
    const res = await apiClient.get<ApiResponse<RevenueSummaryResponse>>('/admin/reports/revenue/summary', { params });
    return res.data;
  },

  async getRevenueTrend(params?: DateFilterParams & { groupBy?: 'DAY' | 'WEEK' | 'MONTH' }): Promise<ApiResponse<TimeSeriesPoint[]>> {
    const res = await apiClient.get<ApiResponse<TimeSeriesPoint[]>>('/admin/reports/revenue/trend', { params });
    return res.data;
  },

  async getTopDishes(params?: DateFilterParams & { limit?: number }): Promise<ApiResponse<TopDishReportDto[]>> {
    const res = await apiClient.get<ApiResponse<TopDishReportDto[]>>('/admin/reports/revenue/top-dishes', { params });
    return res.data;
  },

  async getPaidOrders(params?: DateFilterParams & { page?: number; size?: number }): Promise<
    ApiResponse<{ content: PaidOrderReportDto[]; totalElements: number; totalPages: number; number: number }>
  > {
    const res = await apiClient.get<
      ApiResponse<{ content: PaidOrderReportDto[]; totalElements: number; totalPages: number; number: number }>
    >('/admin/reports/revenue/paid-orders', { params });
    return res.data;
  },

  // -------------------------------------------------------------------------
  // INVENTORY & COST REPORTS
  // -------------------------------------------------------------------------
  async getInventoryOverview(params?: DateFilterParams): Promise<ApiResponse<InventoryReportResponse>> {
    const res = await apiClient.get<ApiResponse<InventoryReportResponse>>('/admin/reports/inventory/overview', { params });
    return res.data;
  },

  async getIngredientValuation(): Promise<ApiResponse<IngredientValuationDto[]>> {
    const res = await apiClient.get<ApiResponse<IngredientValuationDto[]>>('/admin/reports/inventory/valuation');
    return res.data;
  },

  async getSupplierPurchases(params?: DateFilterParams): Promise<ApiResponse<SupplierPurchaseDto[]>> {
    const res = await apiClient.get<ApiResponse<SupplierPurchaseDto[]>>('/admin/reports/inventory/supplier-purchases', { params });
    return res.data;
  },

  // -------------------------------------------------------------------------
  // PAYROLL REPORT
  // -------------------------------------------------------------------------
  async getPayrollOverview(params?: DateFilterParams): Promise<ApiResponse<PayrollReportResponse>> {
    const res = await apiClient.get<ApiResponse<PayrollReportResponse>>('/admin/reports/payroll/overview', { params });
    return res.data;
  },

  async getPayrollMonthlyTrend(params?: DateFilterParams): Promise<ApiResponse<TimeSeriesPoint[]>> {
    const res = await apiClient.get<ApiResponse<TimeSeriesPoint[]>>('/admin/reports/payroll/monthly-trend', { params });
    return res.data;
  },

  // -------------------------------------------------------------------------
  // PROFIT REPORT
  // -------------------------------------------------------------------------
  async getProfitReport(params?: DateFilterParams): Promise<ApiResponse<ProfitReportResponse>> {
    const res = await apiClient.get<ApiResponse<ProfitReportResponse>>('/admin/reports/profit', { params });
    return res.data;
  },

  async getProfitMonthlyTrend(params?: DateFilterParams): Promise<ApiResponse<TimeSeriesPoint[]>> {
    const res = await apiClient.get<ApiResponse<TimeSeriesPoint[]>>('/admin/reports/profit/monthly-trend', { params });
    return res.data;
  },

  // -------------------------------------------------------------------------
  // CASH FLOW REPORT
  // -------------------------------------------------------------------------
  async getCashFlowReport(params?: DateFilterParams): Promise<ApiResponse<CashFlowReportResponse>> {
    const res = await apiClient.get<ApiResponse<CashFlowReportResponse>>('/admin/reports/cash-flow', { params });
    return res.data;
  },

  // -------------------------------------------------------------------------
  // CSV EXPORTS (Triggers download with Blob)
  // -------------------------------------------------------------------------
  async downloadExportCsv(
    type: 'revenue' | 'inventory' | 'expenses' | 'profit' | 'cash-flow',
    params?: DateFilterParams
  ): Promise<void> {
    const endpointMap: Record<string, string> = {
      revenue: '/admin/reports/export/revenue',
      inventory: '/admin/reports/export/inventory',
      expenses: '/admin/reports/export/expenses',
      profit: '/admin/reports/export/profit',
      'cash-flow': '/admin/reports/export/cash-flow',
    };

    const endpoint = endpointMap[type];
    if (!endpoint) return;

    const res = await apiClient.get(endpoint, {
      params,
      responseType: 'blob',
    });

    // Extract filename from Content-Disposition if present, or generate default
    const contentDisposition = res.headers['content-disposition'];
    let filename = `banquethub_${type}_report.csv`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
