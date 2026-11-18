import React, { useEffect, useState } from 'react';
import {
  Users,
  Banknote,
  DollarSign,
  AlertTriangle,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { reportService } from '../../services/reportService';
import type { PayrollReportResponse, TimeSeriesPoint } from '../../services/types';
import { ReportDateFilter, type DateRange } from '../../components/ReportDateFilter';
import { extractErrorMessage } from '../../services/apiClient';

export const AdminPayrollReportPage: React.FC = () => {
  const getDefaultDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      startDate: formatDate(firstDay),
      endDate: formatDate(now),
    };
  };

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDates());
  const [loading, setLoading] = useState<boolean>(true);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [overview, setOverview] = useState<PayrollReportResponse | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<TimeSeriesPoint[]>([]);

  const loadData = async (range: DateRange) => {
    setLoading(true);
    setError('');
    try {
      const [ovRes, trendRes] = await Promise.all([
        reportService.getPayrollOverview(range),
        reportService.getPayrollMonthlyTrend(range),
      ]);

      setOverview(ovRes.data);
      setMonthlyTrends(trendRes.data || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Không thể tải báo cáo lương nhân viên'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(dateRange);
  }, [dateRange]);

  const handleExportCsv = async () => {
    try {
      setExportLoading(true);
      await reportService.downloadExportCsv('expenses', dateRange);
    } catch (err) {
      alert(extractErrorMessage(err, 'Lỗi khi xuất file CSV'));
    } finally {
      setExportLoading(false);
    }
  };

  const formatVnd = (value?: number | null) => {
    if (value === undefined || value === null) return '0 ₫';
    return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
          <Users className="h-7 w-7 text-indigo-700" /> Báo cáo chi phí tiền lương & nhân sự (C)
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">
          Theo dõi tổng quỹ lương thực lĩnh đã chốt sổ, tiến độ giải ngân chi trả lương và công nợ lương nhân viên còn tồn đọng
        </p>
      </div>

      {/* Date Filter & Export */}
      <ReportDateFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onChange={setDateRange}
        onRefresh={() => loadData(dateRange)}
        showExport={false}
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Tổng lương thực lĩnh đã chốt (C)</span>
          <div className="mt-2 text-2xl font-bold text-indigo-700 tabular-nums">
            {formatVnd(overview?.totalFinalizedNetSalary)}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            {overview?.finalizedPeriodsCount ?? 0} kỳ lương FINALIZED/CLOSED
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Tiền lương thực tế đã giải ngân</span>
          <div className="mt-2 text-2xl font-bold text-emerald-700 tabular-nums">
            {formatVnd(overview?.totalPaidSalary)}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            Đã thanh toán bằng chuyển khoản/tiền mặt
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Nợ lương còn tồn đọng</span>
          <div className="mt-2 text-2xl font-bold text-rose-700 tabular-nums">
            {formatVnd(overview?.outstandingPayrollDebt)}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            Lương đã chốt nhưng chưa giải ngân
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Nhân sự & Phúc lợi</span>
          <div className="mt-2 text-2xl font-bold text-stone-900 tabular-nums">
            {overview?.activeEmployeesCount ?? 0} <span className="text-sm font-medium text-stone-500">nhân viên</span>
          </div>
          <div className="mt-1 text-xs text-stone-500">
            Phụ cấp: {formatVnd(overview?.totalAllowances)} • Khấu trừ: {formatVnd(overview?.totalDeductions)}
          </div>
        </div>
      </div>

      {/* Monthly Payroll Trend Chart */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="text-base font-bold text-stone-900">Diễn biến quỹ lương đã chốt theo tháng</h3>
          <p className="text-xs text-stone-500">Chỉ tính các kỳ tính lương đã được quản trị viên duyệt chốt sổ chính thức</p>
        </div>

        <div className="h-72 w-full">
          {monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78716c' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(value: any) => [`${Number(value || 0).toLocaleString('vi-VN')} ₫`, 'Quỹ lương']}
                  labelFormatter={(label) => `Tháng: ${label}`}
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    color: '#ffffff',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-stone-400">
              Chưa có kỳ lương nào được chốt trong khoảng thời gian này
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
