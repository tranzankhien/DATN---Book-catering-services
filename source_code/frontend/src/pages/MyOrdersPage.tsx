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
} from 'lucide-react';
import { orderService } from '../services/orderService';
import type { OrderDto, OrderStatus } from '../services/types';
import { formatVnd, formatDateTimeVn } from '../hooks/useFormatters';
import { LoadingState, ErrorState, EmptyState } from '../components/StatusStates';
import { extractErrorMessage } from '../services/apiClient';

export const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();
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

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock4 className="h-3.5 w-3.5 text-amber-600" />
            <span>Chờ thanh toán (15p)</span>
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Đã thanh toán</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin" />
            <span>Đang chuẩn bị tiệc</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-stone-600" />
            <span>Hoàn thành</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            <span>Đã hủy</span>
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
              Theo dõi tình trạng giữ chỗ nguyên liệu, chi tiết thực đơn và tiến độ phục vụ các buổi tiệc của bạn.
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
            { label: 'Đang chuẩn bị', value: 'PROCESSING' },
            { label: 'Hoàn thành', value: 'COMPLETED' },
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

      {/* Orders Cards List */}
      {!loading && !error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="group rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-bold text-stone-900 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-lg">
                    {ord.orderCode}
                  </span>
                  {getStatusBadge(ord.orderStatus)}
                  <span className="text-xs text-stone-400 font-mono">
                    Tạo ngày {formatDateTimeVn(ord.createdAt)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-600">
                  <div className="rounded-xl bg-stone-50 p-2.5 border border-stone-100">
                    <span className="block text-[11px] text-stone-400">Thời gian tiệc:</span>
                    <span className="font-bold text-stone-900">
                      {formatDateTimeVn(ord.eventDateTime)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-stone-50 p-2.5 border border-stone-100">
                    <span className="block text-[11px] text-stone-400">Quy mô tiệc:</span>
                    <span className="font-bold text-stone-900">
                      {ord.tableCount} bàn ({ord.items.length} món ăn)
                    </span>
                  </div>
                  <div className="rounded-xl bg-stone-50 p-2.5 border border-stone-100">
                    <span className="block text-[11px] text-stone-400">Thực đơn:</span>
                    <span className="font-bold text-stone-900 truncate block">
                      {ord.menuNameSnapshot || 'Thực đơn tự chọn'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-stone-100 gap-3 shrink-0">
                <div className="text-left md:text-right">
                  <span className="block text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                    Tổng giá trị tiệc
                  </span>
                  <span className="text-lg font-bold text-amber-900">
                    {formatVnd(ord.totalAmount)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/my-orders/${ord.id}`)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-xs transition-colors cursor-pointer"
                >
                  <span>Xem chi tiết</span>
                  <ArrowRight className="h-3.5 w-3.5 text-stone-400" />
                </button>
              </div>
            </div>
          ))}

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
      )}
    </div>
  );
};
