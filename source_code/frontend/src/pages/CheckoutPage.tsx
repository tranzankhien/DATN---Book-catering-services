import { EventLocationField, type MapPoint } from '../components/EventLocationField';
import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  RotateCw,
  Loader2,
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
  const guestsParam = searchParams.get('guests');

  // Form Fields
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>('');
  const [eventTime, setEventTime] = useState<string>('18:00');
  const [tableCount, setTableCount] = useState<number>(
    tablesParam ? Math.max(1, parseInt(tablesParam) || 1) : 6
  );
  const [guestCount, setGuestCount] = useState<number>(() => {
    if (guestsParam) {
      const g = parseInt(guestsParam, 10);
      if (!isNaN(g) && g > 0) return g;
    }
    // Only read from sessionStorage builder draft if this is NOT a predefined sample menu order
    if (!menuIdParam) {
      try {
        const saved = sessionStorage.getItem('banquethub_builder_draft');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.guestCount && parsed.guestCount > 0) {
            return parsed.guestCount;
          }
        }
      } catch {}
    }
    return tablesParam ? Math.max(1, parseInt(tablesParam) || 1) * 10 : 60;
  });
  const [eventLocation, setEventLocation] = useState<string>('');
  const [eventPoint, setEventPoint] = useState<MapPoint>();
  const [note, setNote] = useState<string>('');
  const [menuId, setMenuId] = useState<number | undefined>(
    menuIdParam ? Number(menuIdParam) : undefined
  );
  const [items, setItems] = useState<CreateOrderItemPayload[]>([]);

  // Stable Idempotency Key across retries of the same booking form
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  // Minimum booking date (today onwards - prevents booking in the past)
  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Preview & Submit State
  const [preview, setPreview] = useState<OrderPreviewResponseDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const previewSeqRef = useRef<number>(0);

  // Preview chỉ được coi là hợp lệ khi thành công, khớp chính xác số bàn hiện tại và không có lỗi
  const isPreviewSynchronized = Boolean(
    preview &&
    preview.tableCount === tableCount &&
    !previewLoading &&
    !previewError
  );

  const canSubmit = Boolean(
    !submitting &&
    isPreviewSynchronized &&
    preview?.canProceed
  );

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
          if (mounted) {
            setPreview(prev);
            if (prev.items && prev.items.length > 0) {
              setItems(
                prev.items.map((it) => ({
                  dishId: it.dishId,
                  quantityPerTable: it.quantityPerTable,
                }))
              );
            }
          }
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

  const handleTableCountChange = async (newCount: number, retry = false) => {
    const validCount = Math.max(1, newCount);
    setTableCount(validCount);
    if (!retry) setGuestCount(validCount * 10);
    // Đánh dấu xem trước cũ không còn hợp lệ ngay khi thay đổi số bàn
    setPreview(null);
    setPreviewError(null);
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
        if (prev.items && prev.items.length > 0) {
          setItems(
            prev.items.map((it) => ({
              dishId: it.dishId,
              quantityPerTable: it.quantityPerTable,
            }))
          );
        }
      }
    } catch (err) {
      if (seq === previewSeqRef.current) {
        setPreviewError(extractErrorMessage(err));
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
    if (eventDate < todayStr) {
      showToast('Ngày diễn ra tiệc không được ở trong quá khứ. Vui lòng chọn từ hôm nay trở đi.', 'error');
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
      showToast('Hệ thống đang kiểm tra tồn kho và tính lại giá, vui lòng đợi trong giây lát...', 'info');
      return;
    }
    if (previewError) {
      showToast(`Không thể đặt tiệc do lỗi tính giá xem trước: ${previewError}. Vui lòng thử lại.`, 'error');
      return;
    }
    if (!preview || preview.tableCount !== tableCount) {
      showToast('Thông tin xem trước chưa được đồng bộ với số bàn hiện tại. Vui lòng bấm Thử lại tính giá.', 'error');
      return;
    }
    if (!preview.canProceed) {
      showToast('Nguyên liệu trong kho không đủ để đáp ứng quy mô tiệc này', 'error');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Đảm bảo xem trước (preview) và tạo đơn (createOrder) đồng bộ 100% cùng danh sách món ăn
      const currentItems: CreateOrderItemPayload[] =
        preview?.items && preview.items.length > 0
          ? preview.items.map((it) => ({
              dishId: it.dishId,
              quantityPerTable: it.quantityPerTable,
            }))
          : items;

      const eventDateTimeIso = `${eventDate}T${eventTime || '18:00'}:00+07:00`;
      const normalizedPayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        eventDateTime: eventDateTimeIso,
        tableCount,
        guestCount: Number(guestCount),
        eventLocation: eventLocation.trim(),
        eventLatitude: eventPoint ? Number(eventPoint.lat.toFixed(6)) : undefined,
        eventLongitude: eventPoint ? Number(eventPoint.lon.toFixed(6)) : undefined,
        note: note.trim() || undefined,
        menuId,
        items: currentItems
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
        expectedTotalAmount: preview.totalAmount,
      };

      const createdOrder = await orderService.createOrder(payload, effectiveKey);

      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(IDEMPOTENCY_STORAGE_KEY);
      showToast('Đặt tiệc thành công! Xem thời hạn giữ kho ở trang xác nhận.', 'success');
      navigate(`/orders/confirmation/${createdOrder.id}`);
    } catch (err) {
      const errMsg = extractErrorMessage(err);
      setError(errMsg);
      showToast(errMsg, 'error');
      // If price changed or drifted, refresh quote immediately so user can see and confirm with latest price
      if (errMsg.toLowerCase().includes('giá') || errMsg.toLowerCase().includes('thay đổi')) {
        sessionStorage.removeItem(IDEMPOTENCY_STORAGE_KEY);
        handleTableCountChange(tableCount, true);
        setError('Báo giá món ăn đã có cập nhật từ nhà hàng. Bảng tính đã được tự động làm mới, quý khách vui lòng kiểm tra lại tổng tiền bên dưới và nhấn Xác nhận đặt tiệc.');
      }
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
            className="rounded-xl bg-amber-700 hover:bg-amber-800 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors"
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
              Vui lòng kiểm tra lại thông tin liên hệ và lịch tổ chức. Sau khi xác nhận, hệ thống sẽ kích hoạt lệnh khóa giữ nguyên liệu tồn kho cho tiệc của bạn tối đa 15 phút và không quá giờ tổ chức.
            </p>
          </div>

          <Link
            to="/menu-builder"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 shadow-xs transition-colors shrink-0"
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
                    min={todayStr}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Số lượng bàn tiệc <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={tableCount}
                      onChange={(e) => handleTableCountChange(parseInt(e.target.value) || 1)}
                      className="w-24 rounded-xl border border-stone-300 bg-white py-2.5 text-center font-bold text-base text-stone-900 focus:border-amber-600 focus:outline-none shadow-xs tabular-nums"
                    />
                    <span className="text-xs text-stone-500">
                      Bàn chuẩn (~<strong className="text-stone-800 tabular-nums">{tableCount * 10}</strong> khách)
                    </span>
                  </div>
                </div>

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
                    className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs tabular-nums"
                  />
                </div>
              </div>

              {/* Full Width Venue Address & Expansive OpenLayers Interactive Map */}
              <div className="pt-1">
                <EventLocationField
                  value={eventLocation}
                  point={eventPoint}
                  onChange={(address, point) => {
                    setEventLocation(address);
                    setEventPoint(point);
                  }}
                />
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

            {/* Payment Notice */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-900">
                <CreditCard className="h-4 w-4 text-amber-700" />
                <span>Phương thức thanh toán trực tuyến</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-800">
                Sau khi xác nhận đặt tiệc, quý khách có 15 phút để quét mã VietQR và hoàn tất thanh toán giữ chỗ thực đơn.
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
                {isPreviewSynchronized && preview && (
                  <span className="text-xs font-semibold text-stone-500 tabular-nums">
                    {preview.tableCount} bàn
                  </span>
                )}
              </div>

              {/* Preview Loading State */}
              {previewLoading && (
                <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-5 text-center space-y-2">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-amber-700" />
                  <div className="text-xs font-semibold text-amber-900">
                    Đang tính lại giá và kiểm tra tồn kho cho {tableCount} bàn...
                  </div>
                  <div className="text-[11px] text-amber-700">Vui lòng đợi trong giây lát</div>
                </div>
              )}

              {/* Preview Error Alert & Retry */}
              {previewError && !previewLoading && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs space-y-3">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>Lỗi tính giá xem trước ({tableCount} bàn):</span>
                  </div>
                  <div className="text-rose-700 text-[11px] leading-relaxed">
                    {previewError}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTableCountChange(tableCount, true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs cursor-pointer transition-colors shadow-xs"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Thử lại tính giá</span>
                  </button>
                </div>
              )}

              {/* Items Breakdown */}
              {isPreviewSynchronized && preview && (
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
                          <div className="text-[10px] text-stone-400 tabular-nums">
                            Tổng {it.totalQuantity} phần
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Warning Alert */}
              {isPreviewSynchronized && preview && !preview.canProceed && (
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

              {/* Order Submission Error / Price Drift Alert */}
              {error && preview && (
                <div className="rounded-xl bg-amber-50 border border-amber-300 p-3.5 text-xs text-amber-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Lưu ý đơn hàng / báo giá:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">{error}</p>
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.removeItem(IDEMPOTENCY_STORAGE_KEY);
                      handleTableCountChange(tableCount, true);
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs cursor-pointer transition-colors shadow-2xs"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Tải lại báo giá mới nhất</span>
                  </button>
                </div>
              )}

              {/* Price Calculation Box */}
              {isPreviewSynchronized && preview && (
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
                disabled={!canSubmit}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold py-3.5 shadow-xs transition-all ${
                  !canSubmit
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
                    : 'bg-amber-700 hover:bg-amber-800 text-white cursor-pointer shadow-sm'
                }`}
              >
                <Lock className="h-4 w-4" />
                <span>
                  {submitting
                    ? 'Đang tạo đơn & giữ kho...'
                    : previewLoading
                    ? 'Đang kiểm tra tồn kho...'
                    : previewError
                    ? 'Xem trước lỗi - Vui lòng thử lại'
                    : preview && !preview.canProceed
                    ? 'Kho không đủ nguyên liệu'
                    : !isPreviewSynchronized
                    ? 'Đang cập nhật xem trước...'
                    : 'Xác nhận đặt tiệc'}
                </span>
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Bảo mật thông tin & Khóa giữ chỗ kho 15 phút</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
