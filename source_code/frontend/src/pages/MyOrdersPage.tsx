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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock4 className="w-3 h-3" /> Chờ thanh toán
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> Đã thanh toán
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <RefreshCw className="w-3 h-3" /> Đang chuẩn bị tiệc
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-300">
            <CheckCircle2 className="w-3 h-3" /> Hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3" /> Đã hủy
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-800 pb-20">
      {/* Header */}
      <div className="bg-stone-900 text-white py-10 px-4 sm:px-8 border-b border-amber-500/20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Đơn Đặt Tiệc Của Tôi
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm mt-1">
              Theo dõi tiến độ, lịch sử trạng thái và thông tin chi tiết các buổi tiệc đã đặt.
            </p>
          </div>

          <Link
            to="/menu-builder"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs shadow-md transition-colors"
          >
            + Đặt Buổi Tiệc Mới
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8">
        {/* Filter bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-semibold text-stone-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Lọc:
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
                onClick={() => {
                  setSelectedStatus(f.value as OrderStatus | '');
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedStatus === f.value
                    ? 'bg-amber-500 text-stone-950 font-semibold'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchOrders}
            className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
          </button>
        </div>

        {/* State Handlers */}
        {loading && <LoadingState message="Đang tải danh sách đơn đặt tiệc..." />}
        {error && <ErrorState message={error} onRetry={fetchOrders} />}

        {!loading && !error && orders.length === 0 && (
          <EmptyState
            title="Chưa có đơn đặt tiệc nào"
            description="Quý khách chưa có đơn đặt tiệc nào trong hệ thống. Hãy chọn món và tạo tiệc ngay!"
            action={
              <Link
                to="/menus"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-semibold text-xs"
              >
                Khám Phá Thực Đơn
              </Link>
            }
          />
        )}

        {/* Order Cards */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-base font-bold text-stone-900">
                      {ord.orderCode}
                    </span>
                    {getStatusBadge(ord.orderStatus)}
                    <span className="text-xs text-stone-400 font-mono">
                      Tạo ngày {formatDateTimeVn(ord.createdAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-stone-600 pt-1">
                    <div>
                      <span className="text-stone-400 block">Thời gian tổ chức:</span>
                      <span className="font-semibold text-stone-900">
                        {formatDateTimeVn(ord.eventDateTime)}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Quy mô:</span>
                      <span className="font-semibold text-stone-900">
                        {ord.tableCount} bàn ({ord.items.length} món)
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Thực đơn:</span>
                      <span className="font-semibold text-stone-900 truncate block">
                        {ord.menuNameSnapshot || 'Thực đơn tự chọn'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto justify-between border-t md:border-t-0 pt-4 md:pt-0 border-stone-100">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-stone-400 block">Tổng thanh toán:</span>
                    <span className="font-serif text-lg font-bold text-amber-800">
                      {formatVnd(ord.totalAmount)}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/my-orders/${ord.id}`)}
                    className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-amber-500 hover:text-stone-950 text-stone-700 font-semibold text-xs transition-colors flex items-center gap-1.5 border border-stone-200"
                  >
                    Xem Chi Tiết
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-6 flex justify-center gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold disabled:opacity-40"
                >
                  Trang trước
                </button>
                <span className="px-3 py-1.5 text-xs text-stone-500 font-medium">
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold disabled:opacity-40"
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
