import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  ShieldCheck,
  QrCode,
  Copy,
  ExternalLink,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { paymentService, transactionLabels, type PaymentState } from '../services/paymentService';
import { extractErrorMessage } from '../services/apiClient';
import { formatDateTimeVn, formatVnd } from '../hooks/useFormatters';
import type { OrderDto } from '../services/types';

export function OrderPaymentPanel({
  order,
  allowPayment = false,
  onStatus,
}: {
  order: OrderDto;
  allowPayment?: boolean;
  onStatus?: (status: PaymentState) => void;
}) {
  const [state, setState] = useState<PaymentState>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [reload, setReload] = useState(0);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError('');
    paymentService
      .status(order.id)
      .then((data) => {
        if (active) {
          setState(data);
          onStatus?.(data);
        }
      })
      .catch((e) => {
        if (active) setError(extractErrorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [order.id, order.paymentStatus, reload]);

  useEffect(() => {
    const refresh = () => setReload((value) => value + 1);
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const status = onStatus ? order.paymentStatus : state?.paymentStatus ?? order.paymentStatus;
  const expiresAtMs = order.paymentExpiresAt
    ? new Date(order.paymentExpiresAt).getTime()
    : order.reservation?.expiresAt
    ? new Date(order.reservation.expiresAt).getTime()
    : 0;
  const remainingSec = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
  const remainingMin = Math.floor(remainingSec / 60);
  const remainingSecRem = remainingSec % 60;

  const payable =
    allowPayment &&
    (onStatus ? order.orderStatus : state?.orderStatus ?? order.orderStatus) === 'PENDING_PAYMENT' &&
    status === 'UNPAID' &&
    order.reservation?.status === 'ACTIVE' &&
    expiresAtMs > now;

  const checkoutConfigured = state?.orderId === order.id ? state.checkoutConfigured : undefined;

  const pay = async () => {
    if (busy || !payable || !checkoutConfigured) return;
    setBusy(true);
    setError('');
    try {
      const result = await paymentService.create(order.id);
      if (result.checkoutUrl !== 'https://pay-sandbox.sepay.vn/v1/checkout/init') {
        throw new Error('URL thanh toán Sandbox không hợp lệ.');
      }
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = result.checkoutUrl;
      form.hidden = true;
      for (const [name, value] of Object.entries(result.fields)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
      form.remove();
    } catch (e) {
      setError(extractErrorMessage(e));
      setBusy(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(text);
    setTimeout(() => setCopiedRef(null), 2500);
  };

  return (
    <section className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/80">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                Thanh toán trực tuyến VietQR
              </h2>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                SePay Sandbox
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Cổng thanh toán tự động quét mã QR ngân hàng Napas 24/7
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setReload((v) => v + 1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          title="Kiểm tra lại trạng thái giao dịch từ SePay"
        >
          <RefreshCw className="h-3.5 w-3.5 text-stone-500" />
          <span>Cập nhật trạng thái</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Status Ribbon */}
      {status === 'PAID' ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3.5 text-emerald-950">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-emerald-900">
              Đơn tiệc đã thanh toán thành công
            </h3>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Hệ thống đã tự động đối soát và khớp biên lai thanh toán. Hợp đồng tiệc đã được kích hoạt, nguyên liệu đã được bảo đảm để chuyển sang khâu chế biến bếp.
            </p>
          </div>
        </div>
      ) : status === 'PAYMENT_REVIEW' ? (
        <div className="rounded-xl bg-purple-50 border border-purple-200 p-4 flex items-start gap-3.5 text-purple-950">
          <AlertTriangle className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-purple-900">
              Giao dịch đang cần đối soát kế toán
            </h3>
            <p className="text-xs text-purple-800 leading-relaxed">
              Giao dịch đã được ghi nhận trên hệ thống nhưng cần bộ phận đối soát xác nhận thủ công. Quý khách vui lòng không thanh toán lại để tránh trừ tiền trùng lặp.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-amber-50/80 border border-amber-200/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm text-amber-950">
                Đang chờ thanh toán
              </h3>
              <p className="text-xs text-amber-800">
                {payable
                  ? 'Vui lòng thanh toán trước khi thời gian giữ kho kết thúc để bảo đảm thực đơn của bạn.'
                  : 'Đơn hiện không đủ điều kiện thanh toán hoặc thời hạn giữ kho đã kết thúc.'}
              </p>
            </div>
          </div>

          {payable && (
            <div className="flex items-center gap-2 rounded-xl bg-white/80 border border-amber-300 px-3.5 py-2 shrink-0 shadow-2xs">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Còn lại:
              </span>
              <span className="font-mono text-sm font-bold text-amber-900">
                {String(remainingMin).padStart(2, '0')}:{String(remainingSecRem).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Payment Action Button (Only for Customer with Payable status) */}
      {payable && (
        <div className="space-y-2 pt-1">
          {checkoutConfigured === false ? (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Cổng thanh toán SePay chưa được cấu hình Secret Key. Vui lòng liên hệ nhà hàng.</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <button
                type="button"
                disabled={busy || !checkoutConfigured}
                onClick={pay}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-sm py-3.5 px-6 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang kết nối cổng SePay Sandbox...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4" />
                    <span>Thanh toán ngay qua VietQR (SePay Sandbox)</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Mã QR tự động điền số tiền và nội dung chuyển khoản, kích hoạt tức thì không cần chụp ảnh biên nhận.</span>
          </div>
        </div>
      )}

      {allowPayment && status === 'UNPAID' && !payable && (
        <div className="text-xs text-stone-500 flex items-center gap-1.5 pt-1">
          <span>Thời hạn thanh toán đã qua. Quý khách vui lòng</span>
          <Link to="/menus" className="font-semibold text-amber-800 hover:underline">
            chọn mẫu thực đơn mới
          </Link>
          <span>hoặc liên hệ hotline để được phục vụ.</span>
        </div>
      )}

      {/* Transactions List */}
      {state?.transactions && state.transactions.length > 0 && (
        <div className="pt-3 border-t border-stone-100 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-stone-700 uppercase tracking-wider">
            <span>Lịch sử giao dịch ({state.transactions.length})</span>
            <span className="font-normal font-mono text-stone-400">VietQR Gateway</span>
          </div>

          <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 overflow-hidden bg-stone-50/50">
            {state.transactions.map((tx) => (
              <div key={tx.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        tx.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : tx.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : tx.status === 'REVIEW_REQUIRED'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {transactionLabels[tx.status] || tx.status}
                    </span>
                    <span className="font-mono font-bold text-stone-900">
                      {formatVnd(tx.amount)}
                    </span>
                    {tx.bankCode && (
                      <span className="text-[10px] text-stone-600 bg-stone-100 border border-stone-200/70 px-2 py-0.5 rounded-lg font-mono">
                        {tx.bankCode}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-stone-500 text-[11px]">
                    <span>Mã tham chiếu:</span>
                    <span className="font-mono font-semibold text-stone-800">{tx.transactionReference}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(tx.transactionReference)}
                      className="text-stone-400 hover:text-stone-700"
                      title="Sao chép mã tham chiếu"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    {copiedRef === tx.transactionReference && (
                      <span className="text-emerald-600 font-medium text-[10px]">Đã chép</span>
                    )}
                  </div>

                  {tx.providerTransactionNo && (
                    <div className="text-[11px] text-stone-500">
                      Mã SePay: <span className="font-mono text-stone-700">{tx.providerTransactionNo}</span>
                    </div>
                  )}

                  {tx.failureReason && (
                    <div className="text-[11px] text-rose-700 font-medium">
                      Lý do: {tx.failureReason}
                    </div>
                  )}
                </div>

                <div className="text-left sm:text-right text-[11px] text-stone-400 shrink-0">
                  <div>Tạo lúc: {formatDateTimeVn(tx.createdAt)}</div>
                  {tx.paidAt && (
                    <div className="text-emerald-700 font-medium">
                      Khớp thanh toán: {formatDateTimeVn(tx.paidAt)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
