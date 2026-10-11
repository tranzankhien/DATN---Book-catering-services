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

  if (loading) {
    return <LoadingState message="Đang tải thông tin chuẩn bị bếp..." />;
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <ErrorState message={error || 'Không tìm thấy đơn hàng.'} />
        <Link to="/employee/orders" className="text-amber-700 hover:underline text-xs">
          ← Quay lại danh sách tiệc bếp
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <Link
          to="/employee/orders"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Danh sách tiệc bếp
        </Link>
        <span className="font-mono text-xs font-bold text-amber-800">{order.orderCode}</span>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-amber-600" />
              <h1 className="text-xl font-serif font-bold text-stone-900">
                Phiếu Chế Biến & Chuẩn Bị Bếp
              </h1>
            </div>
            <p className="text-xs text-stone-400 font-mono mt-1">
              Đơn hàng: {order.orderCode} • Trạng thái: {order.orderStatus}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-stone-400 block">Quy mô thực hiện:</span>
            <span className="font-bold text-stone-900 text-lg">
              {order.tableCount} bàn (~{order.tableCount * 10} khách)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-stone-50 rounded-xl">
            <span className="text-stone-400 block mb-0.5">Thời gian tiệc:</span>
            <span className="font-bold text-stone-900 text-sm">
              {formatDateTimeVn(order.eventDateTime)}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl">
            <span className="text-stone-400 block mb-0.5">Khách hàng:</span>
            <span className="font-bold text-stone-900 text-sm">{order.customerName}</span>
            <span className="text-stone-500 block">{order.customerPhone}</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl">
            <span className="text-stone-400 block mb-0.5">Thực đơn:</span>
            <span className="font-bold text-stone-900 text-sm truncate block">
              {order.menuNameSnapshot || 'Thực đơn tự chọn'}
            </span>
          </div>
        </div>

        {order.note && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <strong>Ghi chú từ khách:</strong> {order.note}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Dishes preparation list (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-base text-stone-900 pb-2 border-b border-stone-100 flex items-center justify-between">
            <span>Danh Sách Món Ăn Cần Nấu ({order.items.length} món)</span>
            <span className="text-xs font-normal text-stone-500">
              {order.tableCount} bàn x định lượng
            </span>
          </h2>

          <div className="divide-y divide-stone-100">
            {order.items.map((it, idx) => (
              <div key={it.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-stone-400 font-mono font-bold">{idx + 1}</span>
                  <div>
                    <h4 className="font-semibold text-stone-900 text-sm">
                      {it.dishNameSnapshot}
                    </h4>
                    <span className="text-[11px] text-stone-500">
                      Định mức: {it.quantityPerTable} phần/bàn
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-base font-bold text-amber-800 block">
                    {it.totalQuantity}
                  </span>
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider">
                    Tổng số phần
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ingredients required (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-base text-stone-900 pb-2 border-b border-stone-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            Nguyên Liệu Cần Xuất Kho
          </h3>

          {order.reservation && order.reservation.items.length > 0 ? (
            <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
              {order.reservation.items.map((resItem) => (
                <div key={resItem.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-stone-800">{resItem.ingredientName}</div>
                    <div className="text-[11px] text-stone-400 font-mono">
                      {resItem.ingredientCode}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-stone-900 text-sm">
                    {resItem.quantity} {resItem.unit}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-stone-400">
              Không có dữ liệu giữ kho nguyên liệu cho đơn này.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
