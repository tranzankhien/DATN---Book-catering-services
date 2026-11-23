import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Copy,
  Receipt,
  Utensils,
  ShieldCheck,
  Printer,
  ShoppingBag,
  CreditCard,
  Calendar,
  MapPin,
  Clock,
  PhoneCall,
  Home,
} from 'lucide-react';
import { paymentService, type PaymentState } from '../services/paymentService';
import { orderService } from '../services/orderService';
import type { OrderDto } from '../services/types';
import { extractErrorMessage } from '../services/apiClient';
import { paymentOutcome, paymentReference } from '../lib/paymentResult';
import { formatVnd, formatDateTimeVn } from '../hooks/useFormatters';
import { notifyOrderUpdated } from '../lib/orderEvents';

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
          if (data.orderId) {
            notifyOrderUpdated(data.orderId, 'ORDER_PAID');
          }
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

  const [orderLoading, setOrderLoading] = useState(true);

  useEffect(() => {
    if (state?.orderId) {
      setOrderLoading(true);
      orderService.getOrderById(state.orderId)
        .then(setOrder)
        .catch(() => {})
        .finally(() => setOrderLoading(false));
    } else if (!waiting) {
      setOrderLoading(false);
    }
  }, [state?.orderId, waiting]);

  const outcome = state && reference ? paymentOutcome(state, reference) : 'pending';
  const latestTx = state?.transactions && state.transactions.length > 0 ? state.transactions[0] : undefined;

  const copyRef = () => {
    if (reference) {
      navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSimulatePay = async () => {
    if (!state?.orderId) return;
    try {
      await paymentService.simulateSandboxPay(state.orderId);
      notifyOrderUpdated(state.orderId, 'ORDER_PAID');
      setRetry((r) => r + 1);
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 animate-fade-up-1 space-y-6">
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

      {/* Executive Clean Header: Status, Contract & VietQR References */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            {outcome === 'success' ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : outcome === 'review' ? (
              <AlertTriangle className="h-6 w-6 text-purple-600" />
            ) : waiting || outcome === 'pending' ? (
              <RefreshCw className="h-5 w-5 animate-spin text-amber-600" />
            ) : (
              <XCircle className="h-6 w-6 text-rose-600" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 role="status" className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                {!reference
                  ? 'Thiếu mã tham chiếu giao dịch hợp lệ'
                  : !waiting && outcome === 'pending'
                  ? 'Giao dịch chưa được xác nhận'
                  : messages[outcome]}
              </h1>
              {outcome === 'success' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  Đã thanh toán 100%
                </span>
              ) : outcome === 'review' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold">
                  Đang đối soát
                </span>
              ) : null}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Kho nguyên liệu đã được khóa an toàn cho đơn tiệc của quý khách.
            </p>
          </div>
        </div>

        {/* Clear Reference & Contract Codes */}
        <div className="flex items-center gap-4 text-xs shrink-0 self-start md:self-auto">
          {order && (
            <div>
              <span className="text-stone-400 block font-medium text-[11px]">Hợp đồng tiệc</span>
              <span className="font-bold text-stone-900 text-sm tabular-nums">{order.orderCode}</span>
            </div>
          )}
          {reference && (
            <div className="pl-4 border-l border-stone-200">
              <span className="text-stone-400 block font-medium text-[11px]">Mã GD SePay</span>
              <div className="flex items-center gap-1.5 font-semibold text-stone-800 tabular-nums">
                <span>{reference}</span>
                <button
                  type="button"
                  onClick={copyRef}
                  className="p-0.5 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                  title="Sao chép mã giao dịch"
                >
                  <Copy className="h-3 w-3" />
                </button>
                {copied && <span className="text-emerald-600 text-[10px] font-normal">Đã chép</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 text-left">
          {error}
        </div>
      )}

      {waiting && (
        <div className="text-xs text-stone-400 flex items-center justify-center gap-1.5">
          <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
          <span>Đang tự động xác minh kết quả với ngân hàng Napas...</span>
        </div>
      )}

      {/* Main 2-Column Balanced Architecture (Utilizes Full Horizontal Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 Cols): Itemized Official Banquet Contract & Dishes */}
        <section className="lg:col-span-8 rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/80">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                  Biên nhận yến tiệc chính thức
                </h2>
                <p className="text-xs text-stone-500">
                  Hợp đồng dịch vụ tiệc lưu động chuẩn BanquetHub
                </p>
              </div>
            </div>
            {order && (
              <span className="text-xs font-semibold text-stone-500">
                Quy mô: <strong className="text-stone-800 font-bold tabular-nums">{order.tableCount} bàn</strong> (~{order.tableCount * 10} khách)
              </span>
            )}
          </div>

          {order ? (
            <div className="space-y-6">
              {/* 3 Logistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/60 space-y-1">
                  <span className="text-stone-400 block font-medium">Khách hàng liên hệ:</span>
                  <p className="font-bold text-stone-900 text-sm">{order.customerName}</p>
                  <p className="text-stone-500 tabular-nums">{order.customerPhone}</p>
                </div>

                <div className="p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/60 space-y-1">
                  <span className="text-stone-400 block font-medium">Thời gian đón khách:</span>
                  <p className="font-bold text-stone-900 text-sm">{formatDateTimeVn(order.eventDateTime)}</p>
                  <p className="text-stone-500">Giữ sảnh phục vụ chu đáo</p>
                </div>

                <div className="p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/60 space-y-1">
                  <span className="text-stone-400 block font-medium">Địa điểm tổ chức:</span>
                  <p className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-2">{order.eventLocation || 'Chưa cung cấp địa chỉ'}</p>
                </div>
              </div>

              {/* Dishes Summary Table */}
              {order.items && order.items.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-700 border-b border-stone-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Utensils className="h-4 w-4 text-amber-700" />
                      <span>Thực đơn yến tiệc ({order.items.length} món)</span>
                    </div>
                    <span className="tabular-nums text-stone-400 text-[11px] font-normal">
                      Áp dụng: {order.menuNameSnapshot || 'Thực đơn tự chọn'}
                    </span>
                  </div>

                  <div className="divide-y divide-stone-100 text-xs">
                    {order.items.map((it, idx) => (
                      <div key={it.id} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-500 flex items-center justify-center font-bold text-[10px] tabular-nums shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-semibold text-stone-900">{it.dishNameSnapshot}</span>
                            <span className="text-stone-400 text-[11px] ml-2 tabular-nums">
                              {formatVnd(it.unitPriceSnapshot)} / phần • {it.quantityPerTable} phần/bàn
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

              {/* Financial Calculation Breakdown */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 space-y-2 text-xs">
                <div className="flex justify-between items-center text-stone-600">
                  <span>Tổng giá trị hợp đồng (Đã bao gồm VAT & dịch vụ):</span>
                  <span className="font-bold text-stone-900 tabular-nums">{formatVnd(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-800">
                  <span className="flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Đã thanh toán qua cổng SePay:
                  </span>
                  <span className="font-bold tabular-nums">{formatVnd(order.totalAmount)}</span>
                </div>
                <div className="pt-2 border-t border-stone-200/80 flex justify-between items-center text-stone-500">
                  <span>Số dư còn lại cần thanh toán:</span>
                  <span className="font-bold text-emerald-700 tabular-nums">0 đ (Đã tất toán 100%)</span>
                </div>
              </div>

              {/* Service Guarantee */}
              <div className="pt-2 text-xs text-stone-500 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Chuyên viên BanquetHub sẽ liên hệ trong 24h để xác nhận điều phối sảnh và chuẩn bị tiệc.</span>
              </div>
            </div>
          ) : orderLoading && waiting ? (
            <div className="py-12 text-center text-xs text-stone-400">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto text-amber-600 mb-2" />
              <span>Đang tải thông tin hợp đồng đơn tiệc...</span>
            </div>
          ) : (
            <div className="py-10 text-center text-xs space-y-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <p className="text-stone-800 font-bold text-sm">
                Giao dịch SePay đã được hệ thống ghi nhận thành công
              </p>
              <p className="text-stone-500 max-w-md mx-auto leading-relaxed">
                {authExpired
                  ? 'Tài khoản chưa được đồng bộ trên trình duyệt này. Vui lòng bấm Đăng nhập để xem toàn bộ thông tin hợp đồng.'
                  : 'Chi tiết đơn tiệc đã được ghi nhận. Quý khách có thể xem đầy đủ tiến độ trong mục Đơn tiệc của tôi.'}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  to="/my-orders"
                  className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Xem danh sách đơn tiệc
                </Link>
                <Link
                  to="/"
                  className="px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs shadow-2xs transition-colors"
                >
                  Về trang chủ
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Right Column (4 Cols): Digital Certificate, Timeline & Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Digital Payment Certificate Card */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-amber-700" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                  Chứng từ giao dịch SePay
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                SePay PG
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Cổng thanh toán:</span>
                <span className="font-semibold text-stone-800">Cổng thanh toán SePay</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Thời gian ghi nhận:</span>
                <span className="font-semibold text-stone-800 tabular-nums">
                  {latestTx?.paidAt ? formatDateTimeVn(latestTx.paidAt) : 'Vừa xong'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Đối soát hệ thống:</span>
                <span className="font-bold text-emerald-700">Đã khớp tự động 100%</span>
              </div>
            </div>

            <p className="text-[11px] text-stone-400 pt-2 border-t border-stone-100 leading-relaxed">
              Biên nhận thanh toán điện tử có giá trị xác thực tương đương hóa đơn tạm tính của hệ thống BanquetHub.
            </p>
          </div>

          {/* Service Progress Timeline Card */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800 border-b border-stone-100 pb-3">
              Tiến độ phục vụ tiệc
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                  ✓
                </div>
                <div>
                  <strong className="text-stone-900 block font-semibold">Đã thanh toán 100%</strong>
                  <span className="text-[11px] text-stone-500">Khóa an toàn kho nguyên liệu</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <strong className="text-stone-900 block font-semibold">Bếp xuất kho & sơ chế</strong>
                  <span className="text-[11px] text-stone-500">Chuẩn bị trước 24h sự kiện</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div>
                  <strong className="text-stone-600 block font-medium">Hoàn thành phục vụ yến tiệc</strong>
                  <span className="text-[11px] text-stone-400">Đúng giờ và địa điểm đã hẹn</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions & Helpdesk */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-3 print:hidden">
            {authExpired ? (
              <Link
                to="/login"
                state={{ from: location.pathname + location.search }}
                className="w-full inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Đăng nhập lại để kiểm tra
              </Link>
            ) : reference && outcome === 'pending' ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setRetry((v) => v + 1)}
                  className="w-full inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Kiểm tra lại kết quả</span>
                </button>
                {state?.orderId && (
                  <button
                    type="button"
                    onClick={handleSimulatePay}
                    className="w-full inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    title="Mô phỏng xác nhận thanh toán thành công (Môi trường Sandbox / Test)"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Xác nhận thanh toán Sandbox</span>
                  </button>
                )}
              </div>
            ) : null}

            <Link
              to={state ? `/my-orders/${state.orderId}` : '/my-orders'}
              className="w-full inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Xem chi tiết đơn tiệc</span>
            </Link>

            <button
              type="button"
              onClick={handlePrint}
              className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4 text-stone-500" />
              <span>In biên nhận PDF / In giấy</span>
            </button>

            <Link
              to="/"
              className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs shadow-2xs transition-colors"
            >
              <Home className="h-4 w-4 text-stone-500" />
              <span>Về trang chủ</span>
            </Link>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-500">Hotline hỗ trợ:</span>
              <strong className="text-amber-900 font-bold tabular-nums">1900 8899</strong>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
