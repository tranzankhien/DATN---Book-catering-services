import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { menuService } from '../services/menuService';
import { catalogService } from '../services/catalogService';
import { orderService } from '../services/orderService';
import type {
  CreateOrderItemPayload,
  CreateOrderPayload,
  OrderPreviewResponseDto,
} from '../services/types';
import { formatVnd, formatQuantity } from '../hooks/useFormatters';
import { LoadingState, ErrorState } from '../components/StatusStates';
import { extractErrorMessage } from '../services/apiClient';

const STORAGE_KEY = 'banquethub_builder_draft';

export const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const menuIdParam = searchParams.get('menuId');
  const tablesParam = searchParams.get('tables');

  // Form Fields
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>('');
  const [eventTime, setEventTime] = useState<string>('18:00');
  const [tableCount, setTableCount] = useState<number>(
    tablesParam ? Math.max(1, parseInt(tablesParam) || 1) : 5
  );
  const [note, setNote] = useState<string>('');
  const [menuId, setMenuId] = useState<number | undefined>(
    menuIdParam ? Number(menuIdParam) : undefined
  );
  const [items, setItems] = useState<CreateOrderItemPayload[]>([]);

  // Preview & Submit State
  const [preview, setPreview] = useState<OrderPreviewResponseDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill user information if logged in
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.fullName || '');
      if (!customerEmail) setCustomerEmail(user.email || '');
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  // Set default eventDate to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setEventDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Load items from menu or sessionStorage
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        if (menuIdParam) {
          const menu = await menuService.getMenuById(Number(menuIdParam));
          if (!mounted) return;
          setMenuId(menu.id);
          const menuItems: CreateOrderItemPayload[] = menu.items.map((it) => ({
            dishId: it.dishId,
            quantityPerTable: it.quantityPerTable,
          }));
          setItems(menuItems);

          // Get preview
          const prev = await orderService.previewMenu(menu.id, tableCount);
          if (mounted) setPreview(prev);
          return;
        }

        // Otherwise load from draft
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.items && parsed.items.length > 0) {
            setItems(parsed.items);
            if (parsed.tableCount && !tablesParam) {
              setTableCount(parsed.tableCount);
            }
            const prev = await orderService.previewOrder({
              tableCount: parsed.tableCount || tableCount,
              items: parsed.items,
            });
            if (mounted) setPreview(prev);
            return;
          }
        }

        // If no menu and no draft
        if (mounted) {
          setError('Không tìm thấy thông tin thực đơn đặt tiệc. Vui lòng chọn món trước.');
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
  }, [menuIdParam]);

  // Update preview when tableCount changes
  const handleTableCountChange = async (newCount: number) => {
    const validCount = Math.max(1, newCount);
    setTableCount(validCount);
    try {
      if (menuId) {
        const prev = await orderService.previewMenu(menuId, validCount);
        setPreview(prev);
      } else if (items.length > 0) {
        const prev = await orderService.previewOrder({
          tableCount: validCount,
          items,
        });
        setPreview(prev);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast('Vui lòng nhập họ và tên người đặt', 'error');
      return;
    }
    if (!customerPhone.trim() || !/^(0|\+84)[0-9]{9,10}$/.test(customerPhone.trim())) {
      showToast('Vui lòng nhập số điện thoại hợp lệ (10 số)', 'error');
      return;
    }
    if (!customerEmail.trim()) {
      showToast('Vui lòng nhập địa chỉ email', 'error');
      return;
    }
    if (!eventDate) {
      showToast('Vui lòng chọn ngày tổ chức tiệc', 'error');
      return;
    }

    if (preview && !preview.canProceed) {
      showToast('Nguyên liệu trong kho không đủ để đáp ứng quy mô tiệc này', 'error');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Construct ISO OffsetDateTime with local timezone +07:00
      const eventDateTimeIso = `${eventDate}T${eventTime || '18:00'}:00+07:00`;

      // Generate idempotency key
      const idempotencyKey = crypto.randomUUID();

      const payload: CreateOrderPayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        eventDateTime: eventDateTimeIso,
        tableCount,
        note: note.trim() || undefined,
        menuId,
        items,
        idempotencyKey,
      };

      const createdOrder = await orderService.createOrder(payload, idempotencyKey);

      // Clear draft
      sessionStorage.removeItem(STORAGE_KEY);
      showToast('Đặt tiệc thành công! Hệ thống đang giữ nguyên liệu trong 15 phút.', 'success');
      navigate(`/orders/confirmation/${createdOrder.id}`);
    } catch (err) {
      const errMsg = extractErrorMessage(err);
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] py-20">
        <LoadingState message="Đang khởi tạo thông tin đặt tiệc..." />
      </div>
    );
  }

  if (error && !preview) {
    return (
      <div className="min-h-screen bg-[#faf8f5] py-20 max-w-3xl mx-auto px-4">
        <ErrorState message={error} />
        <div className="mt-6 text-center flex justify-center gap-4">
          <Link
            to="/menus"
            className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-semibold text-sm"
          >
            Xem Thực Đơn Mẫu
          </Link>
          <Link
            to="/menu-builder"
            className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-medium text-sm"
          >
            Tự Phối Món
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-800 pb-20">
      {/* Header */}
      <div className="bg-stone-900 text-white py-8 px-4 sm:px-8 border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/menu-builder"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-300 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại chọn món
          </Link>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            Xác Nhận & Đặt Tiệc BanquetHub
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm mt-1">
            Điền thông tin liên hệ và thời gian tổ chức tiệc. Hệ thống sẽ tự động giữ nguyên liệu ngay khi tạo đơn.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        <form onSubmit={handleSubmitOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT: CUSTOMER FORM (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Customer Contact Information */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5">
                <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-600" />
                  Thông Tin Người Đặt Tiệc
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                      Họ và tên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                      Số điện thoại <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0912345678"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                    Email nhận thông báo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="khachhang@gmail.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Mã xác nhận đơn hàng và hướng dẫn sẽ được gửi về email này.
                  </p>
                </div>
              </div>

              {/* Event Schedule & Size */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5">
                <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  Thời Gian & Quy Mô Buổi Tiệc
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                      Ngày tổ chức tiệc <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                      Giờ đón khách <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                    Số lượng bàn tiệc:
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={tableCount}
                      onChange={(e) => handleTableCountChange(parseInt(e.target.value) || 1)}
                      className="w-24 px-3 py-2 border border-stone-300 rounded-xl text-center font-bold text-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-xs text-stone-500">
                      Bàn tiêu chuẩn (Quy mô dự kiến {tableCount * 10} khách)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                    Ghi chú hoặc yêu cầu đặc biệt
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ví dụ: Cần chuẩn bị thêm 2 ghế trẻ em, phòng tiệc ấm cúng, ít cay..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Payment Phase 4 Notice */}
              <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-5 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                  <CreditCard className="w-4 h-4 text-amber-700" />
                  Thông Báo Thanh Toán Trực Tuyến (Phase 4)
                </div>
                <p className="text-xs leading-relaxed text-amber-800">
                  Cổng thanh toán điện tử trực tuyến VNPAY sẽ chính thức được kích hoạt tại <strong>Phase 4</strong>.
                  Sau khi bạn nhấn xác nhận đặt tiệc, đơn hàng sẽ được ghi nhận ở trạng thái <strong>CHỜ THANH TOÁN (PENDING_PAYMENT)</strong>.
                  Hệ thống cam kết lập tức kích hoạt cơ chế <strong>khóa giữ toàn bộ nguyên liệu tồn kho</strong> cho buổi tiệc của bạn trong vòng <strong>15 phút</strong>.
                </p>
              </div>
            </div>

            {/* RIGHT: ORDER SUMMARY (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-md sticky top-6">
                <h3 className="font-serif font-bold text-stone-900 text-base pb-3 border-b border-stone-200 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                  Tóm Tắt Đơn Tiệc
                </h3>

                {/* Items breakdown */}
                {preview && (
                  <div className="py-3">
                    <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                      Món ăn trong mỗi bàn ({preview.items.length} món):
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-stone-100 pr-1 scrollbar-thin">
                      {preview.items.map((it) => (
                        <div key={it.dishId} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="font-semibold text-stone-900 truncate block">
                              {it.dishName}
                            </span>
                            <span className="text-[11px] text-stone-500">
                              {formatVnd(it.unitPrice)} x {it.quantityPerTable} phần/bàn
                            </span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-semibold text-stone-800">
                              {formatVnd(it.lineTotal)}
                            </div>
                            <div className="text-[10px] text-stone-400">
                              Tổng {it.totalQuantity} phần
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock warnings */}
                {preview && !preview.canProceed && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 mb-3 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-rose-900">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Không đủ nguyên liệu trong kho:
                    </div>
                    {preview.validationMessages.map((msg, idx) => (
                      <div key={idx} className="pl-5 text-rose-700">
                        • {msg}
                      </div>
                    ))}
                  </div>
                )}

                {/* Price Breakdown */}
                {preview && (
                  <div className="pt-4 border-t border-stone-200 space-y-2.5 text-xs">
                    <div className="flex justify-between text-stone-600">
                      <span>Đơn giá mỗi bàn:</span>
                      <span className="font-semibold text-stone-900">
                        {formatVnd(preview.pricePerTable)}
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Số lượng bàn:</span>
                      <span className="font-semibold text-stone-900">{preview.tableCount} bàn</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-stone-900 pt-3 border-t border-stone-100">
                      <span>Tổng giá trị đơn tiệc:</span>
                      <span className="font-serif text-xl text-amber-800">
                        {formatVnd(preview.totalAmount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={submitting || (preview !== null && !preview.canProceed)}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all ${
                      submitting || (preview !== null && !preview.canProceed)
                        ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
                        : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    {submitting ? 'Đang Xử Lý Đặt Tiệc & Giữ Kho...' : 'Xác Nhận Đặt Tiệc'}
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-stone-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Được bảo vệ bởi cơ chế chống trùng lặp Idempotency
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
