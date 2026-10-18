import { OrderProgress } from '../components/OrderProgress';
import { OrderPaymentPanel } from '../components/OrderPaymentPanel';
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Copy,
  ChefHat,
  ArrowRight,
  ShieldAlert,
  CreditCard,
  FileCheck,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { orderService } from '../services/orderService';
import type { OrderDto } from '../services/types';
import { formatVnd, formatDateTimeVn } from '../hooks/useFormatters';
import { LoadingState, ErrorState } from '../components/StatusStates';
import { useToast } from '../hooks/useToast';
import { extractErrorMessage } from '../services/apiClient';

export const BookingConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900); // 15 mins default

  const calcRemaining = (expiresAt?: string | null) => {
    if (!expiresAt) return 0;
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  };

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await orderService.getOrderById(Number(id));
        if (mounted) {
          setOrder(data);
          if (data.paymentExpiresAt) {
            setSecondsRemaining(calcRemaining(data.paymentExpiresAt));
          } else if (data.secondsRemaining !== undefined && data.secondsRemaining !== null) {
            setSecondsRemaining(Math.max(0, data.secondsRemaining));
          }
        }
      } catch (err) {
        if (mounted) setError(extractErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Live countdown timer synced to real wall-clock time and tab focus
  useEffect(() => {
    if (!order?.paymentExpiresAt || order.orderStatus !== 'PENDING_PAYMENT') return;

    const updateTimer = () => {
      const remaining = calcRemaining(order.paymentExpiresAt);
      setSecondsRemaining(remaining);
      if (remaining <= 0 && id) {
        orderService.getOrderById(Number(id)).then(setOrder).catch(() => {});
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        updateTimer();
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [order?.paymentExpiresAt, order?.orderStatus, id]);

  const copyOrderCode = () => {
    if (order?.orderCode) {
      navigator.clipboard.writeText(order.orderCode);
      showToast(`Đã sao chép mã đơn: ${order.orderCode}`, 'info');
    }
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <LoadingState label="Đang nạp thông tin biên nhận đơn tiệc..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 space-y-4">
        <ErrorState message={error || 'Không tìm thấy đơn hàng.'} />
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900"
          >
            ← Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const isExpired =
    order.orderStatus === 'EXPIRED' ||
    (order.orderStatus === 'PENDING_PAYMENT' &&
      (secondsRemaining === 0 ||
        (order.paymentExpiresAt && new Date(order.paymentExpiresAt).getTime() <= Date.now())));

  const holdingStock = order.orderStatus === 'PENDING_PAYMENT' && !isExpired
    && order.reservation?.status === 'ACTIVE';
  const canPay = holdingStock && order.paymentStatus === 'UNPAID';

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up-1">
      {/* Success Celebration Card */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-10 shadow-xs text-center space-y-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800" />

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Đơn đặt tiệc đã được ghi nhận thành công!
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
            {order.paymentStatus === 'PAID'
              ? 'Đơn đã thanh toán thành công. Nhà hàng đang chuẩn bị phục vụ quý khách theo đúng tiến độ.'
              : order.paymentStatus === 'PAYMENT_REVIEW'
              ? 'Giao dịch đang được kế toán đối soát xác nhận.'
              : holdingStock
              ? 'Kho nguyên liệu đã được khóa giữ an toàn. Quý khách vui lòng hoàn tất thanh toán qua VietQR bên dưới.'
              : 'Quý khách có thể xem thông tin chi tiết và theo dõi tiến độ phục vụ bên dưới.'}
          </p>
        </div>

        {/* Order Code Pill */}
        <div className="inline-flex items-center gap-3 rounded-xl bg-stone-50 border border-stone-200/90 px-4 py-2.5">
          <span className="text-xs font-medium text-stone-500">Mã đơn đặt tiệc:</span>
          <span className="font-mono text-base font-bold text-stone-900">{order.orderCode}</span>
          <button
            type="button"
            onClick={copyOrderCode}
            className="rounded-lg p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200/70 transition-colors cursor-pointer"
            title="Sao chép mã đơn"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Payment Action Panel */}
      <OrderPaymentPanel
        key={order.id}
        order={order}
        allowPayment
        onStatus={(status) =>
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
          )
        }
      />

      {/* Service Progress Stepper */}
      <OrderProgress order={order} />

      {/* Order Contract Details Card */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-amber-700" />
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              Chi tiết hợp đồng đặt tiệc
            </h2>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
              order.orderStatus === 'PENDING_PAYMENT'
                ? isExpired
                  ? 'bg-stone-100 text-stone-500 border-stone-300'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
                : order.orderStatus === 'PAID'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : order.orderStatus === 'PREPARING'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : order.orderStatus === 'EXPIRED'
                ? 'bg-stone-100 text-stone-500 border-stone-300'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {order.orderStatus === 'PENDING_PAYMENT'
              ? isExpired
                ? 'Hết hạn giữ chỗ'
                : 'Chờ thanh toán (15 phút)'
              : order.orderStatus === 'PAID'
              ? 'Đã thanh toán'
              : order.orderStatus === 'PREPARING'
              ? 'Đang chuẩn bị tiệc'
              : order.orderStatus === 'EXPIRED'
              ? 'Hết hạn giữ chỗ'
              : order.orderStatus}
          </span>
        </div>

        {/* Fact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-3 rounded-xl bg-stone-50 p-4 border border-stone-100">
            <div>
              <span className="block text-[11px] text-stone-400 font-medium">Khách hàng đặt tiệc:</span>
              <span className="font-bold text-stone-900 text-sm">{order.customerName}</span>
            </div>
            <div>
              <span className="block text-[11px] text-stone-400 font-medium">Số điện thoại:</span>
              <span className="font-mono font-semibold text-stone-900">{order.customerPhone}</span>
            </div>
            <div>
              <span className="block text-[11px] text-stone-400 font-medium">Email liên hệ:</span>
              <span className="font-medium text-stone-900">{order.customerEmail}</span>
            </div>
            <div>
              <span className="block text-[11px] text-stone-400 font-medium">Địa điểm tổ chức:</span>
              <span className="font-semibold text-stone-900">{order.eventLocation || 'Chưa cung cấp'}
              {order.eventLatitude != null && order.eventLongitude != null && (
                <a className="ml-2 text-amber-800 underline" target="_blank" rel="noreferrer"
                  href={`https://www.openstreetmap.org/?mlat=${order.eventLatitude}&mlon=${order.eventLongitude}#map=17/${order.eventLatitude}/${order.eventLongitude}`}>
                  Xem bản đồ
                </a>
              )}</span>
            </div>
          </div>

          <div className="space-y-3 rounded-xl bg-stone-50 p-4 border border-stone-100">
            <div>
              <span className="block text-[11px] text-stone-400 font-medium">Thời gian tổ chức:</span>
              <span className="font-bold text-stone-900 text-sm">
                {formatDateTimeVn(order.eventDateTime)}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-stone-400 font-medium">Quy mô bàn tiệc:</span>
              <span className="font-semibold text-stone-900">
                {order.tableCount} bàn {order.guestCount ? `(~${order.guestCount} khách)` : '(Chưa cung cấp số khách)'}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-stone-400 font-medium">Thực đơn áp dụng:</span>
              <span className="font-semibold text-stone-900 truncate block">
                {order.menuNameSnapshot || 'Thực đơn tự chọn'}
              </span>
            </div>
            {order.note && (
              <div>
                <span className="block text-[11px] text-stone-400 font-medium">Ghi chú:</span>
                <span className="text-stone-700 italic">{order.note}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dishes Snapshot List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Thực đơn đã khóa giá tại thời điểm đặt (Historical Immutability):
          </h3>

          <div className="divide-y divide-stone-100 rounded-xl bg-stone-50 p-4 border border-stone-100">
            {order.items.map((it, idx) => (
              <div key={it.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center font-mono text-stone-400 font-bold">
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
                  <div className="text-[10px] text-stone-400 font-mono">Tổng {it.totalQuantity} phần</div>
                </div>
              </div>
            ))}

            <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline text-sm font-bold text-stone-900">
              <span>Tổng giá trị tiệc:</span>
              <span className="text-xl font-bold text-amber-900">
                {formatVnd(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};
