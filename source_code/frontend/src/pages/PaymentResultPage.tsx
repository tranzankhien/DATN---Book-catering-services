import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  RefreshCw,
  Copy,
  ArrowRight,
  ShieldAlert,
  ShoppingBag,
  Receipt,
  Sparkles,
  Calendar,
  FileCheck2,
  Utensils,
  MapPin,
  Users,
  Phone,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import { paymentService, type PaymentState } from '../services/paymentService';
import { orderService } from '../services/orderService';
import type { OrderDto } from '../services/types';
import { extractErrorMessage } from '../services/apiClient';
import { paymentOutcome, paymentReference } from '../lib/paymentResult';
import { formatVnd, formatDateTimeVn } from '../hooks/useFormatters';

const messages = {
  success: 'Thanh toán yến tiệc đã được xác nhận thành công!',
  review: 'Giao dịch đang được đối soát kế toán',
  closed: 'Đã hoàn tất đối soát giao dịch',
  failed: 'Thanh toán thất bại hoặc đã bị hủy',
  expired: 'Đơn tiệc hoặc giao dịch đã hết hạn',
  pending: 'Đang xác minh giao dịch với cổng thanh toán...',
};

export function PaymentResultPage() {
  const location = useLocation();
  const reference = paymentReference(location.search);
  const [state, setState] = useState<PaymentState>();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [error, setError] = useState('');
  const [authExpired, setAuthExpired] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [retry, setRetry] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!reference) {
      setWaiting(false);
      return;
    }
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    let attempts = 0;
    const deadline = Date.now() + 60000;
    setState(undefined);
    setWaiting(true);
    setError('');
    setAuthExpired(false);

    async function poll() {
      attempts++;
      try {
        const data = await paymentService.reference(reference!, controller.signal);
        if (!active) return;
        setState(data);
        setError('');
        if (paymentOutcome(data, reference!) !== 'pending') {
          setWaiting(false);
          return;
        }
      } catch (e) {
        if (!active) return;
        setError(extractErrorMessage(e));
        if (axios.isAxiosError(e) && [401, 403, 404].includes(e.response?.status ?? 0)) {
          setAuthExpired(e.response?.status === 401);
          setWaiting(false);
          return;
        }
      }
      if (attempts >= 12 || Date.now() >= deadline) {
        setWaiting(false);
        return;
      }
      timer = setTimeout(poll, 5000);
    }

    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [reference, retry]);

  useEffect(() => {
    if (state?.orderId) {
      orderService.getOrderById(state.orderId).then(setOrder).catch(() => {});
    }
  }, [state?.orderId]);

  const outcome = state && reference ? paymentOutcome(state, reference) : 'pending';
  const latestTx = state?.transactions && state.transactions.length > 0 ? state.transactions[0] : undefined;

  const copyRef = () => {
    if (reference) {
      navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 animate-fade-up-1 space-y-6">
      {/* Top Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 font-medium print:hidden">
        <Link to="/" className="hover:text-stone-900 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link to="/my-orders" className="hover:text-stone-900 transition-colors">
          Đơn tiệc của tôi
        </Link>
        <span>/</span>
        <span className="font-semibold text-stone-900">Biên nhận thanh toán</span>
      </nav>

      <section className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-10 shadow-xs space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800" />

        {/* Top Status Hero */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-xs">
            {outcome === 'success' ? (
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            ) : outcome === 'review' ? (
              <div className="h-16 w-16 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                <ShieldAlert className="h-8 w-8" />
              </div>
            ) : waiting || outcome === 'pending' ? (
              <div className="h-16 w-16 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center">
                <XCircle className="h-8 w-8" />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-0.5 text-[11px] font-semibold text-stone-600">
              Cổng thanh toán VietQR Napas
            </div>
            <h1 role="status" className="text-xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              {!reference
                ? 'Thiếu mã tham chiếu giao dịch hợp lệ'
                : !waiting && outcome === 'pending'
                ? 'Giao dịch chưa được xác nhận'
                : messages[outcome]}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {outcome === 'success'
                ? 'Khoản thanh toán đã được ghi nhận. Hợp đồng đặt tiệc đã chính thức kích hoạt thành công.'
                : outcome === 'review'
                ? 'Khoản thanh toán đang chờ kế toán đối soát xác nhận. Vui lòng không thao tác chuyển tiền lại để tránh trừ tiền trùng lặp.'
                : outcome === 'expired'
                ? 'Thời gian giữ kho 15 phút đã kết thúc trước khi hoàn tất giao dịch. Quý khách vui lòng chọn lại thực đơn mới.'
                : 'Kết quả giao dịch đang được tự động đồng bộ theo thời gian thực từ hệ thống thanh toán.'}
            </p>
          </div>

          {reference && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-stone-50 border border-stone-200 px-3.5 py-2 text-xs tabular-nums text-stone-700">
              <span className="text-stone-400 text-[11px]">Mã tham chiếu VietQR:</span>
              <span className="font-bold">{reference}</span>
              <button
                type="button"
                onClick={copyRef}
                className="p-1 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                title="Sao chép mã tham chiếu"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              {copied && <span className="text-emerald-600 text-[10px] font-medium">Đã chép</span>}
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 text-left">
              {error}
            </div>
          )}

          {waiting && (
            <div className="text-xs text-stone-400 flex items-center justify-center gap-1.5 pt-1">
              <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
              <span>Đang tự động xác minh kết quả với ngân hàng...</span>
            </div>
          )}
        </div>

        {/* Official Banquet Contract Receipt */}
        {order ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900 tracking-tight">
                    Biên nhận đặt tiệc & thanh toán chính thức
                  </h3>
                  <p className="text-xs text-stone-500">
                    BanquetHub • Ẩm thực yến tiệc Việt Nam
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="block text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
                  Mã hợp đồng tiệc
                </span>
                <span className="font-bold text-amber-900 text-base sm:text-lg tabular-nums">
                  {order.orderCode}
                </span>
              </div>
            </div>

            {/* Event & Customer Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs space-y-1">
                <span className="text-stone-400 block font-medium">Khách hàng liên hệ:</span>
                <p className="font-bold text-stone-900 text-sm">{order.customerName}</p>
                <p className="text-stone-600 tabular-nums">{order.customerPhone}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs space-y-1">
                <span className="text-stone-400 block font-medium">Thời gian đón khách:</span>
                <p className="font-bold text-stone-900 text-sm">{formatDateTimeVn(order.eventDateTime)}</p>
                <p className="text-stone-500">Giữ sảnh phục vụ chu đáo</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs space-y-1">
                <span className="text-stone-400 block font-medium">Quy mô bàn tiệc:</span>
                <p className="font-bold text-stone-900 text-sm tabular-nums">
                  {order.tableCount} bàn (~{order.tableCount * 10} khách)
                </p>
                <p className="text-stone-500 truncate">{order.menuNameSnapshot || 'Thực đơn tự chọn'}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs space-y-1">
                <span className="text-stone-400 block font-medium">Tổng tiền thanh toán:</span>
                <p className="font-bold text-amber-900 text-base tabular-nums">
                  {formatVnd(order.totalAmount)}
                </p>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Đã thanh toán 100%
                </span>
              </div>
            </div>

            {/* Event Address & Hall */}
            <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs text-xs space-y-1">
              <span className="text-stone-400 block font-medium">Địa điểm tổ chức yến tiệc:</span>
              <p className="font-semibold text-stone-900 leading-relaxed">{order.eventLocation || 'Chưa cung cấp địa chỉ'}</p>
            </div>

            {/* Dishes Summary Table */}
            {order.items && order.items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-stone-800 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Utensils className="h-3.5 w-3.5 text-amber-700" />
                    <span>Thực đơn yến tiệc đã chọn ({order.items.length} món)</span>
                  </div>
                  <span className="font-normal text-stone-400 text-[11px] tabular-nums">
                    Quy mô: {order.tableCount} bàn
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden divide-y divide-stone-100 text-xs">
                  {order.items.map((it, idx) => (
                    <div key={it.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-500 flex items-center justify-center font-bold text-[10px] tabular-nums">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-stone-900">{it.dishNameSnapshot}</span>
                          <span className="text-stone-400 text-[11px] ml-2 tabular-nums">
                            {formatVnd(it.unitPriceSnapshot)} • {it.quantityPerTable} phần/bàn
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-stone-900 tabular-nums">
                        {formatVnd(it.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps Guarantee Strip */}
            <div className="rounded-xl bg-amber-50/80 border border-amber-200/90 p-4 space-y-2 text-xs text-amber-950">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Quy trình phục vụ yến tiệc tiếp theo</span>
              </div>
              <ul className="space-y-1.5 text-stone-700 list-disc list-inside">
                <li>Bộ phận điều phối sảnh của BanquetHub sẽ gọi điện xác nhận chi tiết đón khách trong vòng 24 giờ.</li>
                <li>Bếp trưởng sẽ tiến hành xuất kho nguyên liệu tươi trong ngày tiệc theo định mức đã khóa giữ.</li>
                <li>Hợp đồng và biên nhận điện tử đã được lưu trữ trong mục <strong>"Đơn tiệc của tôi"</strong>.</li>
              </ul>
            </div>
          </div>
        ) : state ? (
          /* Fallback Compact Cards if Order Details are still loading */
          <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
              <div className="flex items-center gap-2 text-stone-800 font-bold text-sm">
                <Receipt className="h-4 w-4 text-amber-700" />
                <span>Biên lai xác nhận thanh toán trực tuyến</span>
              </div>
              <span className="text-xs font-bold text-stone-500 tabular-nums">
                Đơn hàng #{state.orderId}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-stone-200/70 shadow-2xs">
                <span className="block text-[11px] text-stone-400 font-medium">Số tiền thanh toán:</span>
                <span className="font-bold text-stone-900 text-base mt-0.5 block tabular-nums">
                  {latestTx ? formatVnd(latestTx.amount) : 'Theo đơn tiệc'}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-stone-200/70 shadow-2xs">
                <span className="block text-[11px] text-stone-400 font-medium">Trạng thái đơn:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold mt-1 border ${
                  state.orderStatus === 'PAID'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : state.orderStatus === 'PENDING_PAYMENT'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-stone-100 text-stone-700 border-stone-200'
                }`}>
                  {state.orderStatus === 'PAID' ? 'Đã thanh toán' : state.orderStatus === 'PENDING_PAYMENT' ? 'Chờ thanh toán' : state.orderStatus}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-stone-200/70 shadow-2xs">
                <span className="block text-[11px] text-stone-400 font-medium">Phương thức:</span>
                <span className="font-semibold text-stone-800 text-xs mt-1 block">
                  Chuyển khoản VietQR
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-stone-200/70 shadow-2xs">
                <span className="block text-[11px] text-stone-400 font-medium">Thời gian giao dịch:</span>
                <span className="font-semibold text-stone-800 text-xs mt-1 block tabular-nums">
                  {latestTx?.paidAt ? formatDateTimeVn(latestTx.paidAt) : 'Vừa xong'}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 border-t border-stone-100 print:hidden">
          {authExpired ? (
            <Link
              to="/login"
              state={{ from: location.pathname + location.search }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              Đăng nhập lại để kiểm tra
            </Link>
          ) : reference && !waiting && outcome === 'pending' ? (
            <button
              type="button"
              onClick={() => setRetry((v) => v + 1)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Kiểm tra lại kết quả</span>
            </button>
          ) : null}

          <Link
            to={state ? `/my-orders/${state.orderId}` : '/my-orders'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-11 px-6 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Xem chi tiết & tiến độ phục vụ đơn tiệc</span>
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4 text-stone-500" />
            <span>In biên nhận tiệc</span>
          </button>

          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs shadow-2xs transition-colors"
          >
            Về trang chủ
          </Link>
        </div>
      </section>
    </main>
  );
}