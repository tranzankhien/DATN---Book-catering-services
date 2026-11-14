import { apiClient } from './apiClient';
import type {
  ApiResponse,
  EmployeeDto,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  EmployeeStatus,
  AttendanceDto,
  RecordAttendancePayload,
  BulkAttendancePayload,
  CompanyAttendanceSummaryDto,
  AttendanceMonthlySummaryDto,
  PayrollPeriodDto,
  CreatePayrollPeriodPayload,
  UpdatePayrollPeriodPayload,
  PayrollPeriodStatus,
  PayrollPeriodPreviewDto,
  PayrollAdjustmentDto,
  CreatePayrollAdjustmentPayload,
  UpdatePayrollAdjustmentPayload,
  PayrollDto,
  PaymentStatus,
  RecordSalaryPaymentPayload,
  SalaryPaymentDto,
  PayrollSummaryDto,
} from './types';

export const employeeService = {
  // =========================================================================
  // ADMIN - EMPLOYEES
  // =========================================================================
  async getEmployees(params?: {
    search?: string;
    status?: EmployeeStatus;
    page?: number;
    size?: number;
  }): Promise<{ content: EmployeeDto[]; totalElements: number; totalPages: number }> {
    const res = await apiClient.get<ApiResponse<any>>('/admin/employees', { params });
    // In case pagination is returned or direct array
    if (res.data.data?.content) {
      return res.data.data;
    }
    return {
      content: Array.isArray(res.data.data) ? res.data.data : [],
      totalElements: Array.isArray(res.data.data) ? res.data.data.length : 0,
      totalPages: 1,
    };
  },

  async getEmployee(id: number): Promise<EmployeeDto> {
    const res = await apiClient.get<ApiResponse<EmployeeDto>>(`/admin/employees/${id}`);
    return res.data.data;
  },

  async createEmployee(payload: CreateEmployeePayload): Promise<EmployeeDto> {
    const res = await apiClient.post<ApiResponse<EmployeeDto>>('/admin/employees', payload);
    return res.data.data;
  },

  async updateEmployee(id: number, payload: UpdateEmployeePayload): Promise<EmployeeDto> {
    const res = await apiClient.put<ApiResponse<EmployeeDto>>(`/admin/employees/${id}`, payload);
    return res.data.data;
  },

  async updateEmployeeStatus(id: number, status: EmployeeStatus): Promise<EmployeeDto> {
    const res = await apiClient.patch<ApiResponse<EmployeeDto>>(`/admin/employees/${id}/status`, { status });
    return res.data.data;
  },

  // =========================================================================
  // ADMIN - ATTENDANCE
  // =========================================================================
  async getAttendance(year: number, month: number, employeeId?: number): Promise<AttendanceDto[]> {
    const res = await apiClient.get<ApiResponse<AttendanceDto[]>>('/admin/attendance', {
      params: { year, month, employeeId },
    });
    return res.data.data;
  },

  async getAttendanceSummary(year: number, month: number): Promise<CompanyAttendanceSummaryDto> {
    const res = await apiClient.get<ApiResponse<CompanyAttendanceSummaryDto>>('/admin/attendance/summary', {
      params: { year, month },
    });
    return res.data.data;
  },

  async recordAttendance(
    employeeId: number,
    date: string,
    payload: RecordAttendancePayload
  ): Promise<AttendanceDto> {
    const res = await apiClient.put<ApiResponse<AttendanceDto>>(
      `/admin/attendance/${employeeId}/${date}`,
      payload
    );
    return res.data.data;
  },

  async recordBulkAttendance(payload: BulkAttendancePayload): Promise<AttendanceDto[]> {
    const res = await apiClient.post<ApiResponse<AttendanceDto[]>>('/admin/attendance/bulk', payload);
    return res.data.data;
  },

  // =========================================================================
  // ADMIN - PAYROLL PERIODS
  // =========================================================================
  async getPayrollPeriods(status?: PayrollPeriodStatus): Promise<PayrollPeriodDto[]> {
    const res = await apiClient.get<ApiResponse<PayrollPeriodDto[]>>('/admin/payroll-periods', {
      params: { status },
    });
    return res.data.data;
  },

  async getPayrollPeriod(id: number): Promise<PayrollPeriodDto> {
    const res = await apiClient.get<ApiResponse<PayrollPeriodDto>>(`/admin/payroll-periods/${id}`);
    return res.data.data;
  },

  async createPayrollPeriod(payload: CreatePayrollPeriodPayload): Promise<PayrollPeriodDto> {
    const res = await apiClient.post<ApiResponse<PayrollPeriodDto>>('/admin/payroll-periods', payload);
    return res.data.data;
  },

  async updatePayrollPeriod(id: number, payload: UpdatePayrollPeriodPayload): Promise<PayrollPeriodDto> {
    const res = await apiClient.put<ApiResponse<PayrollPeriodDto>>(`/admin/payroll-periods/${id}`, payload);
    return res.data.data;
  },

  async previewPayrollPeriod(id: number): Promise<PayrollPeriodPreviewDto> {
    const res = await apiClient.get<ApiResponse<PayrollPeriodPreviewDto>>(
      `/admin/payroll-periods/${id}/preview`
    );
    return res.data.data;
  },

  async finalizePayrollPeriod(
    id: number,
    payload?: { expectedTotalNetSalary?: number; expectedEmployeeCount?: number }
  ): Promise<PayrollDto[]> {
    const res = await apiClient.post<ApiResponse<PayrollDto[]>>(
      `/admin/payroll-periods/${id}/finalize`,
      payload || {}
    );
    return res.data.data;
  },

  async closePayrollPeriod(id: number): Promise<PayrollPeriodDto> {
    const res = await apiClient.post<ApiResponse<PayrollPeriodDto>>(`/admin/payroll-periods/${id}/close`);
    return res.data.data;
  },

  // =========================================================================
  // ADMIN - ADJUSTMENTS
  // =========================================================================
  async getAdjustments(periodId: number, employeeId?: number): Promise<PayrollAdjustmentDto[]> {
    const res = await apiClient.get<ApiResponse<PayrollAdjustmentDto[]>>(
      `/admin/payroll-periods/${periodId}/adjustments`,
      { params: { employeeId } }
    );
    return res.data.data;
  },

  async createAdjustment(
    periodId: number,
    payload: CreatePayrollAdjustmentPayload
  ): Promise<PayrollAdjustmentDto> {
    const res = await apiClient.post<ApiResponse<PayrollAdjustmentDto>>(
      `/admin/payroll-periods/${periodId}/adjustments`,
      {
        ...payload,
        payrollPeriodId: periodId,
        name: payload.name || payload.reason,
        reason: payload.reason || payload.name,
      }
    );
    return res.data.data;
  },

  async updateAdjustment(
    periodId: number,
    id: number,
    payload: UpdatePayrollAdjustmentPayload
  ): Promise<PayrollAdjustmentDto> {
    const res = await apiClient.put<ApiResponse<PayrollAdjustmentDto>>(
      `/admin/payroll-adjustments/${id}`,
      {
        ...payload,
        name: payload.name || payload.reason,
        reason: payload.reason || payload.name,
      }
    );
    return res.data.data;
  },

  async deleteAdjustment(periodId: number, id: number): Promise<void> {
    await apiClient.delete(`/admin/payroll-adjustments/${id}`);
  },

  // =========================================================================
  // ADMIN - PAYROLLS & SUMMARY
  // =========================================================================
  async getPayrolls(params?: {
    periodId?: number;
    payrollPeriodId?: number;
    employeeId?: number;
    paymentStatus?: PaymentStatus;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<{ content: PayrollDto[]; totalElements: number; totalPages: number }> {
    const effectiveParams = {
      ...params,
      payrollPeriodId: params?.payrollPeriodId ?? params?.periodId,
      periodId: params?.periodId ?? params?.payrollPeriodId,
    };
    const res = await apiClient.get<ApiResponse<any>>('/admin/payrolls', { params: effectiveParams });
    if (res.data.data?.content) {
      return res.data.data;
    }
    return {
      content: Array.isArray(res.data.data) ? res.data.data : [],
      totalElements: Array.isArray(res.data.data) ? res.data.data.length : 0,
      totalPages: 1,
    };
  },

  async getPayroll(id: number): Promise<PayrollDto> {
    const res = await apiClient.get<ApiResponse<PayrollDto>>(`/admin/payrolls/${id}`);
    return res.data.data;
  },

  async markPayrollPaid(id: number, payload: RecordSalaryPaymentPayload): Promise<SalaryPaymentDto> {
    const res = await apiClient.post<ApiResponse<SalaryPaymentDto>>(`/admin/payrolls/${id}/mark-paid`, payload);
    return res.data.data;
  },

  async getPayrollSummary(year?: number, month?: number): Promise<PayrollSummaryDto> {
    const res = await apiClient.get<ApiResponse<PayrollSummaryDto>>('/admin/payrolls/summary', {
      params: { year, month },
    });
    return res.data.data;
  },

  // =========================================================================
  // ADMIN - SALARY PAYMENTS
  // =========================================================================
  async getAllSalaryPayments(): Promise<SalaryPaymentDto[]> {
    const res = await apiClient.get<ApiResponse<SalaryPaymentDto[]>>('/admin/salary-payments');
    return res.data.data;
  },

  async getSalaryPaymentByPayrollId(payrollId: number): Promise<SalaryPaymentDto | null> {
    const res = await apiClient.get<ApiResponse<SalaryPaymentDto>>(`/admin/salary-payments/${payrollId}`);
    return res.data.data;
  },

  // =========================================================================
  // EMPLOYEE SELF-SERVICE
  // =========================================================================
  async getMyProfile(): Promise<EmployeeDto> {
    const res = await apiClient.get<ApiResponse<EmployeeDto>>('/employee/me/profile');
    return res.data.data;
  },

  async getMyAttendance(year: number, month: number): Promise<AttendanceMonthlySummaryDto> {
    const res = await apiClient.get<ApiResponse<AttendanceMonthlySummaryDto>>('/employee/me/attendance', {
      params: { year, month },
    });
    return res.data.data;
  },

  async getMyPayrolls(): Promise<PayrollDto[]> {
    const res = await apiClient.get<ApiResponse<PayrollDto[]>>('/employee/me/payrolls');
    return res.data.data;
  },

  async getMyPayrollDetail(payrollId: number): Promise<PayrollDto> {
    const res = await apiClient.get<ApiResponse<PayrollDto>>(`/employee/me/payrolls/${payrollId}`);
    return res.data.data;
  },
};
