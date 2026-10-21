import { useState } from 'react';
import {
  CalendarCheck,
  CreditCard,
  ChefHat,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock4,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import type { OrderDto, OrderStatus } from '../services/types';
import { orderService } from '../services/orderService';
import { extractErrorMessage } from '../services/apiClient';
import { formatDateTimeVn } from '../hooks/useFormatters';

export const orderLabels: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  PREPARING: 'Đang chuẩn bị',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn giữ chỗ',
};

const stepConfig: { status: OrderStatus; label: string; desc: string; icon: typeof CalendarCheck }[] = [
  {
    status: 'PENDING_PAYMENT',
    label: 'Khởi tạo đặt tiệc',
    desc: 'Khóa giữ nguyên liệu 15p',
    icon: CalendarCheck,
  },
  {
    status: 'PAID',
    label: 'Đã thanh toán',
    desc: 'Hợp đồng được xác nhận',
    icon: CreditCard,
  },
  {
    status: 'PREPARING',
    label: 'Chuẩn bị yến tiệc',
    desc: 'Bếp sơ chế & chế biến',
    icon: ChefHat,
  },
  {
    status: 'COMPLETED',
    label: 'Hoàn thành phục vụ',
    desc: 'Tiệc đã diễn ra trọn vẹn',
    icon: CheckCircle2,
  },
];

export function OrderProgress({
  order,
  role,
  onUpdate,
}: {
  order: OrderDto;
  role?: 'admin' | 'employee';
  onUpdate?: (order: OrderDto) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isCancelled = order.orderStatus === 'CANCELLED';
  const isExpired = order.orderStatus === 'EXPIRED';
  const isTerminalNegative = isCancelled || isExpired;

  // Determine active step index (0 to 3)
  const stepStatuses: OrderStatus[] = ['PENDING_PAYMENT', 'PAID', 'PREPARING', 'COMPLETED'];
  const currentIndex = stepStatuses.indexOf(order.orderStatus);

  const next =
    order.paymentStatus === 'PAID'
      ? order.orderStatus === 'PAID'
        ? 'PREPARING'
        : order.orderStatus === 'PREPARING'
        ? 'COMPLETED'
        : undefined
      : undefined;

  async function advance() {
    if (!role || !next || busy) return;
    setBusy(true);
    setError('');
    try {
      const updated = await orderService.updateStatus(role, order.id, next);
      onUpdate?.(updated);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-5">
      {/* Top Header & Fast Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
              Tiến độ phục vụ tiệc
            </h2>
          </div>
          <p className="text-base font-bold text-stone-900 mt-0.5">
            Trạng thái hiện tại:{' '}
            <span
              className={
                isCancelled
                  ? 'text-rose-700'
                  : isExpired
                  ? 'text-stone-500'
                  : order.orderStatus === 'COMPLETED'
                  ? 'text-stone-900'
                  : 'text-amber-800'
              }
            >
              {orderLabels[order.orderStatus]}
            </span>
          </p>
        </div>

        {/* Staff / Admin Fast Advance Button */}
        {role && next && (
          <button
            type="button"
            disabled={busy}
            onClick={advance}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition-all cursor-pointer disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : next === 'PREPARING' ? (
              <>
                <ChefHat className="h-4 w-4" />
                <span>Chuyển sang: Bắt đầu chuẩn bị bếp</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Xác nhận hoàn thành tiệc</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Terminal Negative Alert Banner */}
      {isCancelled && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3 text-rose-900">
          <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-sm">Đơn đặt tiệc đã bị hủy</div>
            <p className="text-rose-700 leading-relaxed">
              Hệ thống đã giải phóng toàn bộ nguyên liệu giữ chỗ trong kho về lại tồn khả dụng.
            </p>
          </div>
        </div>
      )}

      {isExpired && (
        <div className="rounded-xl bg-stone-100 border border-stone-200 p-4 flex items-start gap-3 text-stone-800">
          <Clock4 className="h-5 w-5 text-stone-500 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-sm">Đơn tiệc đã hết thời hạn giữ chỗ</div>
            <p className="text-stone-600 leading-relaxed">
              Thời hạn thanh toán 15 phút đã kết thúc mà chưa nhận được xác nhận từ cổng thanh toán. Nguyên liệu đã được tự động hoàn lại kho.
            </p>
          </div>
        </div>
      )}

      {order.paymentStatus === 'PAYMENT_REVIEW' && (
        <div className="rounded-xl bg-purple-50 border border-purple-200 p-4 flex items-start gap-3 text-purple-900">
          <ShieldAlert className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-sm">Giao dịch đang cần đối soát kế toán</div>
            <p className="text-purple-700 leading-relaxed">
              Thanh toán đã được ghi nhận nhưng cần nhân viên xác nhận đối soát trước khi chuyển tiếp sang khâu chuẩn bị bếp.
            </p>
          </div>
        </div>
      )}

      {/* Modern Stepped Timeline */}
      <div className="py-2">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2 relative">
          {stepConfig.map((step, idx) => {
            const Icon = step.icon;
            const isFirstStepDone = isTerminalNegative && idx === 0;
            const isTerminalStep = isTerminalNegative && idx === 1;
            const isPast = isFirstStepDone || (!isTerminalNegative && currentIndex > idx);
            const isCurrent = !isTerminalNegative && currentIndex === idx;

            return (
              <div key={step.status} className="flex flex-col relative group">
                {/* Connecting Line for desktop */}
                {idx < stepConfig.length - 1 && (
                  <div
                    className={`hidden sm:block absolute top-5 left-1/2 w-full h-0.5 z-0 ${
                      isPast && !isTerminalStep ? 'bg-emerald-500' : 'bg-stone-200'
                    }`}
                  />
                )}

                <div className="flex items-center sm:flex-col sm:items-center text-left sm:text-center gap-3 sm:gap-2 z-10">
                  {/* Circle Node */}
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isTerminalStep
                        ? isCancelled
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : 'bg-stone-200 text-stone-600 border border-stone-300'
                        : isPast
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-amber-700 text-white ring-4 ring-amber-100 shadow-sm'
                        : 'bg-stone-100 text-stone-400 border border-stone-200'
                    }`}
                  >
                    {isTerminalStep ? (
                      isCancelled ? <XCircle className="h-5 w-5" /> : <Clock4 className="h-5 w-5" />
                    ) : isPast ? (
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="min-w-0">
                    <div
                      className={`text-xs font-bold ${
                        isTerminalStep
                          ? isCancelled
                            ? 'text-rose-700'
                            : 'text-stone-600'
                          : isPast
                          ? 'text-emerald-800'
                          : isCurrent
                          ? 'text-stone-900 font-extrabold'
                          : 'text-stone-400'
                      }`}
                    >
                      {isTerminalStep
                        ? isCancelled
                          ? 'Đã hủy giao dịch'
                          : 'Hết hạn giữ chỗ'
                        : step.label}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                      {isTerminalStep
                        ? isCancelled
                          ? 'Đã hoàn lại kho'
                          : 'Đã hoàn lại kho'
                        : step.desc}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
