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
  RefreshCw,
  X,
  ClipboardList,
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
    return <LoadingState label="Đang nạp chi tiết đơn tiệc..." />;
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <ErrorState message={error || 'Không tìm thấy đơn hàng.'} onRetry={fetchOrderDetail} />
        <Link to="/admin/orders" className="text-amber-800 hover:underline text-xs font-semibold">
          ← Quay lại danh sách đơn đặt tiệc
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-8 animate-fade-up-1">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
            <Link to="/admin/orders" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Danh sách đơn đặt tiệc</span>
            </Link>
            <span>/</span>
            <span className="font-mono text-stone-900">{order.orderCode}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight mt-1 flex items-center gap-3">
            <span>Hợp đồng tiệc {order.orderCode}</span>
            <button
              type="button"
              onClick={copyOrderCode}
              className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              title="Sao chép mã đơn"
            >
              <Copy className="h-4 w-4" />
            </button>
          </h1>
          <p className="text-sm text-stone-500 mt-1 font-mono">
            Tạo lúc: {formatDateTimeVn(order.createdAt)} • Cập nhật lúc: {formatDateTimeVn(order.updatedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchOrderDetail}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Làm mới</span>
          </button>

          {(order.orderStatus === 'PENDING_PAYMENT' || order.orderStatus === 'PAID') && (
            <button
              type="button"
              onClick={() => setCancelModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 transition-colors shadow-xs cursor-pointer"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Admin hủy đơn</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Fact Card */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center gap-3 border-b border-stone-100 pb-4">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              order.orderStatus === 'PENDING_PAYMENT'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : order.orderStatus === 'PAID'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : order.orderStatus === 'PREPARING'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : order.orderStatus === 'COMPLETED'
                ? 'bg-stone-100 text-stone-700 border-stone-200'
                : order.orderStatus === 'EXPIRED'
                ? 'bg-stone-100 text-stone-500 border-stone-300'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            Trạng thái đơn:{' '}
            {order.orderStatus === 'PENDING_PAYMENT'
              ? 'Chờ thanh toán (Giữ kho 15p)'
              : order.orderStatus === 'PAID'
              ? 'Đã thanh toán'
              : order.orderStatus === 'PREPARING'
              ? 'Đang chuẩn bị tiệc'
              : order.orderStatus === 'COMPLETED'
              ? 'Hoàn thành'
              : order.orderStatus === 'EXPIRED'
              ? 'Hết hạn giữ chỗ'
              : 'Đã hủy'}
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200">
            Thanh toán: {order.paymentStatus}
          </span>
        </div>

        {/* Fact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="rounded-xl bg-stone-50 p-4 border border-stone-100">
            <span className="block text-[11px] text-stone-400 font-medium">Khách hàng:</span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 block">{order.customerName}</span>
            <span className="font-mono text-stone-500">{order.customerPhone}</span>
          </div>

          <div className="rounded-xl bg-stone-50 p-4 border border-stone-100">
            <span className="block text-[11px] text-stone-400 font-medium">Thời gian diễn ra:</span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 block">
              {formatDateTimeVn(order.eventDateTime)}
            </span>
            <span className="text-stone-500">
              {order.tableCount} bàn {order.guestCount ? `(~${order.guestCount} khách)` : `(~${order.tableCount * 10} người)`}
            </span>
          </div>

          <div className="rounded-xl bg-stone-50 p-4 border border-stone-100">
            <span className="block text-[11px] text-stone-400 font-medium">Thực đơn áp dụng:</span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 truncate block">
              {order.menuNameSnapshot || 'Thực đơn tự chọn'}
            </span>
            <span className="text-stone-500">{order.items.length} món ăn</span>
          </div>

          <div className="rounded-xl bg-stone-50 p-4 border border-stone-100">
            <span className="block text-[11px] text-stone-400 font-medium">Tổng giá trị tiệc:</span>
            <span className="font-mono font-bold text-amber-900 text-lg mt-0.5 block">
              {formatVnd(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Location & Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl bg-stone-50 p-3.5 border border-stone-200">
            <strong className="text-stone-900 font-semibold block mb-0.5">Địa điểm tổ chức:</strong>
            <span className="text-stone-700">{order.eventLocation || 'Chưa cung cấp'}</span>
          </div>

          {order.note ? (
            <div className="rounded-xl bg-stone-50 p-3.5 border border-stone-200 text-xs text-stone-700">
              <strong className="text-stone-900 font-semibold block mb-0.5">Ghi chú từ khách hàng:</strong> {order.note}
            </div>
          ) : (
            <div className="rounded-xl bg-stone-50 p-3.5 border border-stone-200 text-xs text-stone-400 italic">
              Không có ghi chú thêm từ khách hàng
            </div>
          )}
        </div>
      </div>

      {/* Two Columns: Dishes Snapshot & Reservation Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Dishes Snapshot Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-base text-stone-900 tracking-tight">
              Chi tiết món ăn bàn tiệc ({order.items.length} món)
            </h3>
          </div>

          <div className="divide-y divide-stone-100">
            {order.items.map((it, idx) => (
              <div key={it.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center font-mono font-bold text-stone-400">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-stone-900">{it.dishNameSnapshot}</div>
                    <div className="text-[11px] text-stone-500">
                      {formatVnd(it.unitPriceSnapshot)} x {it.quantityPerTable} phần/bàn
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-stone-900">{formatVnd(it.lineTotal)}</div>
                  <div className="text-[10px] text-stone-400 font-mono">Tổng: {it.totalQuantity} phần</div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-stone-200 pt-3 flex justify-between items-baseline text-sm font-bold text-stone-900">
            <span>Tổng cộng:</span>
            <span className="text-xl font-bold text-amber-900">
              {formatVnd(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Right Column: Reservation & Audit Trail (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Reservation Card */}
          {order.reservation && (
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-stone-900 tracking-tight">
                    Giữ chỗ kho nguyên liệu
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    order.reservation.status === 'ACTIVE'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : order.reservation.status === 'FULFILLED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : order.reservation.status === 'EXPIRED'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                >
                  {order.reservation.status === 'ACTIVE'
                    ? 'Đang giữ chỗ'
                    : order.reservation.status === 'FULFILLED'
                    ? 'Đã xuất dùng'
                    : order.reservation.status === 'EXPIRED'
                    ? 'Đã hết hạn'
                    : 'Đã giải phóng'}
                </span>
              </div>

              <div className="text-xs text-stone-600 space-y-1">
                <div>Hạn giữ kho: <strong className="text-stone-900">{formatDateTimeVn(order.reservation.expiresAt)}</strong></div>
                {order.reservation.releasedAt && (
                  <div className="text-rose-600 font-medium">
                    Đã giải phóng kho: {formatDateTimeVn(order.reservation.releasedAt)}
                  </div>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-stone-100 rounded-xl border border-stone-200 p-2.5 bg-stone-50 text-xs">
                {order.reservation.items.map((resItem) => (
                  <div key={resItem.id} className="py-1.5 flex justify-between">
                    <span className="text-stone-800 font-medium">{resItem.ingredientName}</span>
                    <span className="font-mono font-bold text-stone-900">
                      {resItem.quantity} {resItem.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Log Card */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <History className="h-4 w-4 text-amber-700" />
              <h3 className="font-bold text-sm text-stone-900 tracking-tight">
                Lịch sử trạng thái (Audit Log)
              </h3>
            </div>

            <div className="space-y-4">
              {order.statusHistories.map((hist) => (
                <div
                  key={hist.id}
                  className="relative pl-5 pb-2 text-xs border-l-2 border-amber-300 last:border-transparent"
                >
                  <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-amber-600" />
                  <div className="font-bold text-stone-900">
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
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-base text-stone-900">
                Quản trị viên hủy đơn tiệc
              </h3>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Thao tác hủy đơn <strong>{order.orderCode}</strong> sẽ lập tức giải phóng toàn bộ nguyên liệu đã giữ trong kho về lại tồn khả dụng.
            </p>

            <form onSubmit={handleAdminCancelOrder} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Lý do hủy đơn tiệc (Bắt buộc):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập lý do nghiệp vụ..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs focus:border-amber-600 focus:outline-none shadow-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="rounded-xl border border-stone-300 bg-white hover:bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-700 shadow-xs"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="rounded-xl bg-rose-700 hover:bg-rose-800 text-white px-4 py-2 text-xs font-semibold shadow-xs"
                >
                  {cancelling ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
