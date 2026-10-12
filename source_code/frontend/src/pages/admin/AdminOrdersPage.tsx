import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
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
  X,
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock4 className="h-3 w-3 text-amber-600" />
            <span>Chờ thanh toán (15p)</span>
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Đã thanh toán</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <RefreshCw className="h-3 w-3 text-blue-600 animate-spin" />
            <span>Đang chuẩn bị tiệc</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
            <CheckCircle2 className="h-3 w-3 text-stone-600" />
            <span>Hoàn thành</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="h-3 w-3 text-rose-600" />
            <span>Đã hủy</span>
          </span>
        );
      default:
        return <span>{st}</span>;
    }
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-8 animate-fade-up-1">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
            <ClipboardList className="h-4 w-4" />
            <span>Phân hệ quản lý đơn đặt tiệc</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight mt-1">
            Quản lý đơn đặt tiệc
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Theo dõi, xử lý và giám sát trạng thái hợp đồng tiệc, thanh toán và lệnh giữ kho nguyên liệu.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs text-stone-600 shadow-xs">
            Tổng số: <strong className="text-amber-900 font-bold">{totalElements}</strong> đơn tiệc
          </div>

          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors shadow-xs cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Mã đơn (ORD-...), tên, số điện thoại..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
              className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <select
            value={orderStatus}
            onChange={(e) => {
              setOrderStatus(e.target.value as OrderStatus | '');
              setPage(0);
            }}
            className="px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-white font-medium text-stone-700 focus:outline-none focus:border-amber-600 shadow-xs"
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
            className="px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-white font-mono text-stone-700 focus:outline-none focus:border-amber-600 shadow-xs"
          />

          <input
            type="date"
            placeholder="Đến ngày"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(0);
            }}
            className="px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-white font-mono text-stone-700 focus:outline-none focus:border-amber-600 shadow-xs"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Mã đơn</th>
                <th className="py-3.5 px-4">Khách hàng</th>
                <th className="py-3.5 px-4">Ngày giờ tổ chức</th>
                <th className="py-3.5 px-4 text-center">Quy mô</th>
                <th className="py-3.5 px-4 text-right">Tổng giá trị</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-stone-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-600 mb-2" />
                    <span className="font-medium">Đang tải danh sách đơn đặt tiệc...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-stone-400">
                    <ClipboardList className="h-8 w-8 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-600 text-sm">Không tìm thấy đơn tiệc nào</p>
                    <p className="text-xs text-stone-400 mt-1">Thử thay đổi từ khóa hoặc bộ lọc trạng thái</p>
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr
                    key={ord.id}
                    className="hover:bg-amber-50/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/admin/orders/${ord.id}`)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900 bg-stone-50/40 whitespace-nowrap">
                      {ord.orderCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                        {ord.customerName}
                      </div>
                      <div className="text-[11px] font-mono text-stone-400 font-normal">
                        {ord.customerPhone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-700 whitespace-nowrap">
                      {formatDateTimeVn(ord.eventDateTime)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-stone-800 whitespace-nowrap">
                      {ord.tableCount} bàn
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-900 text-sm whitespace-nowrap">
                      {formatVnd(ord.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getOrderStatusBadge(ord.orderStatus)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/admin/orders/${ord.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 hover:bg-amber-50 hover:text-amber-900 text-stone-600 px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Chi tiết</span>
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
