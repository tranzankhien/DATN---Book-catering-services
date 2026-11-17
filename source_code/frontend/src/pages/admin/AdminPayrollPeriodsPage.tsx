import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  CalendarRange,
  Plus,
  Lock,
  Archive,
  Eye,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  FileCheck2,
  Trash2,
  ArrowRight,
  CreditCard,
  Building2,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { employeeService } from '../../services/employeeService';
import type {
  PayrollPeriodDto,
  CreatePayrollPeriodPayload,
  PayrollPeriodPreviewDto,
  PayrollAdjustmentDto,
  CreatePayrollAdjustmentPayload,
  EmployeeDto,
  AdjustmentType,
} from '../../services/types';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../services/apiClient';

export const AdminPayrollPeriodsPage: React.FC = () => {
  const { showToast } = useToast();
  const [periods, setPeriods] = useState<PayrollPeriodDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Create Period Modal
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createYear, setCreateYear] = useState<number>(new Date().getFullYear());
  const [createMonth, setCreateMonth] = useState<number>(new Date().getMonth() + 1);
  const [createStandardDays, setCreateStandardDays] = useState<string>('26.0');
  const [createNote, setCreateNote] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);

  // Preview Modal
  const [previewPeriodId, setPreviewPeriodId] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<PayrollPeriodPreviewDto | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [finalizing, setFinalizing] = useState<boolean>(false);

  // Adjustments Modal
  const [adjPeriodId, setAdjPeriodId] = useState<number | null>(null);
  const [adjustments, setAdjustments] = useState<PayrollAdjustmentDto[]>([]);
  const [loadingAdj, setLoadingAdj] = useState<boolean>(false);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [adjEmpId, setAdjEmpId] = useState<string>('');
  const [adjType, setAdjType] = useState<AdjustmentType>('ALLOWANCE');
  const [adjAmount, setAdjAmount] = useState<string>('500000');
  const [adjReason, setAdjReason] = useState<string>('');
  const [addingAdj, setAddingAdj] = useState<boolean>(false);

  // Edit Period Modal
  const [editingPeriod, setEditingPeriod] = useState<PayrollPeriodDto | null>(null);
  const [editStandardDays, setEditStandardDays] = useState<string>('26.0');
  const [editPeriodNote, setEditPeriodNote] = useState<string>('');
  const [updatingPeriod, setUpdatingPeriod] = useState<boolean>(false);

  // Edit Adjustment Modal
  const [editingAdj, setEditingAdj] = useState<PayrollAdjustmentDto | null>(null);
  const [editAdjAmount, setEditAdjAmount] = useState<string>('500000');
  const [editAdjReason, setEditAdjReason] = useState<string>('');
  const [updatingAdj, setUpdatingAdj] = useState<boolean>(false);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const res = await employeeService.getPayrollPeriods();
      setPeriods(res);
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể tải danh sách kỳ tính lương'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    const daysNum = Number(createStandardDays);
    if (isNaN(daysNum) || daysNum <= 0 || daysNum > 31) {
      showToast('Số công chuẩn phải từ 1 đến 31 ngày', 'error');
      return;
    }

    try {
      setCreating(true);
      const payload: CreatePayrollPeriodPayload = {
        year: createYear,
        month: createMonth,
        standardWorkdays: daysNum,
        note: createNote.trim() || null,
      };
      await employeeService.createPayrollPeriod(payload);
      showToast(`Đã tạo kỳ tính lương Tháng ${createMonth}/${createYear} thành công`, 'success');
      setIsCreateOpen(false);
      fetchPeriods();
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể tạo kỳ tính lương'), 'error');
    } finally {
      setCreating(false);
    }
  };

  // Open Preview
  const openPreview = async (periodId: number) => {
    setPreviewPeriodId(periodId);
    try {
      setLoadingPreview(true);
      const data = await employeeService.previewPayrollPeriod(periodId);
      setPreviewData(data);
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể tải dự toán kỳ lương'), 'error');
      setPreviewPeriodId(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleFinalize = async () => {
    if (!previewPeriodId) return;
    if (!previewData?.previewHash) {
      showToast('Dữ liệu xem trước chưa sẵn sàng hoặc thiếu mã xác nhận (previewHash). Vui lòng tải lại bản xem trước.', 'error');
      return;
    }
    if (
      !window.confirm(
        'XÁC NHẬN CHỐT SỔ KỲ LƯƠNG?\nSau khi chốt sổ, toàn bộ ngày công, phụ cấp, giảm trừ và mức lương thực lĩnh sẽ được đóng băng snapshot vĩnh viễn. Kỳ lương sẽ chuyển sang trạng thái chờ chi trả.'
      )
    ) {
      return;
    }

    try {
      setFinalizing(true);
      await employeeService.finalizePayrollPeriod(previewPeriodId, {
        expectedTotalNetSalary: previewData?.totalNetSalary,
        expectedEmployeeCount: previewData?.items.length,
        previewHash: previewData?.previewHash,
      });
      showToast('Chốt sổ kỳ lương thành công! Dữ liệu bảng lương đã được khóa an toàn.', 'success');
      setPreviewPeriodId(null);
      fetchPeriods();
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể chốt sổ kỳ lương'), 'error');
    } finally {
      setFinalizing(false);
    }
  };

  // Open Adjustments
  const openAdjustments = async (periodId: number) => {
    setAdjPeriodId(periodId);
    try {
      setLoadingAdj(true);
      const [adjs, empsRes] = await Promise.all([
        employeeService.getAdjustments(periodId),
        employeeService.getEmployees({ status: 'ACTIVE', size: 100 }),
      ]);
      setAdjustments(adjs);
      setEmployees(empsRes.content);
      if (empsRes.content.length > 0) {
        setAdjEmpId(String(empsRes.content[0].id));
      }
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể tải danh sách phụ cấp / giảm trừ'), 'error');
      setAdjPeriodId(null);
    } finally {
      setLoadingAdj(false);
    }
  };

  const handleAddAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjPeriodId || !adjEmpId || !adjReason.trim()) {
      showToast('Vui lòng chọn nhân viên và nhập lý do điều chỉnh', 'error');
      return;
    }
    const amt = Number(adjAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Số tiền điều chỉnh phải lớn hơn 0', 'error');
      return;
    }

    try {
      setAddingAdj(true);
      const payload: CreatePayrollAdjustmentPayload = {
        employeeId: Number(adjEmpId),
        adjustmentType: adjType,
        amount: amt,
        reason: adjReason.trim(),
      };
      await employeeService.createAdjustment(adjPeriodId, payload);
      showToast('Đã thêm khoản phụ cấp / giảm trừ thành công', 'success');
      setAdjReason('');
      const adjs = await employeeService.getAdjustments(adjPeriodId);
      setAdjustments(adjs);
      fetchPeriods();
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể thêm phụ cấp / giảm trừ'), 'error');
    } finally {
      setAddingAdj(false);
    }
  };

  const handleDeleteAdjustment = async (adjId: number) => {
    if (!adjPeriodId) return;
    if (!window.confirm('Bạn có chắc muốn xóa khoản điều chỉnh này?')) return;
    try {
      await employeeService.deleteAdjustment(adjPeriodId, adjId);
      showToast('Đã xóa khoản điều chỉnh', 'success');
      setAdjustments((prev) => prev.filter((a) => a.id !== adjId));
      fetchPeriods();
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể xóa khoản điều chỉnh'), 'error');
    }
  };

  const handleClosePeriod = async (periodId: number, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn đóng và lưu trữ kỳ lương "${name}"?`)) return;
    try {
      await employeeService.closePayrollPeriod(periodId);
      showToast(`Đã đóng kỳ lương "${name}" thành công`, 'success');
      fetchPeriods();
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể đóng kỳ lương'), 'error');
    }
  };

  const openEditPeriod = (p: PayrollPeriodDto) => {
    setEditingPeriod(p);
    setEditStandardDays(String(p.standardWorkdays));
    setEditPeriodNote(p.note || '');
  };

  const handleUpdatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPeriod) return;
    const daysNum = Number(editStandardDays);
    if (isNaN(daysNum) || daysNum <= 0 || daysNum > 31) {
      showToast('Số công chuẩn phải từ 1 đến 31 ngày', 'error');
      return;
    }
    try {
      setUpdatingPeriod(true);
      await employeeService.updatePayrollPeriod(editingPeriod.id, {
        standardWorkdays: daysNum,
        note: editPeriodNote.trim() || null,
      });
      showToast(`Đã cập nhật kỳ lương Tháng ${editingPeriod.month}/${editingPeriod.year}`, 'success');
      setEditingPeriod(null);
      fetchPeriods();
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể cập nhật kỳ lương'), 'error');
    } finally {
      setUpdatingPeriod(false);
    }
  };

  const openEditAdjustment = (adj: PayrollAdjustmentDto) => {
    setEditingAdj(adj);
    setEditAdjAmount(String(adj.amount));
    setEditAdjReason(adj.name || adj.reason || '');
  };

  const handleUpdateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdj || !adjPeriodId) return;
    const amt = Number(editAdjAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Số tiền điều chỉnh phải lớn hơn 0', 'error');
      return;
    }
    try {
      setUpdatingAdj(true);
      await employeeService.updateAdjustment(adjPeriodId, editingAdj.id, {
        amount: amt,
        reason: editAdjReason.trim(),
        name: editAdjReason.trim(),
      });
      showToast('Đã cập nhật khoản điều chỉnh thành công', 'success');
      setEditingAdj(null);
      const adjs = await employeeService.getAdjustments(adjPeriodId);
      setAdjustments(adjs);
      fetchPeriods();
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể cập nhật khoản điều chỉnh'), 'error');
    } finally {
      setUpdatingAdj(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> Đang tính toán (DRAFT)
          </span>
        );
      case 'FINALIZED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <Lock className="h-3 w-3" /> Đã chốt sổ (FINALIZED)
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
            <Archive className="h-3 w-3" /> Đã đóng (CLOSED)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-6 animate-fade-up-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <CalendarRange className="h-7 w-7 text-amber-700" />
            Kỳ tính lương & Chốt sổ
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Thiết lập ngày công chuẩn, quản lý phụ cấp, khấu trừ, đối chiếu dự toán và chốt sổ bảng lương hàng tháng.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-4 py-2.5 text-sm font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Tạo kỳ lương mới
        </button>
      </div>

      {/* Periods List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-stone-500">
            <Loader2 className="h-8 w-8 animate-spin text-amber-700 mb-3" />
            <p className="text-sm font-medium">Đang tải danh sách các kỳ tính lương...</p>
          </div>
        ) : periods.length === 0 ? (
          <div className="col-span-full py-16 text-center text-stone-500 bg-white rounded-2xl border border-stone-200/80 p-8">
            <CalendarRange className="h-12 w-12 mx-auto text-stone-300 mb-3" />
            <p className="text-base font-semibold text-stone-700">Chưa có kỳ tính lương nào</p>
            <p className="text-xs text-stone-400 mt-1">Bấm nút "Tạo kỳ lương mới" để bắt đầu tính lương cho tháng này.</p>
          </div>
        ) : (
          periods.map((p) => {
            const periodName = `Tháng ${String(p.month).padStart(2, '0')}/${p.year}`;
            const isDraft = p.status === 'DRAFT';
            const isFinalized = p.status === 'FINALIZED';
            const isClosed = p.status === 'CLOSED';

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs hover:border-amber-400/70 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-sm">
                        {p.month}M
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 text-base">{periodName}</h3>
                        <p className="text-[11px] text-stone-400">Công chuẩn: {p.standardWorkdays} ngày</p>
                      </div>
                    </div>
                    {getStatusBadge(p.status)}
                  </div>

                  <div className="py-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Nhân sự áp dụng:</span>
                      <span className="font-bold text-stone-900">{p.totalEmployeesCount} người</span>
                    </div>

                    <div className="flex items-center justify-between text-stone-600">
                      <span>Tổng quỹ lương thực lĩnh:</span>
                      <span className="font-bold text-amber-800 text-sm">
                        {new Intl.NumberFormat('vi-VN').format(p.totalFinalizedAmount)} đ
                      </span>
                    </div>

                    {!isDraft && (
                      <div className="flex items-center justify-between text-stone-600 pt-1 border-t border-stone-100">
                        <span>Tiến độ chi trả:</span>
                        <span className="font-semibold text-stone-800">
                          {p.paidCount} đã chi / {p.unpaidCount} chưa chi
                        </span>
                      </div>
                    )}

                    {p.note && (
                      <p className="text-[11px] text-stone-400 italic pt-1 truncate">
                        Ghi chú: {p.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2">
                  {isDraft && (
                    <>
                      <button
                        onClick={() => openAdjustments(p.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                        title="Thêm phụ cấp / giảm trừ"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" /> Phụ cấp / Khấu trừ
                      </button>

                      <button
                        onClick={() => openEditPeriod(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                        title="Chỉnh sửa ngày công chuẩn và ghi chú kỳ lương DRAFT"
                      >
                        <CalendarRange className="h-3.5 w-3.5" /> Sửa công chuẩn
                      </button>

                      <button
                        onClick={() => openPreview(p.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold transition-colors cursor-pointer ml-auto"
                      >
                        <Eye className="h-3.5 w-3.5" /> Xem dự toán & Chốt
                      </button>
                    </>
                  )}

                  {isFinalized && (
                    <>
                      <Link
                        to={`/admin/payrolls?periodId=${p.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <CreditCard className="h-3.5 w-3.5" /> Chi trả lương
                      </Link>

                      <button
                        onClick={() => handleClosePeriod(p.id, periodName)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer ml-auto"
                        title="Đóng và lưu trữ kỳ lương"
                      >
                        <Archive className="h-3.5 w-3.5" /> Đóng kỳ
                      </button>
                    </>
                  )}

                  {isClosed && (
                    <Link
                      to={`/admin/payrolls?periodId=${p.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer w-full justify-center"
                    >
                      <Eye className="h-3.5 w-3.5" /> Xem bảng lương lưu trữ
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE PERIOD MODAL */}
      {isCreateOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200/90 animate-fade-up-1 my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <CalendarRange className="h-5 w-5 text-amber-700" />
                  Tạo kỳ tính lương mới
                </h2>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePeriod} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Năm</label>
                    <input
                      type="number"
                      required
                      value={createYear}
                      onChange={(e) => setCreateYear(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Tháng (1 - 12)</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      required
                      value={createMonth}
                      onChange={(e) => setCreateMonth(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Số ngày công chuẩn trong tháng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="31"
                    required
                    value={createStandardDays}
                    onChange={(e) => setCreateStandardDays(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 font-semibold tabular-nums"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Mặc định 26.0 ngày (trừ 4 ngày Chủ nhật trong tháng).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Ghi chú kỳ lương</label>
                  <textarea
                    rows={2}
                    value={createNote}
                    onChange={(e) => setCreateNote(e.target.value)}
                    placeholder="Ghi chú về kỳ lương, kế hoạch thưởng cuối tháng..."
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Khởi tạo kỳ lương
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* PREVIEW & FINALIZE MODAL */}
      {previewPeriodId &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
            <div className="relative bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-stone-200/90 animate-fade-up-1 max-h-[92vh] flex flex-col my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <FileCheck2 className="h-5 w-5 text-amber-700" />
                    Bảng dự toán tính lương trước khi chốt sổ
                  </h2>
                  {previewData && (
                    <p className="text-xs text-stone-500 mt-0.5 tabular-nums">
                      Tháng {previewData.month}/{previewData.year} • Công chuẩn: {previewData.standardWorkdays} ngày
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setPreviewPeriodId(null)}
                  className="p-1 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {loadingPreview ? (
                <div className="py-24 flex flex-col items-center justify-center text-stone-500">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-700 mb-3" />
                  <p className="text-sm font-medium">Đang tính toán lương tự động theo công và phụ cấp...</p>
                </div>
              ) : previewData ? (
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                  {previewData.totalWarningsCount > 0 && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs">
                      <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Có {previewData.totalWarningsCount} cảnh báo cần lưu ý:</p>
                        <p className="text-amber-800/80 mt-0.5">
                          Một số nhân viên có số ngày công vượt công chuẩn hoặc có mức lương thực lĩnh âm. Vui lòng kiểm tra kỹ trước khi chốt sổ.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Table */}
                  <div className="border border-stone-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 font-bold text-stone-600 uppercase text-[10px] border-b border-stone-200">
                        <tr>
                          <th className="py-3 px-3">Nhân viên</th>
                          <th className="py-3 px-3 text-right">Lương cơ bản</th>
                          <th className="py-3 px-3 text-center">Công thực tế / chuẩn</th>
                          <th className="py-3 px-3 text-right">Lương theo công</th>
                          <th className="py-3 px-3 text-right">Phụ cấp (+)</th>
                          <th className="py-3 px-3 text-right">Khấu trừ (-)</th>
                          <th className="py-3 px-3 text-right">Thực lĩnh (=)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {previewData.items.map((it) => (
                          <tr key={it.employeeId} className="hover:bg-amber-50/20">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-stone-900">{it.employeeName}</div>
                              <div className="text-[10px] text-stone-500 font-mono tabular-nums">
                                {it.employeeCode} • {it.position}
                              </div>
                              {it.warnings.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {it.warnings.map((w, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded"
                                    >
                                      <AlertCircle className="h-3 w-3" /> {w}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-stone-700 tabular-nums">
                              {new Intl.NumberFormat('vi-VN').format(it.baseSalary)} đ
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-stone-800 tabular-nums">
                              {it.actualWorkdays} / {it.standardWorkdays}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-stone-900 tabular-nums">
                              {new Intl.NumberFormat('vi-VN').format(it.calculatedSalary)} đ
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-emerald-700 tabular-nums">
                              +{new Intl.NumberFormat('vi-VN').format(it.totalAllowances)} đ
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-rose-700 tabular-nums">
                              -{new Intl.NumberFormat('vi-VN').format(it.totalDeductions)} đ
                            </td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-stone-900 tabular-nums">
                              <span className={it.netSalary < 0 ? 'text-rose-600' : 'text-stone-900'}>
                                {new Intl.NumberFormat('vi-VN').format(it.netSalary)} đ
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-stone-50/90 font-extrabold text-stone-900 border-t border-stone-200">
                        <tr>
                          <td className="py-3 px-3">TỔNG TOÀN KỲ</td>
                          <td className="py-3 px-3 text-right">-</td>
                          <td className="py-3 px-3 text-center">-</td>
                          <td className="py-3 px-3 text-right tabular-nums">
                            {new Intl.NumberFormat('vi-VN').format(previewData.totalCalculatedSalary)} đ
                          </td>
                          <td className="py-3 px-3 text-right text-emerald-700 tabular-nums">
                            +{new Intl.NumberFormat('vi-VN').format(previewData.totalAllowances)} đ
                          </td>
                          <td className="py-3 px-3 text-right text-rose-700 tabular-nums">
                            -{new Intl.NumberFormat('vi-VN').format(previewData.totalDeductions)} đ
                          </td>
                          <td className="py-3 px-3 text-right text-amber-900 text-sm tabular-nums">
                            {new Intl.NumberFormat('vi-VN').format(previewData.totalNetSalary)} đ
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : null}

              {/* Footer */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewPeriodId(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  Đóng
                </button>

                <button
                  type="button"
                  disabled={finalizing || loadingPreview}
                  onClick={handleFinalize}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {finalizing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Đang chốt sổ bảng lương...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" /> Xác nhận chốt sổ bảng lương
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ADJUSTMENTS MODAL */}
      {adjPeriodId &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
            <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200/90 animate-fade-up-1 max-h-[90vh] flex flex-col my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
                <div>
                  <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-amber-700" />
                    Quản lý phụ cấp & giảm trừ kỳ lương
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Thêm thưởng, phụ cấp trách nhiệm, tăng ca hoặc phạt vi phạm, trừ tiền ứng trước khi chốt sổ.
                  </p>
                </div>
                <button
                  onClick={() => setAdjPeriodId(null)}
                  className="p-1 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {/* Add Adjustment Form */}
                <form onSubmit={handleAddAdjustment} className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                  <p className="text-xs font-bold text-stone-800">Thêm khoản điều chỉnh mới</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Nhân viên</label>
                      <select
                        value={adjEmpId}
                        onChange={(e) => setAdjEmpId(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600"
                      >
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.fullName} ({e.employeeCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Loại khoản</label>
                      <select
                        value={adjType}
                        onChange={(e) => setAdjType(e.target.value as AdjustmentType)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600"
                      >
                        <option value="ALLOWANCE">Phụ cấp / Thưởng (+)</option>
                        <option value="DEDUCTION">Khấu trừ / Giảm (-)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Số tiền (VND)</label>
                      <input
                        type="number"
                        step="10000"
                        min="1000"
                        required
                        value={adjAmount}
                        onChange={(e) => setAdjAmount(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600 font-semibold tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Lý do điều chỉnh</label>
                    <input
                      type="text"
                      required
                      value={adjReason}
                      onChange={(e) => setAdjReason(e.target.value)}
                      placeholder="Ví dụ: Thưởng hoàn thành xuất sắc tiệc cưới, Phụ cấp trách nhiệm..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={addingAdj}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs cursor-pointer transition-colors disabled:opacity-60"
                    >
                      {addingAdj && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Thêm khoản điều chỉnh
                    </button>
                  </div>
                </form>

                {/* Adjustments List */}
                <div className="border border-stone-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 font-bold text-stone-600 uppercase text-[10px] border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3">Nhân viên</th>
                        <th className="py-2.5 px-3">Loại</th>
                        <th className="py-2.5 px-3 text-right">Số tiền</th>
                        <th className="py-2.5 px-3">Lý do</th>
                        <th className="py-2.5 px-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {adjustments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-stone-400 italic">
                            Chưa có khoản phụ cấp hoặc giảm trừ nào trong kỳ này.
                          </td>
                        </tr>
                      ) : (
                        adjustments.map((a) => (
                          <tr key={a.id} className="hover:bg-stone-50">
                            <td className="py-2.5 px-3 font-semibold text-stone-800">
                              {a.employeeName} <span className="text-[10px] text-stone-500 font-mono tabular-nums">({a.employeeCode})</span>
                            </td>
                            <td className="py-2.5 px-3">
                              {a.adjustmentType === 'ALLOWANCE' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  + Phụ cấp
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                  - Khấu trừ
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-stone-900 tabular-nums">
                              {new Intl.NumberFormat('vi-VN').format(a.amount)} đ
                            </td>
                            <td className="py-2.5 px-3 text-stone-600 truncate max-w-xs">{a.name || a.reason}</td>
                            <td className="py-2.5 px-3 text-right space-x-1">
                              <button
                                onClick={() => openEditAdjustment(a)}
                                className="p-1 rounded text-stone-400 hover:text-amber-700 transition-colors inline-block cursor-pointer"
                                title="Sửa"
                              >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAdjustment(a.id)}
                                className="p-1 rounded text-stone-400 hover:text-rose-600 transition-colors inline-block cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setAdjPeriodId(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* EDIT PERIOD MODAL (DRAFT ONLY) */}
      {editingPeriod &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200/90 animate-fade-up-1 my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <CalendarRange className="h-5 w-5 text-amber-700" />
                  Cập nhật kỳ lương Tháng {editingPeriod.month}/{editingPeriod.year}
                </h2>
                <button
                  onClick={() => setEditingPeriod(null)}
                  className="p-1 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdatePeriod} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Số ngày công chuẩn trong tháng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="31"
                    required
                    value={editStandardDays}
                    onChange={(e) => setEditStandardDays(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 font-semibold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Ghi chú</label>
                  <textarea
                    rows={2}
                    value={editPeriodNote}
                    onChange={(e) => setEditPeriodNote(e.target.value)}
                    placeholder="Ghi chú về kỳ lương..."
                    className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setEditingPeriod(null)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={updatingPeriod}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {updatingPeriod && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* EDIT ADJUSTMENT MODAL */}
      {editingAdj &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200/90 animate-fade-up-1 my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-amber-700" />
                  Sửa khoản điều chỉnh ({editingAdj.employeeName})
                </h2>
                <button
                  onClick={() => setEditingAdj(null)}
                  className="p-1 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateAdjustment} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Số tiền (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={editAdjAmount}
                    onChange={(e) => setEditAdjAmount(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 font-semibold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Lý do / Tên khoản <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editAdjReason}
                    onChange={(e) => setEditAdjReason(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setEditingAdj(null)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={updatingAdj}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {updatingAdj && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Cập nhật
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
