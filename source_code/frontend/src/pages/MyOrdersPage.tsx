import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock4,
  RefreshCw,
  Award,
  Plus,
  MapPin,
  Users,
  Utensils,
  Copy,
  RotateCcw,
  CreditCard,
} from 'lucide-react';
import { orderService } from '../services/orderService';
import type { OrderDto, OrderStatus } from '../services/types';
import { formatVnd, formatDateTimeVn } from '../hooks/useFormatters';
import { LoadingState, ErrorState, EmptyState } from '../components/StatusStates';
import { extractErrorMessage } from '../services/apiClient';
import { useToast } from '../hooks/useToast';

export const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await orderService.getMyOrders({
        status: selectedStatus || undefined,
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
  }, [selectedStatus, page]);

  const copyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    showToast(`Đã sao chép mã đơn: ${code}`, 'info');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock4 className="h-3 w-3 text-amber-600" />
            <span>Chờ thanh toán (15p)</span>
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Đã thanh toán</span>
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <RefreshCw className="h-3 w-3 text-blue-600 animate-spin" />
            <span>Đang chuẩn bị tiệc</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200">
            <CheckCircle2 className="h-3 w-3 text-stone-600" />
            <span>Hoàn thành</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="h-3 w-3 text-rose-600" />
            <span>Đã hủy</span>
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-500 border border-stone-300">
            <AlertCircle className="h-3 w-3 text-stone-400" />
            <span>Hết hạn giữ chỗ</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up-1">
      {/* Header Banner */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
              <Award className="h-3.5 w-3.5 text-amber-600" />
              <span>Cổng dịch vụ khách hàng yến tiệc</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Đơn đặt tiệc của tôi
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Theo dõi tình trạng giữ chỗ nguyên liệu kho, chi tiết hợp đồng và tiến độ phục vụ các buổi tiệc của bạn.
            </p>
          </div>

          <Link
            to="/menu-builder"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-800 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-900 transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Đặt tiệc mới</span>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-500 flex items-center gap-1.5 mr-1">
            <Filter className="h-3.5 w-3.5 text-amber-700" />
            Lọc:
          </span>
          {[
            { label: 'Tất cả', value: '' },
            { label: 'Chờ thanh toán', value: 'PENDING_PAYMENT' },
            { label: 'Đã thanh toán', value: 'PAID' },
            { label: 'Đang chuẩn bị', value: 'PREPARING' },
            { label: 'Hoàn thành', value: 'COMPLETED' },
            { label: 'Hết hạn', value: 'EXPIRED' },
            { label: 'Đã hủy', value: 'CANCELLED' },
          ].map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setSelectedStatus(f.value as OrderStatus | '');
                setPage(0);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === f.value
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          className="p-2 text-stone-500 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer border border-stone-200 shadow-xs"
          title="Làm mới danh sách"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
        </button>
      </div>

      {/* States */}
      {loading && <LoadingState label="Đang nạp danh sách đơn đặt tiệc..." />}
      {error && <ErrorState message={error} onRetry={fetchOrders} />}

      {!loading && !error && orders.length === 0 && (
        <EmptyState
          title="Chưa có đơn đặt tiệc nào"
          description="Quý khách chưa có đơn tiệc nào trong hệ thống. Hãy chọn món và tạo tiệc ngay hôm nay!"
          action={
            <Link
              to="/menus"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-800 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-900 transition-colors"
            >
              <span>Xem thực đơn mẫu</span>
            </Link>
          }
        />
      )}

      {/* Orders Cards Grid (Balanced 2-Column Luxury Grid) */}
      {!loading && !error && orders.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map((ord) => (
            <div
              key={ord.id}
              onClick={() => navigate(`/my-orders/${ord.id}`)}
              className="group rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer space-y-5"
            >
              {/* Card Header: Code & Status */}
              <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-stone-900 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-lg group-hover:border-amber-300 transition-colors">
                    {ord.orderCode}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => copyCode(ord.orderCode, e)}
                    className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
                    title="Sao chép mã đơn"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div>{getStatusBadge(ord.orderStatus)}</div>
              </div>

              {/* Card Body: Banquet Info */}
              <div className="space-y-3.5 flex-1">
                <div>
                  <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                    {ord.menuNameSnapshot || 'Thực đơn tiệc tự chọn'}
                  </h3>
                  <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                    Khởi tạo lúc: {formatDateTimeVn(ord.createdAt)}
                  </p>
                </div>

                {/* 3-Column Quick Metrics Strip */}
                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <div className="rounded-xl bg-stone-50/80 p-2.5 border border-stone-100">
                    <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider block">
                      Ngày tiệc
                    </span>
                    <span className="font-bold text-stone-800 truncate block mt-0.5">
                      {formatDateTimeVn(ord.eventDateTime).split(' ')[1] || formatDateTimeVn(ord.eventDateTime)}
                    </span>
                  </div>

                  <div className="rounded-xl bg-stone-50/80 p-2.5 border border-stone-100">
                    <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider block">
                      Quy mô
                    </span>
                    <span className="font-bold text-stone-800 truncate block mt-0.5">
                      {ord.tableCount} bàn {ord.guestCount ? `(~${ord.guestCount}k)` : ''}
                    </span>
                  </div>

                  <div className="rounded-xl bg-stone-50/80 p-2.5 border border-stone-100">
                    <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider block">
                      Số món
                    </span>
                    <span className="font-bold text-stone-800 truncate block mt-0.5">
                      {ord.items?.length || 0} món tiệc
                    </span>
                  </div>
                </div>

                {/* Venue Location Preview */}
                {ord.eventLocation && (
                  <div className="flex items-center gap-1.5 text-xs text-stone-600 bg-stone-50/50 px-3 py-1.5 rounded-lg border border-stone-100 truncate">
                    <MapPin className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                    <span className="truncate">{ord.eventLocation}</span>
                  </div>
                )}
              </div>

              {/* Card Footer: Total Price & Actions */}
              <div className="flex items-center justify-between pt-3.5 border-t border-stone-100">
                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-stone-400">
                    Tổng giá trị tiệc
                  </span>
                  <span className="text-base sm:text-lg font-bold text-amber-900 font-mono">
                    {formatVnd(ord.totalAmount)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/my-orders/${ord.id}`);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                      ord.orderStatus === 'PENDING_PAYMENT'
                        ? 'bg-amber-800 hover:bg-amber-900 text-white'
                        : 'border border-stone-300 bg-white hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <span>{ord.orderStatus === 'PENDING_PAYMENT' ? 'Thanh toán ngay' : 'Xem chi tiết'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-4 flex justify-center items-center gap-2">
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
  );
};
