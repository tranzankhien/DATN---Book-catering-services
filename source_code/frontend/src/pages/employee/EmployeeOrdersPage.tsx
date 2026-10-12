import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChefHat,
  Calendar,
  Clock,
  Eye,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock4,
  XCircle,
  Filter,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import type { OrderDto, OrderStatus } from '../../services/types';
import { formatDateTimeVn } from '../../hooks/useFormatters';
import { LoadingState, ErrorState } from '../../components/StatusStates';
import { extractErrorMessage } from '../../services/apiClient';

export const EmployeeOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await orderService.getEmployeeOrders({
        orderStatus: statusFilter || undefined,
        fromDate: fromDate ? `${fromDate}T00:00:00+07:00` : undefined,
        toDate: toDate ? `${toDate}T23:59:59+07:00` : undefined,
        page,
        size: 10,
      });
      setOrders(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, fromDate, toDate, page]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up-1">
      {/* Header Banner */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
              <ChefHat className="h-3.5 w-3.5 text-amber-600" />
              <span>Phân hệ điều phối bếp & Chuẩn bị tiệc</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Lịch đặt tiệc bếp & Điều phối
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Theo dõi lịch biểu các buổi tiệc sắp diễn ra để chuẩn bị định mức số lượng phần nấu và nguyên vật liệu xuất kho kịp thời.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors shadow-xs cursor-pointer shrink-0"
            title="Làm mới lịch tiệc"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as OrderStatus | '');
            setPage(0);
          }}
          className="px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-white font-medium text-stone-700 focus:outline-none focus:border-amber-600 shadow-xs"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PAID">Đã thanh toán (PAID)</option>
          <option value="PROCESSING">Đang chuẩn bị (PROCESSING)</option>
          <option value="PENDING_PAYMENT">Chờ thanh toán (PENDING_PAYMENT)</option>
          <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
        </select>

        <input
          type="date"
          placeholder="Từ ngày"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setPage(0);
          }}
          className="px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-white font-mono text-stone-700 focus:outline-none focus:border-amber-600 shadow-xs"
        />

        <input
          type="date"
          placeholder="Đến ngày"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setPage(0);
          }}
          className="px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-white font-mono text-stone-700 focus:outline-none focus:border-amber-600 shadow-xs"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Mã đơn</th>
                <th className="py-3.5 px-4">Thời gian tổ chức</th>
                <th className="py-3.5 px-4">Khách hàng</th>
                <th className="py-3.5 px-4 text-center">Quy mô</th>
                <th className="py-3.5 px-4">Thực đơn áp dụng</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-stone-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-600 mb-2" />
                    <span className="font-medium">Đang tải lịch đặt tiệc bếp...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-stone-400">
                    <Calendar className="h-8 w-8 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-600 text-sm">Không có tiệc nào trong khoảng thời gian này</p>
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr
                    key={ord.id}
                    className="hover:bg-amber-50/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/employee/orders/${ord.id}`)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900 bg-stone-50/40 whitespace-nowrap">
                      {ord.orderCode}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900 whitespace-nowrap">
                      {formatDateTimeVn(ord.eventDateTime)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                        {ord.customerName}
                      </div>
                      <div className="text-[11px] font-mono text-stone-400">
                        {ord.customerPhone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-stone-800 whitespace-nowrap">
                      {ord.tableCount} bàn
                    </td>
                    <td className="py-3.5 px-4 text-stone-700 truncate max-w-xs">
                      {ord.menuNameSnapshot || 'Thực đơn tự chọn'} ({ord.items.length} món)
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          ord.orderStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : ord.orderStatus === 'PROCESSING'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : ord.orderStatus === 'PENDING_PAYMENT'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/employee/orders/${ord.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 hover:bg-amber-50 hover:text-amber-900 text-stone-600 px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Chi tiết bếp</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 flex justify-center items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3.5 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-700 disabled:opacity-40 hover:bg-stone-50 shadow-xs transition-colors"
            >
              Trang trước
            </button>
            <span className="px-3 py-1.5 text-xs text-stone-500 font-medium">
              Trang {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-3.5 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-700 disabled:opacity-40 hover:bg-stone-50 shadow-xs transition-colors"
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
