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
} from 'lucide-react';
import { paymentService, type PaymentState } from '../services/paymentService';
import { extractErrorMessage } from '../services/apiClient';
import { paymentOutcome, paymentReference } from '../lib/paymentResult';
import { formatVnd, formatDateTimeVn } from '../hooks/useFormatters';

const messages = {
  success: 'Thanh toán đã được xác nhận thành công!',
  review: 'Giao dịch đang được đối soát kế toán',
  closed: 'Đã hoàn tất đối soát giao dịch',
  failed: 'Thanh toán thất bại hoặc đã bị hủy',
  expired: 'Đơn tiệc hoặc giao dịch đã hết hạn',
  pending: 'Đang xác minh giao dịch với SePay...',
};

export function PaymentResultPage() {
  const location = useLocation();
  const reference = paymentReference(location.search);
  const [state, setState] = useState<PaymentState>();
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

  const outcome = state && reference ? paymentOutcome(state, reference) : 'pending';
  const latestTx = state?.transactions && state.transactions.length > 0 ? state.transactions[0] : undefined;

  const copyRef = () => {
    if (reference) {
      navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-up-1 space-y-6">
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
        <span className="font-semibold text-stone-900">Kết quả thanh toán</span>
      </nav>

      <section className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-10 shadow-xs space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800" />

        {/* Top Status Hero */}
        <div className="text-center space-y-4 max-w-xl mx-auto">
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
              Cổng thanh toán VietQR
            </div>
            <h1 role="status" className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              {!reference
                ? 'Thiếu mã tham chiếu giao dịch hợp lệ'
                : !waiting && outcome === 'pending'
                ? 'Giao dịch chưa được xác nhận'
                : messages[outcome]}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {outcome === 'success'
                ? 'Hệ thống đã nhận được thanh toán và kích hoạt hợp đồng tiệc. Bộ phận điều phối và bếp sẽ liên hệ hỗ trợ bạn.'
                : outcome === 'review'
                ? 'Khoản thanh toán đang chờ kế toán đối soát xác nhận. Vui lòng không thao tác chuyển tiền lại để tránh trừ tiền trùng lặp.'
                : outcome === 'expired'
                ? 'Thời gian giữ kho 15 phút đã kết thúc trước khi hoàn tất giao dịch. Quý khách vui lòng chọn lại thực đơn mới.'
                : 'Kết quả giao dịch đang được tự động đồng bộ theo thời gian thực từ cổng thanh toán.'}
            </p>
          </div>

          {reference && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-stone-50 border border-stone-200 px-3.5 py-2 text-xs tabular-nums text-stone-700">
              <span className="text-stone-400 text-[11px]">Mã tham chiếu:</span>
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

        {/* Transaction & Order Summary Receipt Card */}
        {state && (
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

            {latestTx?.paidAt && (
              <p className="text-[11px] text-stone-500 text-right">
                Thời gian ghi nhận giao dịch: <strong className="text-stone-700 tabular-nums">{formatDateTimeVn(latestTx.paidAt)}</strong>
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 border-t border-stone-100">
          {authExpired ? (
            <Link
              to="/login"
              state={{ from: location.pathname + location.search }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              Đăng nhập lại để kiểm tra
            </Link>
          ) : reference && !waiting && outcome === 'pending' ? (
            <button
              type="button"
              onClick={() => setRetry((v) => v + 1)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Kiểm tra lại kết quả</span>
            </button>
          ) : null}

          <Link
            to={state ? `/my-orders/${state.orderId}` : '/my-orders'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Xem chi tiết đơn tiệc</span>
          </Link>

          {state && (
            <Link
              to={`/orders/confirmation/${state.orderId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-xs shadow-2xs transition-colors"
            >
              <FileCheck2 className="h-3.5 w-3.5 text-stone-500" />
              <span>Xem trang hợp đồng & QR</span>
            </Link>
          )}

          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs shadow-2xs transition-colors"
          >
            Về trang chủ
          </Link>
        </div>
      </section>
    </main>
  );
}
