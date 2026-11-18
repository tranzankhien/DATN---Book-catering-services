import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Boxes,
  PieChart as PieChartIcon,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Warehouse,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  Banknote,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { reportService } from '../../services/reportService';
import type {
  CostBreakdownDto,
  DashboardAlertDto,
  DashboardOverviewResponse,
  OrderStatusStatDto,
  TimeSeriesPoint,
} from '../../services/types';
import { ReportDateFilter, type DateRange } from '../../components/ReportDateFilter';
import { extractErrorMessage } from '../../services/apiClient';

const PIE_COLORS = ['#b45309', '#0284c7', '#059669', '#d97706', '#dc2626', '#6b7280'];

export const AdminDashboardPage: React.FC = () => {
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
  const [error, setError] = useState<string>('');

  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null);
  const [revenueChart, setRevenueChart] = useState<TimeSeriesPoint[]>([]);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatusStatDto[]>([]);
  const [costStructure, setCostStructure] = useState<CostBreakdownDto[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlertDto[]>([]);

  const loadData = async (range: DateRange) => {
    setLoading(true);
    setError('');
    try {
      const [ovRes, chartRes, statusRes, costRes, alertRes] = await Promise.all([
        reportService.getDashboardOverview(range),
        reportService.getRevenueChart({ ...range, groupBy: 'DAY' }),
        reportService.getOrderStatusDistribution(range),
        reportService.getCostStructure(range),
        reportService.getDashboardAlerts(),
      ]);

      setOverview(ovRes.data);
      setRevenueChart(chartRes.data || []);
      setOrderStatuses(statusRes.data || []);
      setCostStructure(costRes.data || []);
      setAlerts(alertRes.data || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Không thể tải dữ liệu Dashboard'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(dateRange);
  }, [dateRange]);

  const formatVnd = (value?: number | null) => {
    if (value === undefined || value === null) return '0 ₫';
    return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <TrendingUp className="h-7 w-7 text-amber-700" /> Bảng điều khiển kinh doanh & tài chính
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Tổng quan hiệu quả hoạt động, doanh thu thực thu, giá vốn tiêu hao và lợi nhuận ước tính của cơ sở yến tiệc
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/reports/profit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-xs font-semibold text-white shadow-xs transition-colors"
          >
            <PieChartIcon className="h-4 w-4" />
            <span>Đối soát lợi nhuận A-B-C-D</span>
          </Link>
          <Link
            to="/admin/reports/cashflow"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 shadow-xs transition-colors"
          >
            <Activity className="h-4 w-4" />
            <span>Dòng tiền mô phỏng</span>
          </Link>
        </div>
      </div>

      {/* Date Filter */}
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

      {/* 8 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Đơn đặt tiệc */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Tổng đơn đặt tiệc</span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums">
              {overview?.totalOrders ?? 0} <span className="text-sm font-medium text-stone-500">đơn</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-stone-500">
              {overview?.ordersGrowthPct !== null && overview?.ordersGrowthPct !== undefined ? (
                overview.ordersGrowthPct >= 0 ? (
                  <span className="text-emerald-700 font-semibold flex items-center tabular-nums">
                    <ArrowUpRight className="h-3.5 w-3.5" /> +{overview.ordersGrowthPct}%
                  </span>
                ) : (
                  <span className="text-rose-700 font-semibold flex items-center tabular-nums">
                    <ArrowDownRight className="h-3.5 w-3.5" /> {overview.ordersGrowthPct}%
                  </span>
                )
              ) : (
                <span className="text-stone-400">Không có kỳ trước</span>
              )}
              <span className="text-stone-400">so với cùng kỳ</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Doanh thu thực thu */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Doanh thu đã thanh toán</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums">
              {formatVnd(overview?.paidRevenue)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-stone-500">
              {overview?.revenueGrowthPct !== null && overview?.revenueGrowthPct !== undefined ? (
                overview.revenueGrowthPct >= 0 ? (
                  <span className="text-emerald-700 font-semibold flex items-center tabular-nums">
                    <ArrowUpRight className="h-3.5 w-3.5" /> +{overview.revenueGrowthPct}%
                  </span>
                ) : (
                  <span className="text-rose-700 font-semibold flex items-center tabular-nums">
                    <ArrowDownRight className="h-3.5 w-3.5" /> {overview.revenueGrowthPct}%
                  </span>
                )
              ) : (
                <span className="text-stone-400">Không có kỳ trước</span>
              )}
              <span className="text-stone-400">chỉ tính đơn PAID</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Giá vốn tiêu hao (COGS) */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Giá vốn NVL tiêu hao (B)</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums">
              {formatVnd(overview?.materialCost)}
            </div>
            <div className="mt-1 text-xs text-stone-500">
              Snapshot giá vốn xuất kho theo tiệc
            </div>
          </div>
        </div>

        {/* KPI 4: Lợi nhuận gộp */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Lợi nhuận gộp (A - B)</span>
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums">
              {formatVnd(overview?.grossProfit)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 font-semibold tabular-nums">
                Biên: {overview?.grossMargin ?? 0}%
              </span>
              <span className="text-stone-400">trên doanh thu</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Chi phí lương nội bộ */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Lương nội bộ chốt số (C)</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums">
              {formatVnd(overview?.internalPayrollCost)}
            </div>
            <div className="mt-1 text-xs text-stone-500">
              Kỳ lương đã chốt FINALIZED / CLOSED
            </div>
          </div>
        </div>

        {/* KPI 6: Chi phí vận hành khác */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Chi phí vận hành khác (D)</span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums">
              {formatVnd(overview?.operatingExpenses)}
            </div>
            <div className="mt-1 text-xs text-stone-500">
              Điện nước, mặt bằng, sửa chữa, marketing...
            </div>
          </div>
        </div>

        {/* KPI 7: Lợi nhuận ước tính A - B - C - D */}
        <div className="bg-white rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/40 via-white to-white p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Lợi nhuận ước tính (A-B-C-D)</span>
            <div className="h-9 w-9 rounded-xl bg-amber-700 text-white flex items-center justify-center shadow-xs">
              <PieChartIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl sm:text-3xl font-bold tabular-nums ${
                (overview?.estimatedNetProfit ?? 0) >= 0 ? 'text-stone-900' : 'text-rose-700'
              }`}
            >
              {formatVnd(overview?.estimatedNetProfit)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span
                className={`px-2 py-0.5 rounded-md font-semibold tabular-nums ${
                  (overview?.netMargin ?? 0) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                Tỷ suất: {overview?.netMargin ?? 0}%
              </span>
              <span className="text-stone-500">sau khi trừ 3 loại chi phí</span>
            </div>
          </div>
        </div>

        {/* KPI 8: Giá trị đơn trung bình (AOV) */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Giá trị đơn TB (AOV)</span>
            <div className="h-9 w-9 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center">
              <Banknote className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums">
              {formatVnd(overview?.averageOrderValue)}
            </div>
            <div className="mt-1 text-xs text-stone-500">
              Doanh thu đã thu / số đơn đã thanh toán
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Operational Balance Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-stone-200 bg-white p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-stone-500">Định giá kho tồn hiện tại</p>
            <p className="text-base font-bold text-stone-900 tabular-nums">
              {formatVnd(overview?.estimatedInventoryValuation)}
            </p>
          </div>
          <Link
            to="/admin/reports/inventory"
            className="text-stone-400 hover:text-amber-700 p-1.5 rounded-lg hover:bg-stone-50"
            title="Xem báo cáo kho"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-stone-500">Cảnh báo tồn dưới mức an toàn</p>
            <p className="text-base font-bold text-amber-700 tabular-nums">
              {overview?.lowStockCount ?? 0} nguyên liệu
            </p>
          </div>
          <Link
            to="/admin/inventory/ingredients"
            className="text-stone-400 hover:text-amber-700 p-1.5 rounded-lg hover:bg-stone-50"
            title="Xem danh mục nguyên liệu"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-stone-500">Công nợ nhà cung cấp còn nợ</p>
            <p className="text-base font-bold text-rose-700 tabular-nums">
              {formatVnd(overview?.outstandingSupplierDebt)}
            </p>
          </div>
          <Link
            to="/admin/inventory/receipts"
            className="text-stone-400 hover:text-amber-700 p-1.5 rounded-lg hover:bg-stone-50"
            title="Xem phiếu nhập hàng"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-stone-500">Lương nhân viên chưa thanh toán</p>
            <p className="text-base font-bold text-indigo-700 tabular-nums">
              {formatVnd(overview?.unpaidPayrollDebt)}
            </p>
          </div>
          <Link
            to="/admin/payrolls"
            className="text-stone-400 hover:text-amber-700 p-1.5 rounded-lg hover:bg-stone-50"
            title="Xem bảng lương nhân viên"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Alerts Section (If any) */}
      {alerts.length > 0 && (
        <div className="bg-amber-50/60 rounded-2xl border border-amber-200/80 p-4">
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2 mb-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-700" /> Cảnh báo vận hành cần lưu ý ({alerts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.map((alt, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-amber-200/60 p-3 shadow-xs flex items-start justify-between gap-3"
              >
                <div>
                  <p className="text-xs font-bold text-stone-900">{alt.title}</p>
                  <p className="text-[11px] text-stone-600 mt-0.5">{alt.message}</p>
                </div>
                {alt.actionUrl && (
                  <Link
                    to={alt.actionUrl}
                    className="shrink-0 text-xs font-semibold text-amber-700 hover:text-amber-800 underline"
                  >
                    Xem
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section: Revenue Area Chart (8 cols) & Cost Breakdown Donut (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">Diễn biến doanh thu theo ngày</h3>
              <p className="text-xs text-stone-500">Chỉ thống kê các đơn đặt tiệc có trạng thái thanh toán PAID</p>
            </div>
            <Link
              to="/admin/reports/revenue"
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              Xem báo cáo chi tiết <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="h-72 w-full">
            {revenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b45309" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#b45309" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
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
                    formatter={(value: any) => [`${Number(value || 0).toLocaleString('vi-VN')} ₫`, 'Doanh thu']}
                    labelFormatter={(label) => `Ngày: ${label}`}
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      color: '#ffffff',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#b45309"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-stone-400">
                Chưa có dữ liệu doanh thu trong khoảng thời gian này
              </div>
            )}
          </div>
        </div>

        {/* Cost Structure Donut Chart */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-stone-900">Cơ cấu chi phí trong kỳ</h3>
            <p className="text-xs text-stone-500">Tỷ lệ giá vốn NVL, lương nội bộ và chi phí vận hành khác</p>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {costStructure.length > 0 && costStructure.some((c) => c.amount > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costStructure}
                    dataKey="amount"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {costStructure.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${Number(value || 0).toLocaleString('vi-VN')} ₫`, 'Chi phí']}
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      color: '#ffffff',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-stone-700">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-stone-400 text-center">
                Chưa ghi nhận chi phí nào trong khoảng thời gian này
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-stone-100 space-y-1.5">
            {costStructure.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-stone-600 flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full inline-block"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  {c.label}
                </span>
                <span className="font-semibold text-stone-900 tabular-nums">
                  {formatVnd(c.amount)} ({c.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Quick Links Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            title: 'Báo cáo Doanh thu',
            desc: 'AOV & Đơn thanh toán',
            link: '/admin/reports/revenue',
            icon: DollarSign,
            color: 'text-emerald-700 bg-emerald-50',
          },
          {
            title: 'Kho & Giá vốn',
            desc: 'Định giá tồn & COGS',
            link: '/admin/reports/inventory',
            icon: Warehouse,
            color: 'text-amber-700 bg-amber-50',
          },
          {
            title: 'Chi phí vận hành',
            desc: 'Quản lý chi phí ngoài NVL',
            link: '/admin/expenses',
            icon: Receipt,
            color: 'text-purple-700 bg-purple-50',
          },
          {
            title: 'Báo cáo Lương',
            desc: 'Lương chốt & giải ngân',
            link: '/admin/reports/payroll',
            icon: Users,
            color: 'text-indigo-700 bg-indigo-50',
          },
          {
            title: 'Báo cáo Lợi nhuận',
            desc: 'Công thức A - B - C - D',
            link: '/admin/reports/profit',
            icon: PieChartIcon,
            color: 'text-teal-700 bg-teal-50',
          },
          {
            title: 'Dòng tiền mô phỏng',
            desc: 'Thu - Chi thực tế',
            link: '/admin/reports/cashflow',
            icon: Activity,
            color: 'text-blue-700 bg-blue-50',
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link
              key={idx}
              to={item.link}
              className="group bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className={`h-8 w-8 rounded-xl ${item.color} flex items-center justify-center`}>
                  <Icon className="h-4 w-4" />
                </div>
                <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                  {item.title}
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">{item.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
