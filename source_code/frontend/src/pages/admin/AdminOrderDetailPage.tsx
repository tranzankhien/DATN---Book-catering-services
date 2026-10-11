import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Clock4,
  History,
  ShieldCheck,
  CreditCard,
  Ban,
  Package,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import type { OrderDto } from '../../services/types';
import { formatVnd, formatDateTimeVn } from '../../hooks/useFormatters';
import { LoadingState, ErrorState } from '../../components/StatusStates';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../services/apiClient';

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Admin Cancel Modal
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelling, setCancelling] = useState<boolean>(false);

  const fetchOrderDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getAdminOrderById(Number(id));
      setOrder(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const handleAdminCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!cancelReason.trim()) {
      showToast('Vui lòng nhập lý do hủy đơn tiệc', 'error');
      return;
    }
    try {
      setCancelling(true);
      const updated = await orderService.adminCancelOrder(order.id, cancelReason.trim());
      setOrder(updated);
      setCancelModalOpen(false);
      showToast('Quản trị viên đã hủy đơn tiệc thành công.', 'success');
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setCancelling(false);
    }
  };

  const copyOrderCode = () => {
    if (order?.orderCode) {
      navigator.clipboard.writeText(order.orderCode);
      showToast(`Đã sao chép mã đơn: ${order.orderCode}`, 'info');
    }
  };

  if (loading) {
    return <LoadingState message="Đang tải chi tiết đơn tiệc..." />;
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <ErrorState message={error || 'Không tìm thấy đơn hàng.'} onRetry={fetchOrderDetail} />
        <Link to="/admin/orders" className="text-amber-700 hover:underline text-xs">
          ← Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Danh sách đơn tiệc
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-amber-800">{order.orderCode}</span>
          <button
            onClick={copyOrderCode}
            className="p-1 hover:bg-stone-100 rounded text-stone-400"
            title="Sao chép"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Order Card */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div>
            <h1 className="font-mono text-2xl font-bold text-stone-900">{order.orderCode}</h1>
            <p className="text-xs text-stone-400 font-mono mt-1">
              Tạo lúc: {formatDateTimeVn(order.createdAt)} • Cập nhật: {formatDateTimeVn(order.updatedAt)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                order.orderStatus === 'PENDING_PAYMENT'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : order.orderStatus === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : order.orderStatus === 'PROCESSING'
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : order.orderStatus === 'COMPLETED'
                  ? 'bg-stone-100 text-stone-700 border-stone-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              Trạng thái đơn: {order.orderStatus}
            </span>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-300">
              Thanh toán: {order.paymentStatus}
            </span>

            {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'COMPLETED' && (
              <button
                onClick={() => setCancelModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1"
              >
                <Ban className="w-3.5 h-3.5" />
                Admin Hủy Đơn
              </button>
            )}
          </div>
        </div>

        {/* Fact grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-stone-50 rounded-xl">
            <span className="text-stone-400 block mb-0.5">Khách hàng:</span>
            <span className="font-bold text-stone-900 text-sm block">{order.customerName}</span>
            <span className="text-stone-500">{order.customerPhone}</span>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-xl">
            <span className="text-stone-400 block mb-0.5">Thời gian tiệc:</span>
            <span className="font-bold text-stone-900 text-sm block">
              {formatDateTimeVn(order.eventDateTime)}
            </span>
            <span className="text-stone-500">{order.tableCount} bàn (~{order.tableCount * 10} người)</span>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-xl">
            <span className="text-stone-400 block mb-0.5">Thực đơn áp dụng:</span>
            <span className="font-bold text-stone-900 text-sm truncate block">
              {order.menuNameSnapshot || 'Thực đơn tự chọn'}
            </span>
            <span className="text-stone-500">{order.items.length} món ăn</span>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-xl">
            <span className="text-stone-400 block mb-0.5">Tổng giá trị hợp đồng:</span>
            <span className="font-serif font-bold text-amber-800 text-lg block">
              {formatVnd(order.totalAmount)}
            </span>
          </div>
        </div>

        {order.note && (
          <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-700 border border-stone-200">
            <span className="font-semibold text-stone-500 block mb-1">Ghi chú của khách hàng:</span>
            {order.note}
          </div>
        )}
      </div>

        {/* Two Columns: Dishes Snapshot & Stock Reservation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Dishes Table (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-base text-stone-900 pb-2 border-b border-stone-100">
              Chi Tiết Món Ăn Bàn Tiệc ({order.items.length} món)
            </h3>

            <div className="divide-y divide-stone-100">
              {order.items.map((it, idx) => (
                <div key={it.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-stone-400 font-mono">{idx + 1}</span>
                    <div>
                      <div className="font-semibold text-stone-900">{it.dishNameSnapshot}</div>
                      <div className="text-[11px] text-stone-500">
                        {formatVnd(it.unitPriceSnapshot)} x {it.quantityPerTable} phần/bàn
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-stone-900">{formatVnd(it.lineTotal)}</div>
                    <div className="text-[10px] text-stone-400">Tổng: {it.totalQuantity} phần</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline text-sm">
              <span className="font-bold text-stone-700">Tổng cộng:</span>
              <span className="font-serif text-xl font-bold text-amber-800">
                {formatVnd(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Reservation & Audit Trail (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Stock Reservation Card */}
            {order.reservation && (
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <h4 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-600" />
                    Giữ Chỗ Kho Nguyên Liệu
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      order.reservation.status === 'CONFIRMED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.reservation.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {order.reservation.status}
                  </span>
                </div>

                <div className="text-xs text-stone-600 space-y-1">
                  <div>Hạn giữ kho: <strong>{formatDateTimeVn(order.reservation.expiresAt)}</strong></div>
                  {order.reservation.releasedAt && (
                    <div className="text-rose-600">
                      Đã giải phóng kho: {formatDateTimeVn(order.reservation.releasedAt)}
                    </div>
                  )}
                </div>

                {/* Items reserved list */}
                <div className="max-h-44 overflow-y-auto divide-y divide-stone-100 border border-stone-100 rounded-xl p-2 bg-stone-50 text-xs">
                  {order.reservation.items.map((resItem) => (
                    <div key={resItem.id} className="py-1.5 flex justify-between">
                      <span className="text-stone-700">{resItem.ingredientName}</span>
                      <span className="font-mono font-semibold text-stone-900">
                        {resItem.quantity} {resItem.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status History Audit Trail */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
              <h4 className="font-serif font-bold text-sm text-stone-900 mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                Lịch Sử Trạng Thái (Audit Log)
              </h4>

              <div className="space-y-4">
                {order.statusHistories.map((hist) => (
                  <div
                    key={hist.id}
                    className="relative pl-5 pb-2 text-xs border-l-2 border-amber-300 last:border-transparent"
                  >
                    <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-amber-500" />
                    <div className="font-semibold text-stone-900">
                      {hist.fromStatus ? `${hist.fromStatus} → ` : ''}{hist.toStatus}
                    </div>
                    <div className="text-[11px] text-stone-400 font-mono">
                      {formatDateTimeVn(hist.createdAt)}
                    </div>
                    {hist.reason && (
                      <div className="text-stone-600 mt-1 italic">"{hist.reason}"</div>
                    )}
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      Thực hiện: {hist.changedByName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      {/* Admin Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="font-serif font-bold text-base text-stone-900 mb-2">
              Quản Trị Viên Hủy Đơn Tiệc
            </h3>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Bạn đang chuẩn bị hủy đơn hàng <strong>{order.orderCode}</strong>.
              Thao tác này sẽ cập nhật trạng thái đơn thành CANCELLED và giải phóng toàn bộ nguyên liệu đã giữ trong kho.
            </p>

            <form onSubmit={handleAdminCancelOrder}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Lý do hủy đơn (Bắt buộc):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ví dụ: Khách gọi điện báo dời tiệc sang tháng sau..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-sm"
                >
                  {cancelling ? 'Đang hủy...' : 'Xác Nhận Hủy Đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
