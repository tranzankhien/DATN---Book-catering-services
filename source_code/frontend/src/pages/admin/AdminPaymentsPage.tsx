import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  ShieldAlert,
  Mail,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Send,
  Check,
  RotateCw,
  History,
  FileText,
  Filter,
} from 'lucide-react';
import {
  paymentService,
  transactionLabels,
  type PaymentView,
  type NotificationView,
} from '../../services/paymentService';
import { extractErrorMessage } from '../../services/apiClient';
import { formatDateTimeVn, formatVnd } from '../../hooks/useFormatters';

type Tab = 'payments' | 'review' | 'notifications';
const tabs: { key: Tab; label: string; icon: typeof CreditCard }[] = [
  { key: 'payments', label: 'Tất cả giao dịch', icon: CreditCard },
  { key: 'review', label: 'Cần đối soát (Review)', icon: ShieldAlert },
  { key: 'notifications', label: 'Email thông báo', icon: Mail },
];

export function AdminPaymentsPage() {
  const [search, setSearch] = useSearchParams();
  const requestedTab = search.get('tab');
  const tab: Tab =
    requestedTab === 'review' || requestedTab === 'notifications' ? requestedTab : 'payments';
  const notificationStatus = search.get('status') === 'FAILED' ? 'FAILED' : '';

  const [payments, setPayments] = useState<PaymentView[]>([]);
  const [notifications, setNotifications] = useState<NotificationView[]>([]);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [review, setReview] = useState<{ id: number; reason: string; reference: string }>();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    async function load() {
      let changingPage = false;
      function acceptPage(totalPages: number) {
        const lastPage = Math.max(0, totalPages - 1);
        if (page > lastPage) {
          changingPage = true;
          setPage(lastPage);
          return false;
        }
        setPages(totalPages);
        return true;
      }
      try {
        if (tab === 'notifications') {
          const result = await paymentService.notifications(page, notificationStatus);
          if (active && acceptPage(result.totalPages)) setNotifications(result.content);
        } else {
          const result = await paymentService.list(page, tab === 'review');
          if (active && acceptPage(result.totalPages)) setPayments(result.content);
        }
      } catch (cause) {
        if (active) setError(extractErrorMessage(cause));
      } finally {
        if (active && !changingPage) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [tab, page, refresh, notificationStatus]);

  async function perform(action: () => Promise<unknown>) {
    setError('');
    setBusy(true);
    try {
      await action();
      setRefresh((value) => value + 1);
    } catch (cause) {
      setError(extractErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(text);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-8 animate-fade-up-1">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
            <CreditCard className="h-4 w-4" />
            <span>Phân hệ tài chính / Thanh toán & Đối soát SePay</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight mt-1">
            Đối soát thanh toán & Thông báo email
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Theo dõi log giao dịch cổng SePay Sandbox, xử lý đối soát thủ công và lịch sử gửi thư xác nhận đặt tiệc.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setRefresh((v) => v + 1)}
            disabled={loading || busy}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors shadow-xs cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Bar & Filters */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setSearch({ tab: t.key });
                  setPage(0);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 shadow-2xs'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {tab === 'notifications' && (
          <div className="flex items-center gap-2 text-xs font-medium text-stone-600">
            <Filter className="h-3.5 w-3.5 text-stone-400" />
            <span>Lọc trạng thái:</span>
            <select
              value={notificationStatus}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value ? { tab, status: e.target.value } : { tab });
              }}
              className="rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-600"
            >
              <option value="">Tất cả email</option>
              <option value="FAILED">Gửi thất bại (Cần gửi lại)</option>
            </select>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-400">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-600 mb-2" />
            <p className="font-medium text-xs">Đang tải dữ liệu {tabs.find((t) => t.key === tab)?.label}...</p>
          </div>
        ) : tab === 'notifications' ? (
          /* Notifications Table */
          notifications.length === 0 ? (
            <div className="py-16 text-center text-stone-400 space-y-2">
              <Mail className="h-8 w-8 mx-auto text-stone-300" />
              <p className="font-semibold text-stone-600 text-sm">Chưa có lịch sử email thông báo nào</p>
              <p className="text-xs text-stone-400">Các email biên nhận và xác nhận thanh toán sẽ hiển thị tại đây.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Đơn tiệc</th>
                    <th className="py-3.5 px-4">Loại thông báo</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                    <th className="py-3.5 px-4 text-center">Số lần gửi</th>
                    <th className="py-3.5 px-4">Thời gian / Lỗi gần nhất</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {notifications.map((row) => (
                    <tr key={row.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-stone-900 whitespace-nowrap">
                        <Link
                          to={`/admin/orders/${row.orderId}`}
                          className="font-bold text-amber-800 hover:underline inline-flex items-center gap-1 tabular-nums"
                        >
                          <span>Đơn #{row.orderId}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-stone-800">{row.eventType}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            row.status === 'SENT'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : row.status === 'FAILED'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {row.status === 'SENT' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Đã gửi
                            </>
                          ) : row.status === 'FAILED' ? (
                            <>
                              <XCircle className="h-3 w-3" />
                              Thất bại
                            </>
                          ) : (
                            row.status
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-stone-600 whitespace-nowrap tabular-nums font-semibold">
                        {row.attempts} lần
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-stone-700">
                          {row.sentAt ? formatDateTimeVn(row.sentAt) : 'Chưa gửi thành công'}
                        </div>
                        {row.lastError && (
                          <div className="text-[11px] text-rose-700 line-clamp-1 mt-0.5" title={row.lastError}>
                            {row.lastError}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {row.status === 'FAILED' && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void perform(() => paymentService.retry(row.id))}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Send className="h-3 w-3" />
                            <span>Gửi lại</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Payments Table */
          payments.length === 0 ? (
            <div className="py-16 text-center text-stone-400 space-y-2">
              <CreditCard className="h-8 w-8 mx-auto text-stone-300" />
              <p className="font-semibold text-stone-600 text-sm">
                {tab === 'review' ? 'Không có giao dịch nào cần đối soát' : 'Chưa có giao dịch thanh toán nào'}
              </p>
              <p className="text-xs text-stone-400">
                {tab === 'review'
                  ? 'Tất cả các giao dịch đều đã được đối soát tự động thành công.'
                  : 'Giao dịch qua cổng SePay Sandbox sẽ được lưu vết đầy đủ tại đây.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Mã tham chiếu / SePay</th>
                    <th className="py-3.5 px-4">Đơn tiệc</th>
                    <th className="py-3.5 px-4 text-right">Số tiền</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                    <th className="py-3.5 px-4">Thời gian thanh toán</th>
                    <th className="py-3.5 px-4 text-right">Thao tác đối soát</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {payments.map((row) => (
                    <React.Fragment key={row.id}>
                      <tr className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="tabular-nums font-bold text-stone-900">{row.transactionReference}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(row.transactionReference)}
                              className="text-stone-400 hover:text-stone-700"
                              title="Sao chép mã tham chiếu"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            {copiedRef === row.transactionReference && (
                              <span className="text-[10px] text-emerald-600 font-medium">Đã chép</span>
                            )}
                          </div>
                          {row.providerTransactionNo && (
                            <div className="text-[11px] text-stone-500 tabular-nums mt-0.5">
                              ID SePay: {row.providerTransactionNo}
                            </div>
                          )}
                          {row.failureReason && (
                            <div className="text-[11px] text-amber-800 mt-0.5 font-medium">
                              Lưu ý: {row.failureReason}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-stone-900 whitespace-nowrap">
                          <Link
                            to={`/admin/orders/${row.orderId}`}
                            className="font-bold text-amber-800 hover:underline inline-flex items-center gap-1 tabular-nums"
                          >
                            <span>Đơn #{row.orderId}</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-amber-900 text-sm whitespace-nowrap tabular-nums">
                          {formatVnd(row.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              row.status === 'SUCCESS'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : row.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : row.status === 'REVIEW_REQUIRED'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {transactionLabels[row.status] || row.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 whitespace-nowrap">
                          {row.paidAt ? formatDateTimeVn(row.paidAt) : 'Chưa ghi nhận'}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                          {row.provider === 'SEPAY' && row.status !== 'SUCCESS' && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void perform(() => paymentService.query(row.id))}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                              title="Truy vấn trạng thái giao dịch từ máy chủ SePay"
                            >
                              <RotateCw className="h-3 w-3" />
                              <span>Truy vấn SePay</span>
                            </button>
                          )}

                          {row.status === 'REVIEW_REQUIRED' && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setReview(
                                  review?.id === row.id
                                    ? undefined
                                    : { id: row.id, reason: '', reference: '' }
                                )
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                            >
                              <ShieldAlert className="h-3 w-3" />
                              <span>{review?.id === row.id ? 'Đóng form' : 'Xử lý đối soát'}</span>
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Review Resolution Inline Box */}
                      {review?.id === row.id && (
                        <tr>
                          <td colSpan={6} className="bg-purple-50/50 p-4 border-b border-purple-100">
                            <div className="max-w-2xl mx-auto rounded-xl bg-white border border-purple-200 p-5 space-y-4 shadow-sm">
                              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                                  <ShieldAlert className="h-4 w-4 text-purple-700" />
                                  <span>Xử lý đối soát giao dịch {row.transactionReference}</span>
                                </h4>
                                <span className="text-xs font-bold text-amber-900 tabular-nums">
                                  {formatVnd(row.amount)}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-xs font-semibold text-stone-700">
                                  Lý do xử lý đối soát <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                  value={review.reason}
                                  maxLength={300}
                                  disabled={busy}
                                  rows={2}
                                  placeholder="Ghi rõ kết quả kiểm tra với ngân hàng hoặc lý do duyệt/từ chối..."
                                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs focus:border-purple-600 focus:outline-none"
                                  onChange={(e) => setReview({ ...review, reason: e.target.value })}
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-xs font-semibold text-stone-700">
                                  Mã chứng từ / Biên lai đối soát thủ công (Bắt buộc nếu đóng thủ công)
                                </label>
                                <input
                                  value={review.reference}
                                  maxLength={80}
                                  disabled={busy}
                                  placeholder="Ví dụ: REF-SEPAY-MANUAL-001..."
                                  className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-purple-600 focus:outline-none"
                                  onChange={(e) => setReview({ ...review, reference: e.target.value })}
                                />
                              </div>

                              <p className="text-[11px] text-stone-500 italic">
                                Lưu ý: Chỉ thao tác sau khi đã kiểm tra sao kê ngân hàng và xác thực giao dịch bên cổng SePay.
                              </p>

                              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => setReview(undefined)}
                                  className="rounded-xl border border-stone-300 bg-white hover:bg-stone-50 px-3.5 py-1.5 text-xs font-semibold text-stone-700 shadow-xs cursor-pointer"
                                >
                                  Hủy bỏ
                                </button>
                                <button
                                  type="button"
                                  disabled={busy || !review.reason.trim() || !row.paidAt}
                                  onClick={() =>
                                    void perform(async () => {
                                      await paymentService.resolve(
                                        row.id,
                                        'RETRY_SETTLEMENT',
                                        review.reason.trim()
                                      );
                                      setReview(undefined);
                                    })
                                  }
                                  className="rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                  Thử khớp hoàn tất đơn
                                </button>
                                <button
                                  type="button"
                                  disabled={
                                    busy || !review.reason.trim() || !review.reference.trim()
                                  }
                                  onClick={() =>
                                    void perform(async () => {
                                      await paymentService.resolve(
                                        row.id,
                                        'CLOSE_MANUALLY',
                                        review.reason.trim(),
                                        review.reference.trim()
                                      );
                                      setReview(undefined);
                                    })
                                  }
                                  className="rounded-xl bg-purple-700 hover:bg-purple-800 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                  Đóng đối soát thủ công
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="p-4 border-t border-stone-100 flex justify-center items-center gap-2">
            <button
              disabled={loading || page === 0}
              onClick={() => setPage(page - 1)}
              className="px-3.5 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-700 disabled:opacity-40 hover:bg-stone-50 shadow-xs transition-colors cursor-pointer"
            >
              Trang trước
            </button>
            <span className="px-3 py-1.5 text-xs text-stone-500 font-medium">
              Trang {page + 1} / {pages}
            </span>
            <button
              disabled={loading || page + 1 >= pages}
              onClick={() => setPage(page + 1)}
              className="px-3.5 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-700 disabled:opacity-40 hover:bg-stone-50 shadow-xs transition-colors cursor-pointer"
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
