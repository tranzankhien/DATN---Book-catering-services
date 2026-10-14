import React, { useEffect, useState, useRef } from 'react';
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
  Info,
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
const IDEMPOTENCY_STORAGE_KEY = 'banquethub_checkout_idempotency';

const getOrGenerateIdempotencyKey = (currentPayloadSignature: string): string => {
  try {
    const savedStr = sessionStorage.getItem(IDEMPOTENCY_STORAGE_KEY);
    if (savedStr) {
      const saved = JSON.parse(savedStr);
      if (saved.signature === currentPayloadSignature && saved.key) {
        return saved.key;
      }
    }
  } catch (e) {
    // ignore
  }
  const newKey = crypto.randomUUID();
  try {
    sessionStorage.setItem(
      IDEMPOTENCY_STORAGE_KEY,
      JSON.stringify({ signature: currentPayloadSignature, key: newKey })
    );
  } catch (e) {
    // ignore
  }
  return newKey;
};

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
    tablesParam ? Math.max(1, parseInt(tablesParam) || 1) : 6
  );
  const [guestCount, setGuestCount] = useState<number>(
    tablesParam ? Math.max(1, parseInt(tablesParam) || 1) * 10 : 60
  );
  const [eventLocation, setEventLocation] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [menuId, setMenuId] = useState<number | undefined>(
    menuIdParam ? Number(menuIdParam) : undefined
  );
  const [items, setItems] = useState<CreateOrderItemPayload[]>([]);

  // Stable Idempotency Key across retries of the same booking form
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  // Preview & Submit State
  const [preview, setPreview] = useState<OrderPreviewResponseDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const previewSeqRef = useRef<number>(0);

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
          setError('Chưa có thông tin thực đơn đặt tiệc. Vui lòng chọn món hoặc thực đơn mẫu trước.');
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

  const handleTableCountChange = async (newCount: number) => {
    const validCount = Math.max(1, newCount);
    setTableCount(validCount);
    setGuestCount(validCount * 10);
    const seq = ++previewSeqRef.current;
    try {
      setPreviewLoading(true);
      setError(null);
      let prev: OrderPreviewResponseDto;
      if (menuId) {
        prev = await orderService.previewMenu(menuId, validCount);
      } else {
        prev = await orderService.previewOrder({
          tableCount: validCount,
          items,
        });
      }
      if (seq === previewSeqRef.current) {
        setPreview(prev);
      }
    } catch (err) {
      if (seq === previewSeqRef.current) {
        setError(extractErrorMessage(err));
      }
    } finally {
      if (seq === previewSeqRef.current) {
        setPreviewLoading(false);
      }
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
    if (!eventLocation.trim()) {
      showToast('Vui lòng nhập địa điểm tổ chức tiệc', 'error');
      return;
    }
    if (!guestCount || Number(guestCount) <= 0) {
      showToast('Vui lòng nhập số lượng khách dự kiến hợp lệ (từ 1 người)', 'error');
      return;
    }
    if (previewLoading) {
      showToast('Hệ thống đang kiểm tra tồn kho, vui lòng đợi trong giây lát...', 'info');
      return;
    }
    if (preview && !preview.canProceed) {
      showToast('Nguyên liệu trong kho không đủ để đáp ứng quy mô tiệc này', 'error');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const eventDateTimeIso = `${eventDate}T${eventTime || '18:00'}:00+07:00`;
      const normalizedPayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        eventDateTime: eventDateTimeIso,
        tableCount,
        guestCount: Number(guestCount),
        eventLocation: eventLocation.trim(),
        note: note.trim() || undefined,
        menuId,
        items: items
          .map((it) => ({ dishId: it.dishId, quantityPerTable: it.quantityPerTable }))
          .sort((a, b) => a.dishId - b.dishId),
      };

      const signature = JSON.stringify(normalizedPayload);
      const effectiveKey = getOrGenerateIdempotencyKey(signature);

      const payload: CreateOrderPayload = {
        ...normalizedPayload,
        guestCount: Number(guestCount),
        eventLocation: eventLocation.trim(),
        idempotencyKey: effectiveKey,
      };

      const createdOrder = await orderService.createOrder(payload, effectiveKey);

      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(IDEMPOTENCY_STORAGE_KEY);
      showToast('Đặt tiệc thành công! Hệ thống đang khóa giữ nguyên liệu 15 phút.', 'success');
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
      <div className="mx-auto max-w-7xl px-4 py-16">
        <LoadingState label="Đang khởi tạo thông tin hợp đồng tiệc..." />
      </div>
    );
  }

  if (error && !preview) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 space-y-4">
        <ErrorState message={error} />
        <div className="text-center flex justify-center gap-3">
          <Link
            to="/menus"
            className="rounded-xl bg-amber-800 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-900 transition-colors"
          >
            Xem thực đơn mẫu
          </Link>
          <Link
            to="/menu-builder"
            className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors shadow-xs"
          >
            Tự phối món
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up-1">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 font-medium">
        <Link to="/" className="hover:text-stone-900 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link to="/menu-builder" className="hover:text-stone-900 transition-colors">
          Phối thực đơn
        </Link>
        <span>/</span>
        <span className="font-semibold text-stone-900">Xác nhận đặt tiệc</span>
      </nav>

      {/* Header Banner */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              <span>Bảo mật & Giữ nguyên liệu tức thì</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Xác nhận thông tin & Đặt tiệc
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Vui lòng kiểm tra lại thông tin liên hệ và lịch tổ chức. Sau khi xác nhận, hệ thống sẽ kích hoạt lệnh khóa giữ nguyên liệu tồn kho cho tiệc của bạn trong 15 phút.
            </p>
          </div>

          <Link
            to="/menu-builder"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 transition-colors shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay lại chỉnh sửa thực đơn</span>
          </Link>
        </div>
      </div>

      {/* Main Form & Summary Grid */}
      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: FORM FIELDS (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Customer Details Card */}
            <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <User className="h-4 w-4 text-amber-700" />
                <h3 className="font-bold text-base text-stone-900 tracking-tight">
                  Thông tin người đặt tiệc
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  Địa chỉ email liên hệ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="khachhang@banquethub.vn"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
                />
                <p className="text-[11px] text-stone-400">
                  Thông báo mã đơn và biên nhận đặt tiệc sẽ được gửi về hộp thư này.
                </p>
              </div>
            </div>

            {/* Event Time & Scale Card */}
            <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <Calendar className="h-4 w-4 text-amber-700" />
                <h3 className="font-bold text-base text-stone-900 tracking-tight">
                  Thời gian & Quy mô buổi tiệc
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Ngày diễn ra tiệc <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Giờ đón khách <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  Số lượng bàn tiệc:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={tableCount}
                    onChange={(e) => handleTableCountChange(parseInt(e.target.value) || 1)}
                    className="w-24 rounded-xl border border-stone-300 py-2 text-center font-bold text-base text-stone-900 focus:border-amber-600 focus:outline-none shadow-xs"
                  />
                  <span className="text-xs text-stone-500">
                    Bàn tiêu chuẩn (khoảng <strong className="text-stone-800">{tableCount * 10}</strong> khách tham dự)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Số lượng khách dự kiến <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    required
                    placeholder="Ví dụ: 60"
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Địa điểm / Sảnh tổ chức tiệc <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Sảnh Hoàng Gia / Nhà riêng số 12..."
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  Ghi chú hoặc yêu cầu đặc biệt
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Bàn tiệc cần vị trí view sân vườn, bổ sung 2 ghế trẻ em..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
                />
              </div>
            </div>

            {/* Phase 4 Payment Notice */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-900">
                <CreditCard className="h-4 w-4 text-amber-700" />
                <span>Phương thức thanh toán trực tuyến (Kế hoạch Phase 4)</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-800">
                Cổng thanh toán điện tử trực tuyến VNPAY sẽ chính thức được kích hoạt tại <strong>Phase 4</strong>. Hiện tại, sau khi quý khách bấm <strong>Xác nhận đặt tiệc</strong>, đơn sẽ được ghi nhận ở trạng thái <strong>CHỜ THANH TOÁN (PENDING_PAYMENT)</strong> và hệ thống tự động khóa giữ toàn bộ nguyên liệu tồn kho độc quyền trong vòng <strong>15 phút</strong>.
              </p>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY (5 Cols) */}
          <div className="lg:col-span-5 sticky top-24 space-y-5">
            <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-amber-700" />
                  <h3 className="font-bold text-base text-stone-900 tracking-tight">
                    Tóm tắt đơn đặt tiệc
                  </h3>
                </div>
                {preview && (
                  <span className="font-mono text-xs font-semibold text-stone-500">
                    {preview.tableCount} bàn
                  </span>
                )}
              </div>

              {/* Items Breakdown */}
              {preview && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    <span>Món ăn mỗi bàn</span>
                    <span>Thành tiền</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-stone-100 rounded-xl bg-stone-50 p-3 border border-stone-100 scrollbar-thin">
                    {preview.items.map((it) => (
                      <div key={it.dishId} className="py-2 flex items-center justify-between text-xs">
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="font-bold text-stone-900 truncate block">
                            {it.dishName}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            {formatVnd(it.unitPrice)} x {it.quantityPerTable} phần/bàn
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-stone-900">
                            {formatVnd(it.lineTotal)}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            Tổng {it.totalQuantity} phần
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Warning Alert */}
              {preview && !preview.canProceed && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>Kho không đủ nguyên liệu:</span>
                  </div>
                  {preview.validationMessages.map((msg, idx) => (
                    <div key={idx} className="pl-5 text-rose-700 text-[11px]">
                      • {msg}
                    </div>
                  ))}
                </div>
              )}

              {/* Price Calculation Box */}
              {preview && (
                <div className="rounded-xl bg-stone-50 p-4 border border-stone-100 space-y-2.5 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Đơn giá 01 bàn:</span>
                    <span className="font-semibold text-stone-900">{formatVnd(preview.pricePerTable)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Số lượng bàn:</span>
                    <span className="font-semibold text-stone-900">{preview.tableCount} bàn</span>
                  </div>
                  <div className="border-t border-stone-200 pt-3 flex justify-between items-baseline text-sm font-bold text-stone-900">
                    <span>Tổng giá trị đơn tiệc:</span>
                    <span className="text-xl font-bold text-amber-900">
                      {formatVnd(preview.totalAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Confirm Button */}
              <button
                type="submit"
                disabled={submitting || previewLoading || (preview !== null && !preview.canProceed)}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold py-3.5 shadow-xs transition-all ${
                  submitting || previewLoading || (preview !== null && !preview.canProceed)
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
                    : 'bg-amber-800 hover:bg-amber-900 text-white cursor-pointer'
                }`}
              >
                <Lock className="h-4 w-4" />
                <span>
                  {submitting
                    ? 'Đang tạo đơn & giữ kho...'
                    : previewLoading
                    ? 'Đang kiểm tra tồn kho...'
                    : 'Xác nhận đặt tiệc'}
                </span>
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Bảo vệ chống trùng lặp Idempotency</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
