import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { reportService } from '../../services/reportService';
import type {
  PaidOrderReportDto,
  RevenueSummaryResponse,
  TimeSeriesPoint,
  TopDishReportDto,
} from '../../services/types';
import { ReportDateFilter, type DateRange } from '../../components/ReportDateFilter';
import { extractErrorMessage } from '../../services/apiClient';

export const AdminRevenueReportPage: React.FC = () => {
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
  const [groupBy, setGroupBy] = useState<'DAY' | 'WEEK' | 'MONTH'>('DAY');
  const [loading, setLoading] = useState<boolean>(true);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [summary, setSummary] = useState<RevenueSummaryResponse | null>(null);
  const [trends, setTrends] = useState<TimeSeriesPoint[]>([]);
  const [topDishes, setTopDishes] = useState<TopDishReportDto[]>([]);
  const [ordersPage, setOrdersPage] = useState<{
    content: PaidOrderReportDto[];
    totalElements: number;
    totalPages: number;
    number: number;
  }>({ content: [], totalElements: 0, totalPages: 0, number: 0 });
  const [page, setPage] = useState<number>(0);

  const loadData = async (range: DateRange, pageIndex = 0, currentGroupBy = groupBy) => {
    setLoading(true);
    setError('');
    try {
      const [sumRes, trendRes, dishesRes, ordersRes] = await Promise.all([
        reportService.getRevenueSummary(range),
        reportService.getRevenueTrend({ ...range, groupBy: currentGroupBy }),
        reportService.getTopDishes({ ...range, limit: 10 }),
        reportService.getPaidOrders({ ...range, page: pageIndex, size: 10 }),
      ]);

      setSummary(sumRes.data);
      setTrends(trendRes.data || []);
      setTopDishes(dishesRes.data || []);
      setOrdersPage(ordersRes.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Không thể tải báo cáo doanh thu'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    loadData(dateRange, 0, groupBy);
  }, [dateRange, groupBy]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadData(dateRange, newPage, groupBy);
  };

  const handleExportCsv = async () => {
    try {
      setExportLoading(true);
      await reportService.downloadExportCsv('revenue', dateRange);
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
          <DollarSign className="h-7 w-7 text-emerald-700" /> Báo cáo phân tích doanh thu
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">
          Báo cáo doanh thu thực thu từ các đơn đặt tiệc đã thanh toán thành công (PAID) qua chuyển khoản ngân hàng hoặc VNPAY
        </p>
      </div>

      {/* Date Filter & Export */}
      <ReportDateFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onChange={setDateRange}
        onRefresh={() => loadData(dateRange, page, groupBy)}
        onExportCsv={handleExportCsv}
        exportLoading={exportLoading}
        exportLabel="Xuất báo cáo doanh thu CSV"
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Doanh thu đã thanh toán</span>
          <div className="mt-2 text-2xl font-bold text-emerald-700 tabular-nums">
            {formatVnd(summary?.paidRevenue)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-stone-500">
            {summary?.revenueGrowthPct !== null && summary?.revenueGrowthPct !== undefined ? (
              summary.revenueGrowthPct >= 0 ? (
                <span className="text-emerald-700 font-semibold flex items-center tabular-nums">
                  <ArrowUpRight className="h-3.5 w-3.5" /> +{summary.revenueGrowthPct}%
                </span>
              ) : (
                <span className="text-rose-700 font-semibold flex items-center tabular-nums">
                  <ArrowDownRight className="h-3.5 w-3.5" /> {summary.revenueGrowthPct}%
                </span>
              )
            ) : (
              <span className="text-stone-400">Không có kỳ trước</span>
            )}
            <span className="text-stone-400">so với kỳ trước</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Số đơn đã thanh toán</span>
          <div className="mt-2 text-2xl font-bold text-stone-900 tabular-nums">
            {summary?.paidOrdersCount ?? 0} <span className="text-sm font-medium text-stone-500">đơn</span>
          </div>
          <div className="mt-1 text-xs text-stone-500">
            Chỉ tính đơn trạng thái PAID
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Giá trị trung bình/đơn (AOV)</span>
          <div className="mt-2 text-2xl font-bold text-stone-900 tabular-nums">
            {formatVnd(summary?.averageOrderValue)}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            Doanh thu / số đơn đã thanh toán
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Doanh thu kỳ trước</span>
          <div className="mt-2 text-2xl font-bold text-stone-600 tabular-nums">
            {formatVnd(summary?.previousPeriodRevenue)}
          </div>
          <div className="mt-1 text-xs text-stone-400">
            Cùng khoảng thời gian trước đó
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900">Biểu đồ doanh thu thực tế</h3>
            <p className="text-xs text-stone-500">Theo dõi dòng doanh thu theo từng chu kỳ</p>
          </div>
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            {(['DAY', 'WEEK', 'MONTH'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroupBy(g)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  groupBy === g ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {g === 'DAY' ? 'Theo ngày' : g === 'WEEK' ? 'Theo tuần' : 'Theo tháng'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full">
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
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
                  labelFormatter={(label) => `Thời gian: ${label}`}
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    color: '#ffffff',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-stone-400">
              Chưa có dữ liệu doanh thu trong khoảng thời gian này
            </div>
          )}
        </div>
      </div>

      {/* Top Dishes & Order Detail Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Dishes Table (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-600" /> Top món bán chạy nhất
                </h3>
                <p className="text-xs text-stone-500">Xếp hạng theo tổng số phần bán ra (nhân số bàn)</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-semibold">
                    <th className="pb-2.5 font-semibold"># Món ăn</th>
                    <th className="pb-2.5 font-semibold text-center">Số phần</th>
                    <th className="pb-2.5 font-semibold text-right">Doanh thu món</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {topDishes.length > 0 ? (
                    topDishes.map((dish, idx) => (
                      <tr key={dish.dishId} className="hover:bg-stone-50/50">
                        <td className="py-2.5 pr-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                idx === 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : idx === 1
                                  ? 'bg-stone-200 text-stone-800'
                                  : idx === 2
                                  ? 'bg-amber-50 text-amber-900'
                                  : 'text-stone-400'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-stone-900 truncate">{dish.dishName}</p>
                              <p className="text-[10px] text-stone-400">{dish.categoryName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 text-center font-bold text-stone-800 tabular-nums">
                          {dish.totalPortionsSold}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-stone-900 tabular-nums">
                          {formatVnd(dish.totalRevenue)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-stone-400 italic">
                        Chưa có dữ liệu món bán trong kỳ này
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Paid Orders Table with COGS Snapshot (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">Chi tiết đơn đặt tiệc đã thanh toán</h3>
                <p className="text-xs text-stone-500">Đối soát Doanh thu, Giá vốn snapshot và Lợi nhuận gộp từng đơn</p>
              </div>
              <span className="text-xs font-semibold text-stone-500 tabular-nums">
                Tổng: {ordersPage.totalElements} đơn
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-semibold">
                    <th className="pb-2.5 font-semibold">Mã đơn / Khách</th>
                    <th className="pb-2.5 font-semibold text-center">Bàn</th>
                    <th className="pb-2.5 font-semibold text-right">Doanh thu</th>
                    <th className="pb-2.5 font-semibold text-right">Giá vốn (B)</th>
                    <th className="pb-2.5 font-semibold text-right">Lợi nhuận gộp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {ordersPage.content.length > 0 ? (
                    ordersPage.content.map((ord) => (
                      <tr key={ord.orderId} className="hover:bg-stone-50/50">
                        <td className="py-2.5 pr-2">
                          <p className="font-bold text-stone-900 tabular-nums">{ord.orderCode}</p>
                          <p className="text-[11px] text-stone-500 truncate">
                            {ord.customerName} • {ord.paidAt ? ord.paidAt.substring(0, 10) : ''}
                          </p>
                        </td>
                        <td className="py-2.5 text-center font-medium text-stone-700 tabular-nums">
                          {ord.tableCount}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-emerald-700 tabular-nums">
                          {formatVnd(ord.totalAmount)}
                        </td>
                        <td className="py-2.5 text-right font-medium text-stone-600 tabular-nums">
                          {formatVnd(ord.materialCost)}
                        </td>
                        <td className="py-2.5 text-right font-bold text-stone-900 tabular-nums">
                          <div>{formatVnd(ord.grossProfit)}</div>
                          <span className="text-[10px] text-stone-500 font-normal">
                            ({ord.grossMargin}%)
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400 italic">
                        Không có đơn hàng nào trong khoảng thời gian này
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {ordersPage.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-3 text-xs">
              <span className="text-stone-500">
                Trang <span className="font-semibold text-stone-900 tabular-nums">{page + 1}</span> /{' '}
                <span className="tabular-nums">{ordersPage.totalPages}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => handlePageChange(page - 1)}
                  className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 text-stone-700 font-semibold cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={page + 1 >= ordersPage.totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 text-stone-700 font-semibold cursor-pointer"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
