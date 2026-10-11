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
          if (data.secondsRemaining !== undefined && data.secondsRemaining !== null) {
            setSecondsRemaining(Math.max(0, data.secondsRemaining));
          } else if (data.paymentExpiresAt) {
            const diff = Math.floor(
              (new Date(data.paymentExpiresAt).getTime() - Date.now()) / 1000
            );
            setSecondsRemaining(Math.max(0, diff));
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

  // Live countdown timer
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

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
      <div className="min-h-screen bg-[#faf8f5] py-20">
        <LoadingState message="Đang tải thông tin xác nhận đơn tiệc..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#faf8f5] py-20 max-w-3xl mx-auto px-4">
        <ErrorState message={error || 'Không tìm thấy đơn hàng.'} />
        <div className="mt-6 text-center">
          <Link to="/" className="text-amber-700 hover:underline text-sm">
            ← Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = secondsRemaining === 0 && order.orderStatus === 'PENDING_PAYMENT';

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-800 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12">
        {/* Success Banner */}
        <div className="bg-white rounded-3xl p-8 border border-stone-200/90 shadow-xl text-center relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mb-2">
            Đơn Đặt Tiệc Đã Được Tạo Thành Công!
          </h1>
          <p className="text-stone-500 text-sm max-w-lg mx-auto">
            Cảm ơn quý khách đã tin tưởng dịch vụ tiệc BanquetHub. Đơn tiệc của quý khách đã được tiếp nhận và giữ nguyên liệu.
          </p>

          {/* Order Code Box */}
          <div className="mt-6 inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-stone-100 border border-stone-200">
            <span className="text-xs text-stone-500 font-medium">Mã đơn đặt tiệc:</span>
            <span className="font-mono text-base font-bold text-stone-900">{order.orderCode}</span>
            <button
              onClick={copyOrderCode}
              className="p-1 hover:bg-stone-200 rounded-lg text-stone-600 transition-colors"
              title="Sao chép mã đơn"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {/* Countdown Clock Box */}
          <div className="mt-8 max-w-md mx-auto p-5 rounded-2xl bg-amber-50/80 border border-amber-300">
            <div className="flex items-center justify-center gap-2 text-amber-900 font-semibold text-xs uppercase tracking-wider mb-2">
              <Clock className="w-4 h-4 text-amber-700" />
              Thời Gian Giữ Chỗ Nguyên Liệu Tồn Kho
            </div>

            {isExpired ? (
              <div className="text-rose-700 font-bold text-lg flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Đã hết thời hạn 15 phút giữ chỗ
              </div>
            ) : (
              <div className="font-mono text-3xl sm:text-4xl font-extrabold text-amber-900 tracking-widest my-1">
                {timeFormatted}
              </div>
            )}

            <p className="text-[11px] text-amber-800 leading-relaxed mt-2">
              Kho nguyên liệu đã được khóa độc quyền 15 phút cho đơn tiệc này. Trong Phase 4, quý khách sẽ thanh toán qua VNPAY trong khoảng thời gian này để chuyển sang trạng thái ĐÃ XÁC NHẬN.
            </p>
          </div>
        </div>

        {/* Order Details Breakdown Card */}
        <div className="bg-white rounded-3xl p-8 border border-stone-200/90 shadow-sm space-y-6">
          <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-4">
            <FileCheck className="w-5 h-5 text-amber-600" />
            Chi Tiết Hợp Đồng Đặt Tiệc
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <div>
                <span className="text-stone-400 block font-medium">Khách hàng:</span>
                <span className="text-stone-900 font-semibold text-sm">{order.customerName}</span>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Số điện thoại:</span>
                <span className="text-stone-900 font-semibold">{order.customerPhone}</span>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Email liên hệ:</span>
                <span className="text-stone-900 font-semibold">{order.customerEmail}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-stone-400 block font-medium">Thời gian tổ chức:</span>
                <span className="text-stone-900 font-semibold text-sm">
                  {formatDateTimeVn(order.eventDateTime)}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Quy mô tiệc:</span>
                <span className="text-stone-900 font-semibold">
                  {order.tableCount} bàn (Khoảng {order.tableCount * 10} khách)
                </span>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Trạng thái đơn:</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  {order.orderStatus === 'PENDING_PAYMENT' ? 'Chờ thanh toán (15 phút)' : order.orderStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Dishes Snapshot Table */}
          <div className="pt-4 border-t border-stone-100">
            <h3 className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-3">
              Thực đơn đã khóa giá tại thời điểm đặt (Historical Immutability):
            </h3>

            <div className="divide-y divide-stone-100">
              {order.items.map((it, idx) => (
                <div key={it.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-stone-400 font-mono">{idx + 1}</span>
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

            <div className="mt-4 pt-4 border-t border-stone-200 flex justify-between items-baseline">
              <span className="font-bold text-stone-700 text-sm">Tổng cộng giá trị tiệc:</span>
              <span className="font-serif text-2xl font-bold text-amber-800">
                {formatVnd(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Phase 4 Payment Note */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <div className="font-semibold mb-0.5">Kế hoạch tích hợp VNPAY (Phase 4):</div>
              Ở Phase 3, đơn hàng hoàn tất việc xác thực nghiệp vụ, snapshot giá và giữ nguyên liệu. Trong Phase 4, cổng VNPAY sẽ xuất hiện tại đây cho phép quét mã QR hoặc thẻ ngân hàng để xác nhận thanh toán tức thì.
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex flex-wrap justify-between items-center gap-4">
            <Link
              to="/my-orders"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-md transition-colors"
            >
              Xem Danh Sách Đơn Hàng Của Tôi
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/"
              className="text-xs text-stone-500 hover:text-stone-800 transition-colors"
            >
              ← Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
