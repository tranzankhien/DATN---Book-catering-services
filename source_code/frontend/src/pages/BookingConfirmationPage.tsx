import { OrderProgress } from '../components/OrderProgress';
import { OrderPaymentPanel } from '../components/OrderPaymentPanel';
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Calendar,
  Copy,
  ArrowRight,
  PhoneCall,
  MapPin,
  Utensils,
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
          const rem = calcRemaining(data.paymentExpiresAt);
          setSecondsRemaining(rem);
        }
      } catch (err) {
        if (mounted) {
          setError(extractErrorMessage(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Countdown timer for 15-minute stock reservation
  useEffect(() => {
    if (!order?.paymentExpiresAt || order.orderStatus !== 'PENDING_PAYMENT') return;

    const timer = setInterval(() => {
      const rem = calcRemaining(order.paymentExpiresAt);
      setSecondsRemaining(rem);
      if (rem <= 0) {
        clearInterval(timer);
        // Refresh order status when expired
        orderService.getOrderById(Number(id)).then(setOrder).catch(() => {});
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [order?.paymentExpiresAt, order?.orderStatus, id]);

  const copyOrderCode = () => {
    if (order?.orderCode) {
      navigator.clipboard.writeText(order.orderCode);
      showToast(`Đã sao chép mã đơn: ${order.orderCode}`, 'info');
    }
  };

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

  const holdingStock =
    order.orderStatus === 'PENDING_PAYMENT' &&
    !isExpired &&
    order.reservation?.status === 'ACTIVE';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-up-1">
      {/* Top Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 font-medium">
        <Link to="/" className="hover:text-stone-900 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link to="/my-orders" className="hover:text-stone-900 transition-colors">
          Đơn tiệc của tôi
        </Link>
        <span>/</span>
        <span className="font-semibold text-stone-900 tabular-nums">Xác nhận {order.orderCode}</span>
      </nav>

      {/* Success Celebration Banner */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
              <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  Đơn đặt tiệc đã được ghi nhận thành công!
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold border ${
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
                      ? 'Hết hạn giữ kho'
                      : 'Chờ thanh toán (15 phút)'
                    : order.orderStatus === 'PAID'
                    ? 'Đã thanh toán'
                    : order.orderStatus === 'PREPARING'
                    ? 'Đang chuẩn bị tiệc'
                    : order.orderStatus === 'EXPIRED'
                    ? 'Hết hạn giữ kho'
                    : order.orderStatus}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                {order.paymentStatus === 'PAID'
                  ? 'Đơn đã thanh toán thành công. Bếp trưởng và đội ngũ phục vụ đã bắt đầu chuẩn bị tiệc.'
                  : holdingStock
                  ? 'Kho nguyên liệu đã được khóa giữ an toàn trong 15 phút. Vui lòng hoàn tất thanh toán để hợp đồng chính thức có hiệu lực.'
                  : 'Hệ thống đã ghi nhận hợp đồng đặt tiệc. Quý khách có thể theo dõi tiến độ chi tiết bên dưới.'}
              </p>
            </div>
          </div>

          {/* Order Code Pill */}
          <div className="flex items-center gap-3 shrink-0 rounded-xl bg-stone-50 border border-stone-200/90 px-4 py-2.5">
            <div className="text-left">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-stone-400">
                Mã hợp đồng tiệc
              </span>
              <span className="text-base sm:text-lg font-bold text-stone-900 tabular-nums">
                {order.orderCode}
              </span>
            </div>
            <button
              type="button"
              onClick={copyOrderCode}
              className="rounded-lg p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/70 transition-colors cursor-pointer"
              title="Sao chép mã đơn"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main 12-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column (6 Cols): Menu Dishes Snapshot, Event Logistics, Progress */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-6">
          {/* 1. Contract Dishes Snapshot */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/80 shrink-0">
                  <Utensils className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900 tracking-tight">
                    Thực đơn bàn tiệc ({order.items.length} món)
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Áp dụng: <strong className="text-stone-800 font-semibold">{order.menuNameSnapshot || 'Thực đơn tự chọn'}</strong> • Quy mô: <strong className="text-stone-800 font-semibold tabular-nums">{order.tableCount} bàn</strong> (~{order.tableCount * 10} khách)
                  </p>
                </div>
              </div>
            </div>

            {/* Dishes Items List */}
            <div className="divide-y divide-stone-100">
              {order.items.map((it, idx) => (
                <div key={it.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-stone-100 flex items-center justify-center font-bold text-stone-500 text-[11px] shrink-0 tabular-nums">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-stone-900 text-xs sm:text-sm">
                        {it.dishNameSnapshot}
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5 tabular-nums">
                        {formatVnd(it.unitPriceSnapshot)} / phần • {it.quantityPerTable} phần/bàn
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-stone-900 text-xs sm:text-sm tabular-nums">
                      {formatVnd(it.lineTotal)}
                    </div>
                    <div className="text-[10px] text-stone-400 tabular-nums">
                      Tổng {it.totalQuantity} phần ({order.tableCount} bàn)
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-between items-center text-xs sm:text-sm">
              <span className="font-semibold text-stone-600">Tổng cộng thanh toán (Đã gồm phí dịch vụ):</span>
              <span className="text-lg sm:text-xl font-bold text-amber-900 tabular-nums">
                {formatVnd(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* 2. Event Logistics & Contact Card (Clean Key-Value, NO Double Boxes) */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Calendar className="h-4 w-4 text-amber-700" />
              <h3 className="font-bold text-base text-stone-900 tracking-tight">
                Thời gian & Thông tin tổ chức tiệc
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1">
                <span className="text-stone-400 block font-medium">Khách hàng liên hệ:</span>
                <p className="font-bold text-stone-900 text-sm">{order.customerName}</p>
                <p className="text-stone-600 tabular-nums">{order.customerPhone} • {order.customerEmail}</p>
              </div>

              <div className="space-y-1">
                <span className="text-stone-400 block font-medium">Thời gian đón khách:</span>
                <p className="font-bold text-stone-900 text-sm">{formatDateTimeVn(order.eventDateTime)}</p>
                <p className="text-stone-500">Quy mô: {order.tableCount} bàn (~{order.tableCount * 10} khách)</p>
              </div>

              <div className="space-y-1 sm:col-span-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400 block font-medium">Địa điểm tổ chức:</span>
                  {order.eventLatitude != null && order.eventLongitude != null && (
                    <a
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-900 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.openstreetmap.org/?mlat=${order.eventLatitude}&mlon=${order.eventLongitude}#map=17/${order.eventLatitude}/${order.eventLongitude}`}
                    >
                      <MapPin className="h-3 w-3" />
                      <span>Xem bản đồ →</span>
                    </a>
                  )}
                </div>
                <p className="font-semibold text-stone-900 text-xs sm:text-sm leading-relaxed mt-0.5">
                  {order.eventLocation || 'Chưa cung cấp'}
                </p>
                {order.note && (
                  <p className="text-stone-500 italic text-xs mt-1">
                    Ghi chú: "{order.note}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 3. Progress Timeline */}
          <OrderProgress order={order} />
        </div>

        {/* Right Column (6 Cols, Sticky): VietQR Payment Panel & Support */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-6 lg:sticky lg:top-24">
          {/* VietQR Payment Panel */}
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

          {/* Luxury Concierge & Hotline Support Card (Clean, No Box-in-a-Box) */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80">
                <PhoneCall className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Tổng đài hỗ trợ yến tiệc
                </h4>
                <p className="text-[11px] text-stone-500">Phục vụ 24/7 đối soát & điều phối sảnh</p>
              </div>
            </div>

            <div className="divide-y divide-stone-100 text-xs">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-stone-500">Hotline đặt tiệc:</span>
                <span className="font-bold text-amber-900 text-sm tabular-nums">1900 8899</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-stone-500">Cam kết chất lượng:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Chuẩn VSATTP 100%
                </span>
              </div>
            </div>
          </div>

          {/* Navigation link back to orders */}
          <div className="text-center pt-1">
            <Link
              to="/my-orders"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
            >
              <span>Xem tất cả đơn tiệc của tôi</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
