import React, { useEffect, useState } from 'react';
import {
  PieChart as PieChartIcon,
  Calculator,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Download,
  Boxes,
  Users,
  Receipt,
  Layers,
  CheckCircle2,
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
  ReferenceLine,
} from 'recharts';
import { reportService } from '../../services/reportService';
import type { ProfitReportResponse, TimeSeriesPoint } from '../../services/types';
import { ReportDateFilter, type DateRange } from '../../components/ReportDateFilter';
import { extractErrorMessage } from '../../services/apiClient';

export const AdminProfitReportPage: React.FC = () => {
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

  const [profitData, setProfitData] = useState<ProfitReportResponse | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<TimeSeriesPoint[]>([]);

  const loadData = async (range: DateRange) => {
    setLoading(true);
    setError('');
    try {
      const [pRes, tRes] = await Promise.all([
        reportService.getProfitReport(range),
        reportService.getProfitMonthlyTrend(range),
      ]);

      setProfitData(pRes.data);
      setMonthlyTrends(tRes.data || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Không thể tải báo cáo lợi nhuận'));
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
      await reportService.downloadExportCsv('profit', dateRange);
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
          <Calculator className="h-7 w-7 text-teal-700" /> Báo cáo lợi nhuận ước tính (A - B - C - D)
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">
          Đối soát công thức tài chính chuẩn mực: Doanh thu thực thu (A) trừ Giá vốn tiêu hao (B), Chi phí lương đã chốt (C) và Chi phí vận hành khác (D)
        </p>
      </div>

      {/* Date Filter & Export */}
      <ReportDateFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onChange={setDateRange}
        onRefresh={() => loadData(dateRange)}
        onExportCsv={handleExportCsv}
        exportLoading={exportLoading}
        exportLabel="Xuất báo cáo lợi nhuận CSV"
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Financial Formula Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* A: Revenue */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">A. Doanh thu thực thu</span>
            <span className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              +
            </span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-emerald-700 tabular-nums">
            {formatVnd(profitData?.paidRevenue)}
          </div>
          <div className="mt-1 text-[11px] text-stone-500">
            Từ các đơn tiệc trạng thái PAID
          </div>
        </div>

        {/* B: Material Cost */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">B. Giá vốn NVL tiêu hao</span>
            <span className="h-6 w-6 rounded-md bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
              -
            </span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-stone-900 tabular-nums">
            {formatVnd(profitData?.materialCost)}
          </div>
          <div className="mt-1 text-[11px] text-stone-500">
            Snapshot giá vốn xuất kho
          </div>
        </div>

        {/* C: Payroll */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">C. Chi phí lương đã chốt</span>
            <span className="h-6 w-6 rounded-md bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center">
              -
            </span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-stone-900 tabular-nums">
            {formatVnd(profitData?.internalPayrollCost)}
          </div>
          <div className="mt-1 text-[11px] text-stone-500">
            Kỳ lương FINALIZED/CLOSED
          </div>
        </div>

        {/* D: Operating Expenses */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">D. Vận hành khác</span>
            <span className="h-6 w-6 rounded-md bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center">
              -
            </span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-stone-900 tabular-nums">
            {formatVnd(profitData?.operatingExpenses)}
          </div>
          <div className="mt-1 text-[11px] text-stone-500">
            Điện nước, thuê nhà, marketing...
          </div>
        </div>

        {/* Result: Estimated Net Profit */}
        <div className="bg-white rounded-2xl border-2 border-amber-300 bg-amber-50/20 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">= Lợi nhuận ước tính</span>
            <span className="h-6 w-6 rounded-md bg-amber-700 text-white font-bold text-xs flex items-center justify-center">
              =
            </span>
          </div>
          <div
            className={`mt-2 text-xl sm:text-2xl font-bold tabular-nums ${
              (profitData?.estimatedNetProfit ?? 0) >= 0 ? 'text-stone-900' : 'text-rose-700'
            }`}
          >
            {formatVnd(profitData?.estimatedNetProfit)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            <span
              className={`px-1.5 py-0.5 rounded font-bold tabular-nums ${
                (profitData?.netMargin ?? 0) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {profitData?.netMargin ?? 0}%
            </span>
            <span className="text-stone-500">biên ròng</span>
          </div>
        </div>
      </div>

      {/* Monthly Profit Chart */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="text-base font-bold text-stone-900">Biểu đồ lợi nhuận ròng theo tháng</h3>
          <p className="text-xs text-stone-500">Hỗ trợ hiển thị giá trị âm nếu chi phí trong kỳ vượt doanh thu</p>
        </div>

        <div className="h-72 w-full">
          {monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#78716c' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                />
                <ReferenceLine y={0} stroke="#78716c" strokeDasharray="3 3" />
                <Tooltip
                  formatter={(value: any) => [`${Number(value || 0).toLocaleString('vi-VN')} ₫`, 'Lợi nhuận ước tính']}
                  labelFormatter={(label) => `Tháng: ${label}`}
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    color: '#ffffff',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-stone-400">
              Chưa có dữ liệu lợi nhuận theo tháng
            </div>
          )}
        </div>
      </div>

      {/* Monthly Breakdown Reconciliation Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-stone-900">Bảng đối soát chi tiết lợi nhuận từng tháng</h3>
            <p className="text-xs text-stone-500">Bóc tách đầy đủ các thành phần doanh thu và chi phí hợp lý</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 font-semibold">
                <th className="pb-3 font-semibold">Tháng</th>
                <th className="pb-3 font-semibold text-right">Doanh thu (A)</th>
                <th className="pb-3 font-semibold text-right">Giá vốn NVL (B)</th>
                <th className="pb-3 font-semibold text-right">Lợi nhuận gộp (A-B)</th>
                <th className="pb-3 font-semibold text-right">Lương chốt (C)</th>
                <th className="pb-3 font-semibold text-right">Vận hành khác (D)</th>
                <th className="pb-3 font-semibold text-right">Lợi nhuận ước tính (A-B-C-D)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {profitData?.monthlyBreakdowns && profitData.monthlyBreakdowns.length > 0 ? (
                profitData.monthlyBreakdowns.map((row) => (
                  <tr key={row.monthKey} className="hover:bg-stone-50/50">
                    <td className="py-3 font-bold text-stone-900 tabular-nums">{row.monthKey}</td>
                    <td className="py-3 text-right font-semibold text-emerald-700 tabular-nums">
                      {formatVnd(row.revenue)}
                    </td>
                    <td className="py-3 text-right text-stone-700 tabular-nums">{formatVnd(row.cogs)}</td>
                    <td className="py-3 text-right font-semibold text-stone-900 tabular-nums">
                      {formatVnd(row.grossProfit)}
                    </td>
                    <td className="py-3 text-right text-stone-700 tabular-nums">{formatVnd(row.payroll)}</td>
                    <td className="py-3 text-right text-stone-700 tabular-nums">{formatVnd(row.expenses)}</td>
                    <td
                      className={`py-3 text-right font-bold tabular-nums ${
                        row.netProfit >= 0 ? 'text-teal-700' : 'text-rose-700'
                      }`}
                    >
                      {formatVnd(row.netProfit)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400 italic">
                    Chưa có dữ liệu đối soát lợi nhuận trong khoảng thời gian này
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
