import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Download,
  Clock,
} from 'lucide-react';
import { expenseService } from '../../services/expenseService';
import { reportService } from '../../services/reportService';
import type {
  ExpenseCategory,
  ExpensePaymentStatus,
  ExpenseRequest,
  ExpenseResponse,
  ExpenseSummaryResponse,
} from '../../services/types';
import { extractErrorMessage } from '../../services/apiClient';

const CATEGORY_NAMES: Record<ExpenseCategory, string> = {
  RENT: 'Thuê mặt bằng / Cơ sở',
  UTILITIES: 'Điện, Nước, Internet',
  MARKETING: 'Quảng cáo & Tiếp thị',
  MAINTENANCE: 'Bảo trì & Thiết bị bếp',
  OFFICE_SUPPLIES: 'Vật dụng & Văn phòng phẩm',
  TAX_FEE: 'Thuế, Phí & Lệ phí',
  OTHER: 'Chi phí vận hành khác',
};

export const AdminExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [summary, setSummary] = useState<ExpenseSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const [status, setStatus] = useState<ExpensePaymentStatus | ''>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modal Form State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('UTILITIES');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formIncurredDate, setFormIncurredDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [formStatus, setFormStatus] = useState<ExpensePaymentStatus>('UNPAID');
  const [formPaidAt, setFormPaidAt] = useState<string>('');
  const [formNote, setFormNote] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [listRes, sumRes] = await Promise.all([
        expenseService.getExpenses({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          category: category || undefined,
          status: status || undefined,
          search: search || undefined,
          page,
          size: 15,
        }),
        expenseService.getExpenseSummary({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          category: category || undefined,
        }),
      ]);

      setExpenses(listRes.data.content);
      setTotalPages(listRes.data.totalPages || 1);
      setSummary(sumRes.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Không thể tải danh sách chi phí vận hành'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate, category, status, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadData();
  };

  const openCreateModal = () => {
    setEditingExpense(null);
    setFormName('');
    setFormCategory('UTILITIES');
    setFormAmount('');
    setFormIncurredDate(new Date().toISOString().substring(0, 10));
    setFormStatus('UNPAID');
    setFormPaidAt('');
    setFormNote('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (item: ExpenseResponse) => {
    setEditingExpense(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormAmount(String(item.amount));
    setFormIncurredDate(item.incurredDate);
    setFormStatus(item.paymentStatus);
    setFormPaidAt(item.paidAt ? item.paidAt.substring(0, 10) : '');
    setFormNote(item.note || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formAmount);
    if (!formName.trim()) {
      setFormError('Vui lòng nhập tên khoản chi phí.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Số tiền chi phí phải lớn hơn 0 VNĐ.');
      return;
    }
    if (!formIncurredDate) {
      setFormError('Vui lòng chọn ngày phát sinh chi phí.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');
    try {
      const payload: ExpenseRequest = {
        name: formName.trim(),
        category: formCategory,
        amount: parsedAmount,
        incurredDate: formIncurredDate,
        paymentStatus: formStatus,
        paidAt: formStatus === 'PAID' && formPaidAt ? `${formPaidAt}T12:00:00+07:00` : null,
        note: formNote.trim() || null,
      };

      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, payload);
      } else {
        await expenseService.createExpense(payload);
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Lỗi khi lưu khoản chi phí'));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (id: number) => {
    if (!confirm('Xác nhận khoản chi phí này đã được thanh toán?')) return;
    try {
      await expenseService.markAsPaid(id);
      loadData();
    } catch (err) {
      alert(extractErrorMessage(err, 'Lỗi khi ghi nhận thanh toán'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khoản chi phí này? Dữ liệu tính toán lợi nhuận sẽ được cập nhật lại.')) return;
    try {
      await expenseService.deleteExpense(id);
      loadData();
    } catch (err) {
      alert(extractErrorMessage(err, 'Lỗi khi xóa chi phí'));
    }
  };

  const handleExportCsv = async () => {
    try {
      setExportLoading(true);
      await reportService.downloadExportCsv('expenses', {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
    } catch (err) {
      alert(extractErrorMessage(err, 'Lỗi khi xuất file CSV'));
    } finally {
      setExportLoading(false);
    }
  };

  const formatVnd = (value?: number | null) => {
    if (value === undefined || value === null) return '0 ₫';
    return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <Receipt className="h-7 w-7 text-purple-700" /> Quản lý chi phí vận hành khác (D)
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Ghi nhận và quản lý các khoản chi phí phát sinh ngoài nguyên liệu (thuê mặt bằng, điện nước, bảo trì, marketing) để phục vụ tính lợi nhuận ròng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exportLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-50 text-xs font-semibold text-stone-700 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>{exportLoading ? 'Đang xuất CSV...' : 'Xuất CSV'}</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm chi phí vận hành</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Tổng số khoản chi</span>
          <div className="mt-2 text-2xl font-bold text-stone-900 tabular-nums">
            {summary?.totalCount ?? 0} <span className="text-sm font-medium text-stone-500">khoản</span>
          </div>
          <div className="mt-1 text-xs text-stone-500">
            Theo tiêu chí lọc hiện tại
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Tổng chi phí phát sinh (D)</span>
          <div className="mt-2 text-2xl font-bold text-purple-700 tabular-nums">
            {formatVnd(summary?.totalAmount)}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            Tính vào chi phí lợi nhuận theo ngày phát sinh
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Đã giải ngân chi trả</span>
          <div className="mt-2 text-2xl font-bold text-emerald-700 tabular-nums">
            {formatVnd(summary?.totalPaidAmount)}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            Dòng tiền thực tế đã chi ra khỏi quỹ
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Chưa thanh toán (Công nợ)</span>
          <div className="mt-2 text-2xl font-bold text-amber-700 tabular-nums">
            {formatVnd(summary?.totalUnpaidAmount)}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            Khoản chi đã ghi nhận nhưng chưa thanh toán
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã hoặc tên khoản chi..."
              className="w-full rounded-xl border border-stone-300 pl-9 pr-3 py-2 text-xs text-stone-900 focus:outline-amber-600 focus:ring-1 focus:ring-amber-600"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-600">Danh mục:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-900 focus:outline-amber-600"
            >
              <option value="">Tất cả danh mục</option>
              {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-600">Trạng thái:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-900 focus:outline-amber-600"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="UNPAID">Chưa thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-600">Từ:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-stone-300 px-2.5 py-1.5 text-xs text-stone-900 tabular-nums focus:outline-amber-600"
            />
            <span className="font-semibold text-stone-600">Đến:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-stone-300 px-2.5 py-1.5 text-xs text-stone-900 tabular-nums focus:outline-amber-600"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold cursor-pointer"
          >
            Lọc
          </button>
        </form>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 font-semibold">
                <th className="pb-3 font-semibold">Mã chi phí</th>
                <th className="pb-3 font-semibold">Tên khoản chi</th>
                <th className="pb-3 font-semibold">Phân loại</th>
                <th className="pb-3 font-semibold text-center">Ngày phát sinh</th>
                <th className="pb-3 font-semibold text-right">Số tiền</th>
                <th className="pb-3 font-semibold text-center">Thanh toán</th>
                <th className="pb-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {expenses.length > 0 ? (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-stone-50/50">
                    <td className="py-3 font-mono font-bold text-stone-900 tabular-nums">
                      {exp.expenseCode}
                    </td>
                    <td className="py-3">
                      <p className="font-bold text-stone-900">{exp.name}</p>
                      {exp.note && <p className="text-[11px] text-stone-500 italic mt-0.5">{exp.note}</p>}
                    </td>
                    <td className="py-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-stone-100 text-stone-800">
                        {exp.categoryName || CATEGORY_NAMES[exp.category]}
                      </span>
                    </td>
                    <td className="py-3 text-center text-stone-700 tabular-nums">
                      {exp.incurredDate}
                    </td>
                    <td className="py-3 text-right font-bold text-stone-900 tabular-nums">
                      {formatVnd(exp.amount)}
                    </td>
                    <td className="py-3 text-center">
                      {exp.paymentStatus === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Đã trả
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="h-3 w-3" /> Chưa thanh toán
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {exp.paymentStatus === 'UNPAID' && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsPaid(exp.id)}
                            className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-semibold cursor-pointer"
                            title="Đánh dấu đã thanh toán"
                          >
                            Đã trả
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditModal(exp)}
                          className="p-1 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
                          title="Sửa chi phí"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(exp.id)}
                          className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          title="Xóa chi phí"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400 italic">
                    Chưa có khoản chi phí vận hành nào phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-3 text-xs">
            <span className="text-stone-500">
              Trang <span className="font-semibold text-stone-900 tabular-nums">{page + 1}</span> /{' '}
              <span className="tabular-nums">{totalPages}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 text-stone-700 font-semibold cursor-pointer"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 text-stone-700 font-semibold cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form using createPortal */}
      {modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
            <div className="relative bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200/90 flex flex-col max-h-[90vh] overflow-hidden my-auto">
              {/* Modal Header */}
              <div className="p-4.5 border-b border-stone-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900">
                  {editingExpense ? 'Chỉnh sửa khoản chi phí vận hành' : 'Thêm mới khoản chi phí vận hành'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Form Body */}
              <form onSubmit={handleFormSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Tên khoản chi phí <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: Tiền điện 3 pha tháng 11, Sửa tủ đông bếp chính..."
                    required
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 text-xs focus:outline-amber-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Phân loại chi phí <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 text-xs focus:outline-amber-600"
                    >
                      {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                        <option key={key} value={key}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Số tiền chi phí (VNĐ) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="VD: 5000000"
                      required
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 text-xs tabular-nums focus:outline-amber-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Ngày phát sinh chi phí <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={formIncurredDate}
                      onChange={(e) => setFormIncurredDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 text-xs tabular-nums focus:outline-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Trạng thái thanh toán
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 text-xs focus:outline-amber-600"
                    >
                      <option value="UNPAID">Chưa thanh toán (Công nợ)</option>
                      <option value="PAID">Đã thanh toán</option>
                    </select>
                  </div>
                </div>

                {formStatus === 'PAID' && (
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Ngày thanh toán thực tế
                    </label>
                    <input
                      type="date"
                      value={formPaidAt}
                      onChange={(e) => setFormPaidAt(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 text-xs tabular-nums focus:outline-amber-600"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Ghi chú thêm</label>
                  <textarea
                    rows={2}
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="Số hóa đơn đỏ, người nhận tiền, số điện thoại liên hệ..."
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 text-xs focus:outline-amber-600"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-semibold cursor-pointer"
                  >
                    {formSubmitting ? 'Đang lưu...' : editingExpense ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
