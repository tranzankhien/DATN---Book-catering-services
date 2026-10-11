import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  RefreshCw,
  History,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { orderService } from '../services/orderService';
import type { OrderDto } from '../services/types';
import { formatVnd, formatDateTimeVn } from '../hooks/useFormatters';
import { LoadingState, ErrorState } from '../components/StatusStates';
import { useToast } from '../hooks/useToast';
import { extractErrorMessage } from '../services/apiClient';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation Modal
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelling, setCancelling] = useState<boolean>(false);

  const fetchOrderDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getOrderById(Number(id));
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

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      setCancelling(true);
      const updated = await orderService.cancelOrder(order.id, cancelReason.trim() || 'Khách hàng yêu cầu hủy đơn');
      setOrder(updated);
      setCancelModalOpen(false);
      showToast('Đơn đặt tiệc đã được hủy thành công và giải phóng nguyên liệu kho.', 'success');
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
    return (
      <div className="min-h-screen bg-[#faf8f5] py-20">
        <LoadingState message="Đang tải chi tiết đơn tiệc..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#faf8f5] py-20 max-w-3xl mx-auto px-4">
        <ErrorState message={error || 'Không tìm thấy đơn hàng.'} onRetry={fetchOrderDetail} />
        <div className="mt-4 text-center">
          <Link to="/my-orders" className="text-amber-700 hover:underline text-sm">
            ← Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-800 pb-20">
      {/* Top Breadcrumb */}
      <div className="bg-stone-900 text-stone-300 py-3 px-4 sm:px-8 border-b border-stone-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            to="/my-orders"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Danh sách đơn tiệc
          </Link>
          <div className="text-xs font-mono text-amber-400 font-bold">{order.orderCode}</div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8">
        {/* Header summary card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-mono text-2xl font-bold text-stone-900">{order.orderCode}</h1>
                <button
                  onClick={copyOrderCode}
                  className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-700"
                  title="Sao chép"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
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
                {order.orderStatus === 'PENDING_PAYMENT'
                  ? 'Chờ thanh toán (Giữ kho 15p)'
                  : order.orderStatus === 'PAID'
                  ? 'Đã thanh toán'
                  : order.orderStatus === 'PROCESSING'
                  ? 'Đang chuẩn bị'
                  : order.orderStatus === 'COMPLETED'
                  ? 'Hoàn thành'
                  : 'Đã hủy'}
              </span>

              {order.orderStatus === 'PENDING_PAYMENT' && (
                <button
                  onClick={() => setCancelModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
                >
                  Hủy đơn tiệc
                </button>
              )}
            </div>
          </div>

          {/* Key Facts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-stone-50 rounded-xl">
              <span className="text-stone-400 block mb-0.5">Thời gian diễn ra tiệc:</span>
              <span className="font-semibold text-stone-900 text-sm">
                {formatDateTimeVn(order.eventDateTime)}
              </span>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl">
              <span className="text-stone-400 block mb-0.5">Quy mô bàn tiệc:</span>
              <span className="font-semibold text-stone-900 text-sm">
                {order.tableCount} bàn (~{order.tableCount * 10} khách)
              </span>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl">
              <span className="text-stone-400 block mb-0.5">Thực đơn áp dụng:</span>
              <span className="font-semibold text-stone-900 text-sm truncate block">
                {order.menuNameSnapshot || 'Thực đơn tự chọn'}
              </span>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl">
              <span className="text-stone-400 block mb-0.5">Tổng giá trị đơn:</span>
              <span className="font-serif font-bold text-amber-800 text-base">
                {formatVnd(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Customer & Note */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-2">
            <div className="space-y-1.5">
              <span className="text-stone-400 font-semibold uppercase tracking-wider block">
                Người liên hệ:
              </span>
              <div className="font-medium text-stone-800">
                {order.customerName} • {order.customerPhone}
              </div>
              <div className="text-stone-500">{order.customerEmail}</div>
            </div>

            {order.note && (
              <div className="space-y-1.5">
                <span className="text-stone-400 font-semibold uppercase tracking-wider block">
                  Ghi chú tiệc:
                </span>
                <p className="text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  {order.note}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dishes Snapshot Table (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
              <h2 className="font-serif font-bold text-base text-stone-900 mb-4 pb-3 border-b border-stone-100">
                Chi Tiết Món Ăn Bàn Tiệc ({order.items.length} món)
              </h2>

              <div className="divide-y divide-stone-100">
                {order.items.map((it, idx) => (
                  <div key={it.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-stone-400 font-mono">{idx + 1}</span>
                      {it.dishImageUrl && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                          <img
                            src={it.dishImageUrl}
                            alt={it.dishNameSnapshot}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-stone-900">{it.dishNameSnapshot}</div>
                        <div className="text-[11px] text-stone-500">
                          {formatVnd(it.unitPriceSnapshot)} x {it.quantityPerTable} phần/bàn
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-stone-900">{formatVnd(it.lineTotal)}</div>
                      <div className="text-[10px] text-stone-400">Tổng {it.totalQuantity} phần</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-stone-200 flex justify-between items-baseline">
                <span className="font-bold text-stone-700 text-sm">Tổng cộng đơn tiệc:</span>
                <span className="font-serif text-2xl font-bold text-amber-800">
                  {formatVnd(order.totalAmount)}
                </span>
              </div>
            </div>

            {/* Stock Reservation Assurance */}
            {order.reservation && (
              <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Khóa Giữ Kho Nguyên Liệu
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                    Trạng thái: {order.reservation.status}
                  </span>
                </div>
                <p className="text-xs text-stone-600">
                  Hệ thống đã khóa giữ {order.reservation.items.length} loại nguyên liệu cần thiết cho tiệc. Hết hạn giữ chỗ:{' '}
                  <strong>{formatDateTimeVn(order.reservation.expiresAt)}</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Audit History Timeline (1 Col) */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm">
              <h3 className="font-serif font-bold text-sm text-stone-900 mb-4 flex items-center gap-2 pb-3 border-b border-stone-100">
                <History className="w-4 h-4 text-amber-600" />
                Lịch Sử Trạng Thái Đơn Tiệc
              </h3>

              <div className="space-y-4">
                {order.statusHistories.map((hist, idx) => (
                  <div key={hist.id} className="relative pl-5 pb-2 text-xs border-l-2 border-amber-300 last:border-transparent">
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
      </div>

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="font-serif font-bold text-base text-stone-900 mb-2">
              Xác Nhận Hủy Đơn Tiệc
            </h3>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Quý khách có chắc chắn muốn hủy đơn tiệc <strong>{order.orderCode}</strong> không?
              Nguyên liệu đang được giữ chỗ trong kho sẽ được hoàn trả lại ngay lập tức.
            </p>

            <form onSubmit={handleCancelOrder}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Lý do hủy đơn:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập lý do thay đổi kế hoạch..."
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
                  {cancelling ? 'Đang hủy...' : 'Xác Nhận Hủy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
