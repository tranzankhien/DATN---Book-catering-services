import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  AlertTriangle,
  Download,
  Info,
  Truck,
  Users,
  Receipt,
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
} from 'recharts';
import { reportService } from '../../services/reportService';
import type { CashFlowReportResponse } from '../../services/types';
import { ReportDateFilter, type DateRange } from '../../components/ReportDateFilter';
import { extractErrorMessage } from '../../services/apiClient';

export const AdminCashFlowReportPage: React.FC = () => {
  const getDefaultDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
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

  const [cashFlow, setCashFlow] = useState<CashFlowReportResponse | null>(null);

  const loadData = async (range: DateRange) => {
    setLoading(true);
    setError('');
    try {
      const res = await reportService.getCashFlowReport(range);
      setCashFlow(res.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Không thể tải báo cáo dòng tiền'));
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
      await reportService.downloadExportCsv('cash-flow', dateRange);
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
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <Activity className="h-7 w-7 text-blue-700" /> Báo cáo tổng quan dòng tiền (Cash Flow)
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            Thực nghiệm
          </span>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">
          Theo dõi dòng tiền vào thực thu (giao dịch thanh toán thành công) và dòng tiền ra thực chi (trả NCC, giải ngân lương, thanh toán chi phí vận hành)
        </p>
      </div>

      {/* Distinction Alert Banner */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-blue-950">Nguyên tắc phân biệt Dòng tiền vs Lợi nhuận:</p>
          <p className="text-blue-800 leading-relaxed">
            • <strong>Lợi nhuận</strong> sử dụng <em>Giá vốn tiêu hao (COGS)</em> của các món ăn trong đơn tiệc theo ngày ghi nhận doanh thu phát sinh.
            <br />
            • <strong>Dòng tiền</strong> chỉ ghi nhận <em>Tiền thực tế đã thanh toán cho Nhà cung cấp</em> tại ngày chi trả (không phân bổ theo ngày ăn tiệc).
          </p>
        </div>
      </div>

      {/* Date Filter & Export */}
      <ReportDateFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onChange={setDateRange}
        onRefresh={() => loadData(dateRange)}
        onExportCsv={handleExportCsv}
        exportLoading={exportLoading}
        exportLabel="Xuất báo cáo dòng tiền CSV"
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3 Large KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Inflow */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Tổng dòng tiền thu (Inflows)</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-emerald-700 tabular-nums">
            {formatVnd(cashFlow?.inflows)}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            Từ giao dịch thanh toán SUCCESS của khách
          </div>
        </div>

        {/* Outflow */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Tổng dòng tiền chi (Outflows)</span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-rose-700 tabular-nums">
            {formatVnd(cashFlow?.outflows)}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            Thực tế trả NCC + Lương + Vận hành
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="bg-white rounded-2xl border-2 border-stone-300 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">Dòng tiền thuần (Net Cash Flow)</span>
            <div className="h-8 w-8 rounded-xl bg-stone-900 text-white flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div
            className={`mt-3 text-3xl font-bold tabular-nums ${
              (cashFlow?.netCashFlow ?? 0) >= 0 ? 'text-stone-900' : 'text-rose-700'
            }`}
          >
            {formatVnd(cashFlow?.netCashFlow)}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            = Dòng tiền thu - Dòng tiền chi
          </div>
        </div>
      </div>

      {/* Outflows Breakdown & Unpaid Debt Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outflows Breakdown (3 categories) */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-stone-900">Chi tiết dòng tiền chi thực tế đã xuất quỹ</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
              <div className="flex items-center gap-2.5">
                <Truck className="h-5 w-5 text-amber-700" />
                <div>
                  <p className="text-xs font-bold text-stone-900">Chi trả Nhà cung cấp nguyên liệu</p>
                  <p className="text-[11px] text-stone-500">Thanh toán các phiếu nhập kho</p>
                </div>
              </div>
              <span className="text-sm font-bold text-stone-900 tabular-nums">
                {formatVnd(cashFlow?.supplierPayments)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
              <div className="flex items-center gap-2.5">
                <Users className="h-5 w-5 text-indigo-700" />
                <div>
                  <p className="text-xs font-bold text-stone-900">Chi trả Lương nhân viên</p>
                  <p className="text-[11px] text-stone-500">Giải ngân lương tiền mặt / chuyển khoản</p>
                </div>
              </div>
              <span className="text-sm font-bold text-stone-900 tabular-nums">
                {formatVnd(cashFlow?.salaryPayments)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
              <div className="flex items-center gap-2.5">
                <Receipt className="h-5 w-5 text-purple-700" />
                <div>
                  <p className="text-xs font-bold text-stone-900">Chi phí vận hành khác đã thanh toán</p>
                  <p className="text-[11px] text-stone-500">Điện nước, thuê nhà, marketing đã trả</p>
                </div>
              </div>
              <span className="text-sm font-bold text-stone-900 tabular-nums">
                {formatVnd(cashFlow?.paidOperatingExpenses)}
              </span>
            </div>
          </div>
        </div>

        {/* Unpaid Debt Breakdown */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-stone-900">Công nợ phải trả còn tồn đọng (Chưa chi)</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
              <div>
                <p className="text-xs font-bold text-stone-900">Công nợ Nhà cung cấp</p>
                <p className="text-[11px] text-stone-500">Phiếu nhập kho chưa thanh toán</p>
              </div>
              <span className="text-sm font-bold text-rose-700 tabular-nums">
                {formatVnd(cashFlow?.unpaidSupplierDebt)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
              <div>
                <p className="text-xs font-bold text-stone-900">Nợ lương nhân viên</p>
                <p className="text-[11px] text-stone-500">Kỳ lương đã chốt nhưng chưa giải ngân</p>
              </div>
              <span className="text-sm font-bold text-amber-700 tabular-nums">
                {formatVnd(cashFlow?.unpaidSalaryDebt)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
              <div>
                <p className="text-xs font-bold text-stone-900">Chi phí vận hành chưa thanh toán</p>
                <p className="text-[11px] text-stone-500">Khoản chi phát sinh trạng thái UNPAID</p>
              </div>
              <span className="text-sm font-bold text-purple-700 tabular-nums">
                {formatVnd(cashFlow?.unpaidOperatingExpenses)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Cash Flow Bar Chart */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="text-base font-bold text-stone-900">Diễn biến Dòng tiền Thu vs Dòng tiền Chi theo ngày</h3>
          <p className="text-xs text-stone-500">Màu xanh: Tiền thu vào • Màu đỏ: Tiền chi ra</p>
        </div>

        <div className="h-72 w-full">
          {cashFlow?.dailyPoints && cashFlow.dailyPoints.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlow.dailyPoints} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickFormatter={(val) => {
                    if (!val) return '';
                    const parts = val.split('-');
                    return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : val;
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${Number(value || 0).toLocaleString('vi-VN')} ₫`,
                    name === 'value' ? 'Tiền thu (Inflow)' : 'Tiền chi (Outflow)',
                  ]}
                  labelFormatter={(label) => `Ngày: ${label}`}
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    color: '#ffffff',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-stone-700">
                      {value === 'value' ? 'Tiền thu vào (Inflow)' : 'Tiền chi ra (Outflow)'}
                    </span>
                  )}
                />
                <Bar dataKey="value" name="value" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="secondaryValue" name="secondaryValue" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-stone-400">
              Chưa có dữ liệu dòng tiền trong khoảng thời gian này
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
