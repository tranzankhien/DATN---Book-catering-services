import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Ticket,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Tag,
  Calendar,
  Percent,
  Banknote,
  Users,
  ShieldAlert,
  Loader2,
  Power,
} from 'lucide-react';
import { voucherService } from '../../services/voucherService';
import type {
  VoucherDto,
  DiscountType,
  CreateVoucherRequest,
  UpdateVoucherRequest,
} from '../../services/types';
import { useToast } from '../../hooks/useToast';
import { formatVnd, formatDateTimeVn } from '../../hooks/useFormatters';
import { Pagination, usePagination } from '../../components/common/Pagination';
import { extractErrorMessage } from '../../services/apiClient';

interface VoucherFormData {
  code: string;
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount: string; // string for input flexibility
  minOrderAmount: number;
  startDate: string;
  endDate: string;
  usageLimit: string;
  limitPerUser: number;
  isActive: boolean;
}

const defaultFormData: VoucherFormData = {
  code: '',
  name: '',
  description: '',
  discountType: 'FIXED',
  discountValue: 100000,
  maxDiscountAmount: '',
  minOrderAmount: 0,
  startDate: '',
  endDate: '',
  usageLimit: '',
  limitPerUser: 1,
  isActive: true,
};

export const AdminVouchersPage: React.FC = () => {
  const [vouchers, setVouchers] = useState<VoucherDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [keyword, setKeyword] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherDto | null>(null);
  const [formData, setFormData] = useState<VoucherFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { showToast } = useToast();

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const list = await voucherService.getAdminVouchers();
      setVouchers(list);
    } catch (err) {
      showToast(extractErrorMessage(err) || 'Không thể tải danh sách voucher.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  // Filtered List
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const matchKeyword =
        !keyword ||
        v.code.toLowerCase().includes(keyword.toLowerCase().trim()) ||
        v.name.toLowerCase().includes(keyword.toLowerCase().trim()) ||
        (v.description && v.description.toLowerCase().includes(keyword.toLowerCase().trim()));

      const matchType =
        typeFilter === 'ALL' || v.discountType === typeFilter;

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && v.isActive) ||
        (statusFilter === 'INACTIVE' && !v.isActive);

      return matchKeyword && matchType && matchStatus;
    });
  }, [vouchers, keyword, typeFilter, statusFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems,
  } = usePagination(filteredVouchers, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, typeFilter, statusFilter, setCurrentPage]);

  // Metrics
  const metrics = useMemo(() => {
    const total = vouchers.length;
    const active = vouchers.filter((v) => v.isActive).length;
    const totalUsed = vouchers.reduce((sum, v) => sum + (v.usedCount || 0), 0);
    return { total, active, totalUsed };
  }, [vouchers]);

  // Modal handlers
  const handleOpenCreate = () => {
    setEditingVoucher(null);
    setFormData(defaultFormData);
    setShowModal(true);
  };

  const handleOpenEdit = (v: VoucherDto) => {
    setEditingVoucher(v);
    setFormData({
      code: v.code,
      name: v.name,
      description: v.description || '',
      discountType: v.discountType,
      discountValue: v.discountValue,
      maxDiscountAmount: v.maxDiscountAmount ? String(v.maxDiscountAmount) : '',
      minOrderAmount: v.minOrderAmount || 0,
      startDate: v.startDate ? v.startDate.slice(0, 16) : '',
      endDate: v.endDate ? v.endDate.slice(0, 16) : '',
      usageLimit: v.usageLimit ? String(v.usageLimit) : '',
      limitPerUser: v.limitPerUser || 1,
      isActive: v.isActive,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVoucher(null);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingVoucher && !formData.code.trim()) {
      showToast('Vui lòng nhập mã voucher.', 'error');
      return;
    }
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên chương trình ưu đãi.', 'error');
      return;
    }
    if (formData.discountValue <= 0) {
      showToast('Giá trị giảm phải lớn hơn 0.', 'error');
      return;
    }
    if (formData.discountType === 'PERCENTAGE' && formData.discountValue > 100) {
      showToast('Mức giảm theo phần trăm không được vượt quá 100%.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const maxDiscountParsed = formData.maxDiscountAmount
        ? Number(formData.maxDiscountAmount)
        : null;
      const usageLimitParsed = formData.usageLimit ? Number(formData.usageLimit) : null;
      const toOffsetIso = (val: string): string | null => {
        if (!val) return null;
        try {
          const d = new Date(val);
          return isNaN(d.getTime()) ? `${val}:00+07:00` : d.toISOString();
        } catch {
          return `${val}:00+07:00`;
        }
      };
      const startDateIso = toOffsetIso(formData.startDate);
      const endDateIso = toOffsetIso(formData.endDate);

      if (editingVoucher) {
        const payload: UpdateVoucherRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          maxDiscountAmount: maxDiscountParsed,
          minOrderAmount: formData.minOrderAmount,
          startDate: startDateIso,
          endDate: endDateIso,
          usageLimit: usageLimitParsed,
          limitPerUser: formData.limitPerUser,
          isActive: formData.isActive,
        };
        await voucherService.updateVoucher(editingVoucher.id, payload);
        showToast('Cập nhật voucher thành công!', 'success');
      } else {
        const payload: CreateVoucherRequest = {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          maxDiscountAmount: maxDiscountParsed,
          minOrderAmount: formData.minOrderAmount,
          startDate: startDateIso,
          endDate: endDateIso,
          usageLimit: usageLimitParsed,
          limitPerUser: formData.limitPerUser,
          isActive: formData.isActive,
        };
        await voucherService.createVoucher(payload);
        showToast('Tạo mã voucher mới thành công!', 'success');
      }

      handleCloseModal();
      await loadVouchers();
    } catch (err) {
      showToast(extractErrorMessage(err) || 'Lỗi khi lưu voucher.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (voucher: VoucherDto) => {
    try {
      setTogglingId(voucher.id);
      await voucherService.toggleVoucherStatus(voucher.id);
      showToast(
        `Đã ${voucher.isActive ? 'tạm ngưng' : 'kích hoạt'} voucher ${voucher.code}.`,
        'success'
      );
      setVouchers((prev) =>
        prev.map((v) => (v.id === voucher.id ? { ...v, isActive: !v.isActive } : v))
      );
    } catch (err) {
      showToast(extractErrorMessage(err) || 'Không thể thay đổi trạng thái voucher.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await voucherService.deleteVoucher(id);
      showToast('Đã xóa voucher thành công.', 'success');
      setDeleteConfirmId(null);
      await loadVouchers();
    } catch (err) {
      showToast(extractErrorMessage(err) || 'Không thể xóa voucher.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full w-fit mb-2 border border-amber-200/60">
            <Ticket className="h-3.5 w-3.5 text-amber-700" />
            <span>Phân hệ khuyến mãi & chiết khấu</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Quản lý Mã ưu đãi (Voucher)
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
            Thiết lập mã giảm giá cố định hoặc theo phần trăm (có chặn mức tối đa), quy định giá trị đơn tối thiểu, số lượt áp dụng toàn sàn và số lần cho mỗi khách hàng.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={loadVouchers}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm voucher mới</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block">
              Tổng số voucher
            </span>
            <span className="text-2xl font-bold text-stone-900 mt-1 block tabular-nums">
              {metrics.total}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <Ticket className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 block">
              Đang hoạt động
            </span>
            <span className="text-2xl font-bold text-emerald-800 mt-1 block tabular-nums">
              {metrics.active}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 block">
              Tổng lượt đã sử dụng
            </span>
            <span className="text-2xl font-bold text-amber-900 mt-1 block tabular-nums">
              {metrics.totalUsed} lượt
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
            <Tag className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo mã voucher, tên sự kiện hoặc ghi chú..."
            className="w-full rounded-xl border border-stone-200 bg-stone-50/70 pl-10 pr-3.5 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-700 font-medium focus:border-amber-600 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả hình thức giảm</option>
            <option value="FIXED">Số tiền cố định (VNĐ)</option>
            <option value="PERCENTAGE">Theo phần trăm (%)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-700 font-medium focus:border-amber-600 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Tạm ngưng</option>
          </select>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="rounded-2xl border border-stone-200/90 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50/90 text-stone-500 uppercase text-[10px] tracking-wider border-b border-stone-200 font-bold">
              <tr>
                <th className="py-3 px-4">Mã & Chương trình</th>
                <th className="py-3 px-4">Hình thức & Mức giảm</th>
                <th className="py-3 px-4">Đơn tối thiểu</th>
                <th className="py-3 px-4">Lượt sử dụng</th>
                <th className="py-3 px-4">Thời gian hiệu lực</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-700" />
                    <span>Đang tải danh sách voucher...</span>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    Không tìm thấy voucher nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((v) => (
                  <tr key={v.id} className="hover:bg-stone-50/60 transition-colors">
                    {/* Code & Name */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 text-[11px] tracking-wider">
                            {v.code}
                          </span>
                        </div>
                        <div className="font-semibold text-stone-900 line-clamp-1">{v.name}</div>
                        {v.description && (
                          <div className="text-[11px] text-stone-400 line-clamp-1">
                            {v.description}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Discount Type & Value */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {v.discountType === 'FIXED' ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-stone-900 text-sm tabular-nums text-emerald-800">
                            -{formatVnd(v.discountValue)}
                          </span>
                          <div className="text-[10px] text-stone-400">Cố định tiền mặt</div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="font-bold text-stone-900 text-sm tabular-nums text-blue-800">
                            -{v.discountValue}%
                          </span>
                          {v.maxDiscountAmount ? (
                            <div className="text-[10px] text-stone-500">
                              Trần: {formatVnd(v.maxDiscountAmount)}
                            </div>
                          ) : (
                            <div className="text-[10px] text-stone-400">Không giới hạn trần</div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Min Order */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-stone-700 tabular-nums">
                        {v.minOrderAmount > 0 ? formatVnd(v.minOrderAmount) : 'Không yêu cầu'}
                      </span>
                    </td>

                    {/* Usage Limits */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-stone-900 tabular-nums">
                          {v.usedCount} / {v.usageLimit ? `${v.usageLimit}` : '∞'}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {v.limitPerUser} lượt / khách
                        </div>
                      </div>
                    </td>

                    {/* Validity Period */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-0.5 text-[11px] text-stone-600">
                        {v.startDate ? (
                          <div>Từ: {formatDateTimeVn(v.startDate)}</div>
                        ) : (
                          <div>Hiệu lực ngay</div>
                        )}
                        {v.endDate ? (
                          <div className="text-stone-500">Đến: {formatDateTimeVn(v.endDate)}</div>
                        ) : (
                          <div className="text-emerald-700">Vô thời hạn</div>
                        )}
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        disabled={togglingId === v.id}
                        onClick={() => handleToggleStatus(v)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                          v.isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                        }`}
                        title="Bấm để bật / tắt trạng thái"
                      >
                        {togglingId === v.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Power className="h-3 w-3" />
                        )}
                        <span>{v.isActive ? 'Hoạt động' : 'Tạm ngưng'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(v)}
                          className="rounded-lg p-1.5 text-stone-500 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Chỉnh sửa voucher"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(v.id)}
                          className="rounded-lg p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa voucher"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-stone-200 px-4 py-3 bg-stone-50/50">
          <Pagination
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalItems={totalItems}
          />
        </div>
      </div>

      {/* Create / Edit Modal Portal */}
      {showModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50">
                <div className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-amber-700" />
                  <h3 className="font-bold text-base text-stone-900">
                    {editingVoucher ? `Chỉnh sửa Voucher: ${editingVoucher.code}` : 'Tạo mới mã Voucher'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmitModal} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Code & Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">
                      Mã Voucher <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={Boolean(editingVoucher)}
                      required
                      value={formData.code}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                      }
                      placeholder="VD: TIECXUAN2026"
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 font-mono uppercase font-bold text-stone-900 focus:border-amber-600 focus:outline-none disabled:bg-stone-100 disabled:text-stone-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">
                      Tên chương trình ưu đãi <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="VD: Khai xuân đón lộc 2026"
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-stone-900 focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">Mô tả / Ghi chú</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="VD: Ưu đãi dành riêng cho tiệc cưới từ 10 bàn trở lên..."
                    className="w-full rounded-xl border border-stone-300 bg-white p-3 text-stone-900 focus:border-amber-600 focus:outline-none"
                  />
                </div>

                {/* Discount Type & Value */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">Hình thức giảm giá</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          discountType: e.target.value as DiscountType,
                        }))
                      }
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-stone-900 focus:border-amber-600 focus:outline-none cursor-pointer"
                    >
                      <option value="FIXED">Số tiền cố định (VNĐ)</option>
                      <option value="PERCENTAGE">Theo phần trăm (%)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">
                      {formData.discountType === 'FIXED' ? 'Số tiền giảm (VNĐ)' : 'Mức giảm (%)'}{' '}
                      <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={formData.discountType === 'PERCENTAGE' ? 100 : undefined}
                      required
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, discountValue: Number(e.target.value) }))
                      }
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-stone-900 focus:border-amber-600 focus:outline-none font-bold"
                    />
                  </div>
                </div>

                {/* Max Discount (if PERCENTAGE) & Min Order Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">
                      Giới hạn giảm tối đa (VNĐ)
                      {formData.discountType === 'PERCENTAGE' && (
                        <span className="text-amber-800 font-normal"> (Khuyên dùng để chặn rủi ro)</span>
                      )}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.maxDiscountAmount}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, maxDiscountAmount: e.target.value }))
                      }
                      placeholder="Để trống nếu không giới hạn trần"
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-stone-900 focus:border-amber-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">
                      Giá trị đơn tiệc tối thiểu (VNĐ)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.minOrderAmount}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, minOrderAmount: Number(e.target.value) }))
                      }
                      placeholder="VD: 5000000"
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-stone-900 focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Usage Limits */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">
                      Tổng số lượt sử dụng toàn sàn
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.usageLimit}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, usageLimit: e.target.value }))
                      }
                      placeholder="Để trống = Không giới hạn"
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-stone-900 focus:border-amber-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">
                      Số lượt tối đa / mỗi khách
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formData.limitPerUser}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, limitPerUser: Number(e.target.value) }))
                      }
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-stone-900 focus:border-amber-600 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Date Ranges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Bắt đầu hiệu lực</label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-stone-900 focus:border-amber-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Hết hạn vào</label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-stone-900 focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="pt-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActiveToggle"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="h-4 w-4 rounded text-amber-700 focus:ring-amber-600 border-stone-300 cursor-pointer"
                  />
                  <label htmlFor="isActiveToggle" className="font-bold text-stone-800 cursor-pointer">
                    Kích hoạt voucher này ngay sau khi lưu
                  </label>
                </div>

                {/* Modal Footer */}
                <div className="border-t border-stone-200 pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-5 py-2.5 font-semibold text-white shadow-xs hover:bg-amber-800 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{editingVoucher ? 'Lưu thay đổi' : 'Tạo voucher'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 space-y-4 text-center">
              <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-stone-900">Xác nhận xóa Voucher?</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Hành động này sẽ xóa hoàn toàn thông tin voucher khỏi hệ thống. Các đơn hàng đã đặt trước đó vẫn lưu lại lịch sử chiết khấu.
              </p>
              <div className="flex gap-2.5 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="rounded-xl bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-800 cursor-pointer shadow-xs"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
