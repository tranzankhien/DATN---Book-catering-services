import { OrderProgress } from '../../components/OrderProgress';
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChefHat,
  Calendar,
  Clock,
  Package,
  CheckCircle2,
  Users,
  Copy,
  Utensils,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import type { OrderDto } from '../../services/types';
import { formatDateTimeVn } from '../../hooks/useFormatters';
import { LoadingState, ErrorState } from '../../components/StatusStates';
import { extractErrorMessage } from '../../services/apiClient';

export const EmployeeOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await orderService.getEmployeeOrderById(Number(id));
        setOrder(data);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const formatQuantity = (val?: number | null) => {
    if (val === undefined || val === null || isNaN(Number(val))) return '0';
    return Number(val).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <LoadingState label="Đang tải thông tin chuẩn bị bếp..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 space-y-4">
        <ErrorState message={error || 'Không tìm thấy đơn hàng.'} />
        <div className="text-center">
          <Link
            to="/employee/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900"
          >
            ← Quay lại danh sách tiệc bếp
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up-1">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 font-medium">
        <Link to="/" className="hover:text-stone-900 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link to="/employee/orders" className="hover:text-stone-900 transition-colors">
          Lịch đặt tiệc bếp
        </Link>
        <span>/</span>
        <span className="font-semibold text-stone-900 tabular-nums">{order.orderCode}</span>
      </nav>

      {/* Progress Action Stepper for Kitchen Staff */}
      <OrderProgress order={order} role="employee" onUpdate={setOrder} />

      {/* Summary Card */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-amber-700" />
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Phiếu chuẩn bị & Chế biến bếp
              </h1>
            </div>
            <p className="text-xs text-stone-400 mt-1 tabular-nums">
              Đơn hàng: {order.orderCode} • Trạng thái: {order.orderStatus}
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200/80 px-4 py-2 text-right">
            <span className="block text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
              Quy mô chế biến:
            </span>
            <span className="font-bold text-stone-900 text-lg tabular-nums">
              {order.tableCount} bàn {order.guestCount ? `(~${order.guestCount} khách)` : `(~${order.tableCount * 10} khách)`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="rounded-xl bg-stone-50 p-4 border border-stone-100">
            <span className="block text-[11px] text-stone-400 font-medium">Thời gian diễn ra tiệc:</span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 block tabular-nums">
              {formatDateTimeVn(order.eventDateTime)}
            </span>
          </div>

          <div className="rounded-xl bg-stone-50 p-4 border border-stone-100">
            <span className="block text-[11px] text-stone-400 font-medium">Khách hàng liên hệ:</span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 block">{order.customerName}</span>
            <span className="text-stone-500 tabular-nums">{order.customerPhone}</span>
          </div>

          <div className="rounded-xl bg-stone-50 p-4 border border-stone-100">
            <span className="block text-[11px] text-stone-400 font-medium">Địa điểm tổ chức:</span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 block">
              {order.eventLocation || 'Chưa cung cấp'}
            </span>
          </div>

          <div className="rounded-xl bg-stone-50 p-4 border border-stone-100">
            <span className="block text-[11px] text-stone-400 font-medium">Thực đơn áp dụng:</span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 truncate block">
              {order.menuNameSnapshot || 'Thực đơn tự chọn'}
            </span>
          </div>
        </div>

        {order.note && (
          <div className="rounded-xl bg-stone-50 p-3.5 border border-stone-200 text-xs text-stone-700">
            <strong className="text-stone-900 font-semibold">Ghi chú từ khách hàng:</strong> {order.note}
          </div>
        )}
      </div>

      {/* Two Columns: Dishes Preparation List (Left) & Ingredients to Issue (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Dishes preparation list (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="font-bold text-base text-stone-900 tracking-tight">
              Danh sách món ăn cần nấu ({order.items.length} món)
            </h2>
            <span className="text-xs font-semibold text-stone-500">
              {order.tableCount} bàn x định lượng
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {order.items.map((it, idx) => (
              <div key={it.id} className="py-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center font-bold text-stone-400 tabular-nums">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">
                      {it.dishNameSnapshot}
                    </h3>
                    <span className="text-[11px] text-stone-500 tabular-nums">
                      Định mức: {it.quantityPerTable} phần/bàn
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-bold text-amber-900 block tabular-nums">
                    {it.totalQuantity || (it.quantityPerTable * order.tableCount)}
                  </span>
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                    Tổng số phần
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ingredients to issue (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-600" />
              <h3 className="font-bold text-base text-stone-900 tracking-tight">
                Nguyên liệu xuất kho
              </h3>
            </div>
            {order.reservation && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                order.reservation.status === 'ACTIVE'
                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                  : order.reservation.status === 'RELEASED'
                  ? 'bg-stone-100 text-stone-600'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {order.reservation.status === 'ACTIVE' ? 'Đang giữ kho' : order.reservation.status === 'RELEASED' ? 'Đã giải phóng' : 'Đã xuất kho'}
              </span>
            )}
          </div>

          {order.reservation && (
            <div className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-200/70 space-y-0.5">
              <div>Hạn giữ kho: <strong className="text-stone-800">{formatDateTimeVn(order.reservation.expiresAt)}</strong></div>
              {order.reservation.releasedAt && (
                <div className="text-stone-600">Đã giải phóng kho: {formatDateTimeVn(order.reservation.releasedAt)}</div>
              )}
            </div>
          )}

          {order.reservation && order.reservation.items.length > 0 ? (
            <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto pr-1">
              {order.reservation.items.map((resItem) => (
                <div key={resItem.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-stone-900">{resItem.ingredientName}</div>
                    <div className="text-[11px] text-stone-400 tabular-nums">
                      {resItem.ingredientCode}
                    </div>
                  </div>
                  <div className="font-bold text-amber-900 bg-amber-50/80 border border-amber-200/80 px-2.5 py-1 rounded-lg text-xs tabular-nums shrink-0">
                    {formatQuantity(resItem.reservedQuantity ?? resItem.quantity)} {resItem.unit}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-stone-400">
              Không có dữ liệu giữ kho nguyên liệu cho đơn này.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
