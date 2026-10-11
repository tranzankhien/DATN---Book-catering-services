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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-amber-600" />
            Lịch Đặt Tiệc Bếp & Điều Phối
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Theo dõi danh sách các buổi tiệc sắp diễn ra để chuẩn bị thực đơn và nguyên vật liệu bếp.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 font-medium bg-white px-3 py-2 rounded-xl border border-stone-200 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as OrderStatus | '');
            setPage(0);
          }}
          className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-amber-500"
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
          className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white"
        />

        <input
          type="date"
          placeholder="Đến ngày"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white"
        />
      </div>

      {/* Orders List */}
      {loading && <LoadingState message="Đang tải lịch đặt tiệc..." />}
      {error && <ErrorState message={error} onRetry={fetchOrders} />}

      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Thời gian tiệc</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Quy mô</th>
                  <th className="py-3 px-4">Thực đơn</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      Không có tiệc nào trong khoảng thời gian này.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-800">
                        {ord.orderCode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-stone-900">
                        {formatDateTimeVn(ord.eventDateTime)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900">{ord.customerName}</div>
                        <div className="text-[11px] text-stone-400">{ord.customerPhone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-stone-800">
                        {ord.tableCount} bàn
                      </td>
                      <td className="py-3.5 px-4 text-stone-700 truncate max-w-xs">
                        {ord.menuNameSnapshot || 'Thực đơn tự chọn'} ({ord.items.length} món)
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.orderStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.orderStatus === 'PROCESSING'
                              ? 'bg-blue-100 text-blue-800'
                              : ord.orderStatus === 'PENDING_PAYMENT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/employee/orders/${ord.id}`}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-amber-50 hover:text-amber-800 text-stone-600 transition-colors inline-flex items-center gap-1 font-medium"
                        >
                          <Eye className="w-3 h-3" /> Chi tiết bếp
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-stone-100 flex justify-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1 rounded-lg border border-stone-200 text-xs disabled:opacity-40"
              >
                Trang trước
              </button>
              <span className="px-3 py-1 text-xs text-stone-500">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg border border-stone-200 text-xs disabled:opacity-40"
              >
                Trang sau
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
