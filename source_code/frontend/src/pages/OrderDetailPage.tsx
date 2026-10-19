import { OrderProgress } from '../components/OrderProgress';
import { OrderPaymentPanel } from '../components/OrderPaymentPanel';
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
  X,
  FileCheck,
  RotateCcw,
  PhoneCall,
  Utensils,
  MapPin,
  Users,
} from 'lucide-react';
import { orderService } from '../services/orderService';
import type { PaymentState } from '../services/paymentService';
import type { OrderDto } from '../services/types';
import { formatVnd, formatDateTimeVn } from '../hooks/useFormatters';
import { LoadingState, ErrorState } from '../components/StatusStates';
import { useToast } from '../hooks/useToast';
import { extractErrorMessage } from '../services/apiClient';
import { DEFAULT_DISH_IMAGE, handleImageError } from '../lib/imageConstants';

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
  const [paymentSnapshot, setPaymentSnapshot] = useState<PaymentState>();
  const [now, setNow] = useState(Date.now());
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

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !canCancel) return;
    try {
      setCancelling(true);
      const updated = await orderService.cancelOrder(
        order.id,
        cancelReason.trim() || 'Khách hàng yêu cầu hủy đơn'
      );
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

  const handleReorder = () => {
    if (!order || !order.items || order.items.length === 0) return;
    const draft = {
      items: order.items.map((it) => ({
        dishId: it.dishId,
        quantityPerTable: it.quantityPerTable,
      })),
      tableCount: order.tableCount,
      menuId: order.menuId,
    };
    sessionStorage.setItem('banquet_menu_builder_draft', JSON.stringify(draft));
    showToast('Đã khôi phục thực đơn vào Bàn Phối Món! Bạn có thể chỉnh sửa tiếp.', 'success');
    navigate('/menu-builder');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <LoadingState label="Đang nạp chi tiết đơn tiệc..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 space-y-4">
        <ErrorState message={error || 'Không tìm thấy đơn hàng.'} />
        <div className="text-center">
          <Link
            to="/my-orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900"
          >
            ← Quay về danh sách đơn tiệc
          </Link>
        </div>
      </div>
    );
  }

  const isExpired =
    order.orderStatus === 'EXPIRED' ||
    (order.orderStatus === 'PENDING_PAYMENT' &&
      order.paymentExpiresAt &&
      new Date(order.paymentExpiresAt).getTime() <= Date.now());

  const currentPayment = paymentSnapshot?.orderId === order.id ? paymentSnapshot : undefined;
  const eligibleToCancel =
    order.orderStatus === 'PENDING_PAYMENT' &&
    order.paymentStatus === 'UNPAID' &&
    Boolean(order.paymentExpiresAt && Date.parse(order.paymentExpiresAt) > now);
  const hasOpenAttempt = currentPayment?.transactions.some(
    (attempt) => attempt.status === 'PENDING' && Date.parse(attempt.expiresAt) > now
  );
  const cancellationHint = !currentPayment
    ? 'Cập nhật trạng thái thanh toán để kiểm tra khả năng hủy đơn.'
    : hasOpenAttempt
    ? 'Phiên SePay đang mở. Hãy đợi kết quả từ SePay hoặc đợi phiên hết hạn.'
    : '';
  const canCancel = eligibleToCancel && !cancellationHint;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up-1">
      {/* Top Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-stone-500">
        <Link to="/" className="hover:text-stone-900 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link to="/my-orders" className="hover:text-stone-900 transition-colors">
          Đơn tiệc của tôi
        </Link>
        <span>/</span>
        <span className="font-mono font-bold text-stone-900">{order.orderCode}</span>
      </nav>

      {/* Header Summary Banner (Spans Full Width 7xl) */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold text-stone-900">{order.orderCode}</span>
              <button
                type="button"
                onClick={copyOrderCode}
                className="rounded-lg p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                title="Sao chép mã đơn"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-stone-400 font-mono mt-1">
              Tạo lúc: {formatDateTimeVn(order.createdAt)} • Cập nhật: {formatDateTimeVn(order.updatedAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                order.orderStatus === 'PENDING_PAYMENT'
                  ? isExpired
                    ? 'bg-stone-100 text-stone-500 border-stone-300'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
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
              {order.orderStatus === 'PENDING_PAYMENT'
                ? isExpired
                  ? 'Hết hạn giữ chỗ'
                  : 'Chờ thanh toán (Giữ kho 15p)'
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

            <button
              type="button"
              onClick={handleReorder}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Khôi phục lại danh sách món và số bàn vào Menu Builder"
            >
              <RotateCcw className="h-3.5 w-3.5 text-amber-700" />
              <span>Đặt lại đơn này</span>
            </button>

            {eligibleToCancel && (
              <button
                type="button"
                disabled={!canCancel}
                aria-describedby={cancellationHint ? 'cancel-order-hint' : undefined}
                onClick={() => setCancelModalOpen(true)}
                className="rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy đơn tiệc
              </button>
            )}
          </div>
        </div>

        {eligibleToCancel && cancellationHint && (
          <p id="cancel-order-hint" className="text-sm text-stone-600">
            {cancellationHint}
          </p>
        )}

        {/* Fact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="rounded-xl bg-stone-50 p-4 border border-stone-100">
            <span className="block text-[11px] text-stone-400 font-medium">Thời gian tiệc:</span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 block">
              {formatDateTimeVn(order.eventDateTime)}
            </span>
          </div>

          <div className="rounded-xl bg-stone-50 p-4 border border-stone-100">
            <span className="block text-[11px] text-stone-400 font-medium">Quy mô bàn tiệc:</span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 block">
              {order.tableCount} bàn {order.guestCount ? `(~${order.guestCount} khách)` : `(~${order.tableCount * 10} khách)`}
            </span>
          </div>

          <div className="rounded-xl bg-stone-50 p-4 border border-stone-100">
            <span className="block text-[11px] text-stone-400 font-medium">Thực đơn áp dụng:</span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 truncate block">
              {order.menuNameSnapshot || 'Thực đơn tự chọn'}
            </span>
          </div>

          <div className="rounded-xl bg-stone-50 p-4 border border-stone-100">
            <span className="block text-[11px] text-stone-400 font-medium">Tổng giá trị đơn:</span>
            <span className="font-bold text-amber-900 text-base mt-0.5 block">
              {formatVnd(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Customer, Location & Note */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
          <div className="space-y-1">
            <span className="font-semibold text-stone-500 uppercase tracking-wider text-[11px]">
              Người liên hệ:
            </span>
            <div className="font-bold text-stone-800">
              {order.customerName} • {order.customerPhone}
            </div>
            <div className="text-stone-500">{order.customerEmail}</div>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-stone-500 uppercase tracking-wider text-[11px]">
              Địa điểm tổ chức:
            </span>
            <div className="font-bold text-stone-800">
              {order.eventLocation || 'Chưa cung cấp'}
              {order.eventLatitude != null && order.eventLongitude != null && (
                <a
                  className="ml-2 text-amber-800 underline font-normal"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.openstreetmap.org/?mlat=${order.eventLatitude}&mlon=${order.eventLongitude}#map=17/${order.eventLatitude}/${order.eventLongitude}`}
                >
                  Xem bản đồ
                </a>
              )}
            </div>
            {order.guestCount ? (
              <div className="text-stone-500">Quy mô: {order.guestCount} khách ({order.tableCount} bàn)</div>
            ) : (
              <div className="text-stone-400 italic">Chưa cung cấp số khách</div>
            )}
          </div>

          {order.note ? (
            <div className="space-y-1">
              <span className="font-semibold text-stone-500 uppercase tracking-wider text-[11px]">
                Ghi chú của khách:
              </span>
              <p className="rounded-xl bg-stone-50 p-2.5 text-stone-700 border border-stone-200 text-xs">
                {order.note}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="font-semibold text-stone-500 uppercase tracking-wider text-[11px]">
                Ghi chú:
              </span>
              <p className="text-stone-400 italic">Không có ghi chú thêm</p>
            </div>
          )}
        </div>
      </div>

      {/* Main 12-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 Cols): Progress, Dishes Breakdown, Audit Log */}
        <div className="lg:col-span-7 space-y-6">
          {/* Progress Timeline */}
          <OrderProgress order={order} />

          {/* Dishes Breakdown Card */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Utensils className="h-5 w-5 text-amber-700" />
                <h2 className="font-bold text-base text-stone-900 tracking-tight">
                  Chi tiết món ăn bàn tiệc ({order.items.length} món)
                </h2>
              </div>
              <span className="text-xs text-stone-500 font-medium">
                {order.tableCount} bàn x {order.items.length} món
              </span>
            </div>

            <div className="divide-y divide-stone-100">
              {order.items.map((it, idx) => (
                <div key={it.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center font-mono font-bold text-stone-400">
                      {idx + 1}
                    </span>
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                      <img
                        src={it.dishImageUrl || DEFAULT_DISH_IMAGE}
                        alt={it.dishNameSnapshot}
                        onError={handleImageError}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-stone-900 text-xs sm:text-sm">
                        {it.dishNameSnapshot}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {formatVnd(it.unitPriceSnapshot)} x {it.quantityPerTable} phần/bàn
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-stone-900 text-xs sm:text-sm font-mono">
                      {formatVnd(it.lineTotal)}
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">
                      Tổng {it.totalQuantity} phần
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-200 pt-3 flex justify-between items-baseline text-sm font-bold text-stone-900">
              <span>Tổng cộng thanh toán:</span>
              <span className="text-xl font-bold text-amber-900">
                {formatVnd(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Status History Audit Trail */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <History className="h-4 w-4 text-amber-700" />
              <h3 className="font-bold text-sm text-stone-900 tracking-tight">
                Nhật ký tiến độ đơn tiệc
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

        {/* Right Column (5 Cols, Sticky): VietQR Payment Panel & Reservation Card */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* VietQR SePay Payment Panel */}
          <OrderPaymentPanel
            key={order.id}
            order={order}
            allowPayment
            onStatus={(status) => {
              setPaymentSnapshot(status);
              setOrder((current) =>
                current?.id === status.orderId
                  ? {
                      ...current,
                      paymentStatus: status.paymentStatus,
                      orderStatus: status.orderStatus,
                      reservation: status.reservation,
                      statusHistories: status.statusHistories,
                    }
                  : current
              );
            }}
          />

          {/* Stock Reservation Card */}
          {order.reservation && (
            <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-stone-900">
                    Khóa giữ kho nguyên liệu
                  </h3>
                </div>
                <span className="font-mono text-[11px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                  {order.reservation.status}
                </span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                Đã khóa giữ <strong>{order.reservation.items.length}</strong> loại nguyên liệu trong kho. Thời hạn giữ chỗ:{' '}
                <strong className="text-stone-900">{formatDateTimeVn(order.reservation.expiresAt)}</strong>.
              </p>
            </div>
          )}

          {/* Hotline Card */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-amber-700" />
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Hỗ trợ điều phối tiệc
              </h4>
            </div>
            <p className="text-xs text-stone-600">
              Cần thay đổi danh sách món hoặc dời giờ đón khách? Liên hệ ngay:
            </p>
            <div className="rounded-xl bg-stone-50 p-3 border border-stone-200 text-xs flex justify-between items-center">
              <span className="text-stone-500">Hotline phục vụ:</span>
              <span className="font-mono font-bold text-amber-900 text-sm">1900 8899</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {cancelModalOpen && canCancel && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-base text-stone-900">
                Xác nhận hủy đơn tiệc
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
              Quý khách có chắc chắn muốn hủy đơn tiệc <strong>{order.orderCode}</strong> không?
              Toàn bộ nguyên liệu đang giữ trong kho sẽ được lập tức giải phóng về lại tồn khả dụng.
            </p>

            <form onSubmit={handleCancelOrder} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Lý do hủy đơn tiệc:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập lý do thay đổi kế hoạch..."
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
                  className="rounded-xl bg-rose-700 hover:bg-rose-800 text-white px-4 py-2 text-xs font-semibold shadow-xs disabled:opacity-50"
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
