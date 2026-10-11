import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Clock,
  ArrowRight,
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock4,
  AlertCircle,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import type { OrderDto, OrderStatus, PaymentStatus } from '../../services/types';
import { formatVnd, formatDateTimeVn } from '../../hooks/useFormatters';
import { LoadingState, ErrorState } from '../../components/StatusStates';
import { extractErrorMessage } from '../../services/apiClient';

export const AdminOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [keyword, setKeyword] = useState<string>('');
  const [orderStatus, setOrderStatus] = useState<OrderStatus | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await orderService.getAdminOrders({
        keyword: keyword.trim() || undefined,
        orderStatus: orderStatus || undefined,
        paymentStatus: paymentStatus || undefined,
        fromDate: fromDate ? `${fromDate}T00:00:00+07:00` : undefined,
        toDate: toDate ? `${toDate}T23:59:59+07:00` : undefined,
        page,
        size: 10,
      });
      setOrders(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [keyword, orderStatus, paymentStatus, fromDate, toDate, page]);

  const getOrderStatusBadge = (st: OrderStatus) => {
    switch (st) {
      case 'PENDING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock4 className="w-3 h-3" /> Chờ TT
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> Đã TT
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <RefreshCw className="w-3 h-3" /> Đang chuẩn bị
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-300">
            <CheckCircle2 className="w-3 h-3" /> Hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3" /> Đã hủy
          </span>
        );
      default:
        return <span>{st}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Quản Lý Đơn Đặt Tiệc
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Tổng quan và xử lý toàn bộ hợp đồng đặt tiệc, tình trạng thanh toán và nguyên liệu.
          </p>
        </div>

        <div className="text-xs font-semibold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
          Tổng số: <span className="text-amber-800 font-bold">{totalElements}</span> đơn tiệc
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Mã đơn, tên hoặc SĐT khách..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <select
            value={orderStatus}
            onChange={(e) => {
              setOrderStatus(e.target.value as OrderStatus | '');
              setPage(0);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            <option value="">Tất cả trạng thái đơn</option>
            <option value="PENDING_PAYMENT">Chờ thanh toán (PENDING_PAYMENT)</option>
            <option value="PAID">Đã thanh toán (PAID)</option>
            <option value="PROCESSING">Đang chuẩn bị (PROCESSING)</option>
            <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>

          <input
            type="date"
            placeholder="Từ ngày"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />

          <input
            type="date"
            placeholder="Đến ngày"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
        </div>
      </div>

      {/* Orders Table */}
      {loading && <LoadingState message="Đang tải danh sách đơn đặt tiệc..." />}
      {error && <ErrorState message={error} onRetry={fetchOrders} />}

      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Ngày tổ chức</th>
                  <th className="py-3 px-4">Bàn</th>
                  <th className="py-3 px-4">Tổng tiền</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      Không có đơn đặt tiệc nào phù hợp điều kiện lọc.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-800">
                        {ord.orderCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900">{ord.customerName}</div>
                        <div className="text-[11px] text-stone-400">{ord.customerPhone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-700">
                        {formatDateTimeVn(ord.eventDateTime)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-stone-800">
                        {ord.tableCount} bàn
                      </td>
                      <td className="py-3.5 px-4 font-serif font-bold text-stone-900 text-sm">
                        {formatVnd(ord.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">{getOrderStatusBadge(ord.orderStatus)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/admin/orders/${ord.id}`}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-amber-50 hover:text-amber-800 text-stone-600 transition-colors inline-flex items-center gap-1 font-medium"
                        >
                          <Eye className="w-3 h-3" /> Chi tiết
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
