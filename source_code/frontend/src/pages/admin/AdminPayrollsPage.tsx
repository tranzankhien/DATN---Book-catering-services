import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Receipt,
  Search,
  Filter,
  CreditCard,
  CheckCircle2,
  Clock,
  Building2,
  DollarSign,
  Calendar,
  AlertCircle,
  Eye,
  X,
  Loader2,
  FileSpreadsheet,
  Wallet,
} from 'lucide-react';
import { employeeService } from '../../services/employeeService';
import type {
  PayrollDto,
  PayrollPeriodDto,
  PayrollSummaryDto,
  PaymentStatus,
  PaymentMethod,
  RecordSalaryPaymentPayload,
} from '../../services/types';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../services/apiClient';

const getLocalTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AdminPayrollsPage: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const periodIdParam = searchParams.get('periodId');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(periodIdParam || '');

  const [periods, setPeriods] = useState<PayrollPeriodDto[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollDto[]>([]);
  const [periodSummary, setPeriodSummary] = useState<PayrollSummaryDto | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const activeRequestIdRef = useRef<number>(0);

  // Mark Paid Modal
  const [payingPayroll, setPayingPayroll] = useState<PayrollDto | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [payDate, setPayDate] = useState<string>(getLocalTodayDateString());
  const [payNote, setPayNote] = useState<string>('');
  const [submittingPay, setSubmittingPay] = useState<boolean>(false);

  // Payslip Modal
  const [viewingPayslip, setViewingPayslip] = useState<PayrollDto | null>(null);

  const fetchPeriods = async () => {
    try {
      const allPeriods = await employeeService.getPayrollPeriods();
      // Filter periods that are finalized or closed, or show all
      setPeriods(allPeriods);
      if (!selectedPeriodId && allPeriods.length > 0) {
        // Pick first finalized period or first period
        const firstFin = allPeriods.find((p) => p.status !== 'DRAFT') || allPeriods[0];
        setSelectedPeriodId(String(firstFin.id));
      }
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể tải danh sách kỳ lương'), 'error');
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const selectedPeriod = useMemo(
    () => periods.find((p) => String(p.id) === selectedPeriodId),
    [periods, selectedPeriodId]
  );

  const fetchPeriodSummary = async (period: PayrollPeriodDto, reqId: number) => {
    try {
      setSummaryLoading(true);
      const summary = await employeeService.getPayrollSummary(period.year, period.month);
      if (reqId === activeRequestIdRef.current) {
        setPeriodSummary(summary);
      }
    } catch {
      if (reqId === activeRequestIdRef.current) {
        setPeriodSummary(null);
      }
    } finally {
      if (reqId === activeRequestIdRef.current) {
        setSummaryLoading(false);
      }
    }
  };

  const fetchPayrolls = async () => {
    if (!selectedPeriodId) return;
    const reqId = ++activeRequestIdRef.current;
    try {
      setLoading(true);
      const res = await employeeService.getPayrolls({
        periodId: Number(selectedPeriodId),
        paymentStatus: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchTerm.trim() || undefined,
        page,
        size: 50,
      });
      if (reqId === activeRequestIdRef.current) {
        setPayrolls(res.content);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || res.content.length);
      }
    } catch (err) {
      if (reqId === activeRequestIdRef.current) {
        showToast(extractErrorMessage(err, 'Không thể tải danh sách bảng lương'), 'error');
      }
    } finally {
      if (reqId === activeRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setPage(0);
  }, [selectedPeriodId, statusFilter, searchTerm]);

  useEffect(() => {
    if (selectedPeriodId) {
      setPeriodSummary(null);
      fetchPayrolls();
      setSearchParams({ periodId: selectedPeriodId });
      const current = periods.find((p) => String(p.id) === selectedPeriodId);
      if (current) {
        fetchPeriodSummary(current, activeRequestIdRef.current);
      }
    }
  }, [selectedPeriodId, statusFilter, searchTerm, page, periods]);

  const filteredPayrolls = payrolls;

  // Totals: strictly period-level to avoid skew when filtering or paginating
  const totalNet = useMemo(() => {
    if (periodSummary && periodSummary.totalFinalizedPayrollAmount != null) {
      return periodSummary.totalFinalizedPayrollAmount;
    }
    if (selectedPeriod && selectedPeriod.totalFinalizedAmount != null) {
      return selectedPeriod.totalFinalizedAmount;
    }
    return null;
  }, [periodSummary, selectedPeriod]);

  const totalPaid = useMemo(() => {
    if (periodSummary && periodSummary.totalPaidAmount != null) {
      return periodSummary.totalPaidAmount;
    }
    if (selectedPeriod) {
      if (selectedPeriod.paidCount === 0) return 0;
      if (selectedPeriod.unpaidCount === 0 && selectedPeriod.totalFinalizedAmount != null) {
        return selectedPeriod.totalFinalizedAmount;
      }
    }
    return null;
  }, [periodSummary, selectedPeriod]);

  const totalUnpaid = useMemo(() => {
    if (periodSummary && periodSummary.totalUnpaidAmount != null) {
      return periodSummary.totalUnpaidAmount;
    }
    if (selectedPeriod) {
      if (selectedPeriod.unpaidCount === 0) return 0;
      if (selectedPeriod.paidCount === 0 && selectedPeriod.totalFinalizedAmount != null) {
        return selectedPeriod.totalFinalizedAmount;
      }
    }
    return null;
  }, [periodSummary, selectedPeriod]);

  const openPayModal = (p: PayrollDto) => {
    if (selectedPeriodId && p.payrollPeriodId !== Number(selectedPeriodId)) {
      showToast('Bản ghi bảng lương không khớp với kỳ đang chọn. Vui lòng tải lại.', 'error');
      return;
    }
    setPayingPayroll(p);
    setPayMethod('BANK_TRANSFER');
    setPayDate(getLocalTodayDateString());
    setPayNote(`Thanh toán lương cho ${p.employeeNameSnapshot}`);
  };

  const handleMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingPayroll) return;

    if (selectedPeriodId && payingPayroll.payrollPeriodId !== Number(selectedPeriodId)) {
      showToast('Kỳ lương đã thay đổi trong khi thực hiện giao dịch.', 'error');
      setPayingPayroll(null);
      return;
    }

    try {
      setSubmittingPay(true);
      const payload: RecordSalaryPaymentPayload = {
        paymentMethod: payMethod,
        paymentDate: payDate,
        note: payNote.trim() || null,
      };
      await employeeService.markPayrollPaid(payingPayroll.id, payload);
      showToast(
        `Đã ghi nhận thanh toán lương cho ${payingPayroll.employeeNameSnapshot} thành công`,
        'success'
      );
      setPayingPayroll(null);
      fetchPayrolls();
      fetchPeriods();
      if (selectedPeriod) {
        fetchPeriodSummary(selectedPeriod, activeRequestIdRef.current);
      }
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể ghi nhận thanh toán lương'), 'error');
    } finally {
      setSubmittingPay(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <Receipt className="h-7 w-7 text-amber-700" />
            Bảng lương nhân viên chính thức
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Dữ liệu lương thực lĩnh bất biến sau khi chốt sổ, ghi nhận chi trả tiền mặt hoặc chuyển khoản ngân hàng.
          </p>
        </div>

        {/* Period Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-stone-600 whitespace-nowrap">Chọn kỳ lương:</label>
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/30 text-stone-900 shadow-2xs"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                Tháng {String(p.month).padStart(2, '0')}/{p.year} ({p.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Tổng quỹ lương thực lĩnh</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {summaryLoading ? (
                <span className="text-stone-400 font-normal text-base animate-pulse">Đang tải...</span>
              ) : totalNet != null ? (
                <>{new Intl.NumberFormat('vi-VN').format(totalNet)} <span className="text-xs font-normal text-stone-500">đ</span></>
              ) : (
                <span className="text-stone-400 font-normal text-base">— đ</span>
              )}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Đã giải ngân chi trả</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-0.5">
              {summaryLoading ? (
                <span className="text-stone-400 font-normal text-base animate-pulse">Đang tải...</span>
              ) : totalPaid != null ? (
                <>{new Intl.NumberFormat('vi-VN').format(totalPaid)} <span className="text-xs font-normal text-stone-500">đ</span></>
              ) : (
                <span className="text-stone-400 font-normal text-base">— đ</span>
              )}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Chưa thanh toán (Công nợ)</p>
            <p className="text-2xl font-extrabold text-rose-700 mt-0.5">
              {summaryLoading ? (
                <span className="text-stone-400 font-normal text-base animate-pulse">Đang tải...</span>
              ) : totalUnpaid != null ? (
                <>{new Intl.NumberFormat('vi-VN').format(totalUnpaid)} <span className="text-xs font-normal text-stone-500">đ</span></>
              ) : (
                <span className="text-stone-400 font-normal text-base">— đ</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã nhân viên hoặc họ tên..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-medium text-stone-500 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Lọc trạng thái:
          </span>
          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200/60 text-xs font-medium">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-600'
              }`}
            >
              Tất cả ({selectedPeriod?.totalEmployeesCount ?? payrolls.length})
            </button>
            <button
              onClick={() => setStatusFilter('UNPAID')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'UNPAID' ? 'bg-white text-rose-800 shadow-2xs font-bold' : 'text-stone-600'
              }`}
            >
              Chưa chi ({selectedPeriod ? selectedPeriod.unpaidCount : payrolls.filter((p) => p.paymentStatus === 'UNPAID').length})
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'PAID' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-stone-600'
              }`}
            >
              Đã chi ({selectedPeriod ? selectedPeriod.paidCount : payrolls.filter((p) => p.paymentStatus === 'PAID').length})
            </button>
          </div>
        </div>
      </div>

      {/* Payrolls Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-stone-500">
            <Loader2 className="h-8 w-8 animate-spin text-amber-700 mb-3" />
            <p className="text-sm font-medium">Đang tải bảng lương...</p>
          </div>
        ) : filteredPayrolls.length === 0 ? (
          <div className="py-16 text-center text-stone-500">
            <Receipt className="h-12 w-12 mx-auto text-stone-300 mb-3" />
            <p className="text-base font-semibold text-stone-700">Chưa có bảng lương nào trong kỳ này</p>
            <p className="text-xs text-stone-400 mt-1">
              Hãy đảm bảo kỳ lương đã được chuyển sang trạng thái "Đã chốt sổ (FINALIZED)".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/80 text-[10px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-4">Mã & Họ tên</th>
                  <th className="py-3.5 px-4 text-right">Lương cơ bản</th>
                  <th className="py-3.5 px-4 text-center">Công thực tế / chuẩn</th>
                  <th className="py-3.5 px-4 text-right">Lương theo công</th>
                  <th className="py-3.5 px-4 text-right">Phụ cấp (+)</th>
                  <th className="py-3.5 px-4 text-right">Khấu trừ (-)</th>
                  <th className="py-3.5 px-4 text-right">Thực lĩnh (=)</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredPayrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{p.employeeNameSnapshot}</div>
                      <span className="font-mono text-[11px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                        {p.employeeCodeSnapshot}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-stone-700">
                      {new Intl.NumberFormat('vi-VN').format(p.baseSalarySnapshot)} đ
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-stone-800">
                      {p.actualWorkdaysSnapshot} / {p.standardWorkdaysSnapshot}
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-stone-900">
                      {new Intl.NumberFormat('vi-VN').format(p.calculatedSalary)} đ
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-emerald-700">
                      +{new Intl.NumberFormat('vi-VN').format(p.totalAllowances)} đ
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-rose-700">
                      -{new Intl.NumberFormat('vi-VN').format(p.totalDeductions)} đ
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-stone-900 text-sm">
                      {new Intl.NumberFormat('vi-VN').format(p.netSalary)} đ
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {p.paymentStatus === 'PAID' ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" /> Đã chi trả
                          </span>
                          {p.paymentDate && (
                            <span className="text-[10px] text-stone-400 mt-0.5">
                              {p.paymentDate} • {p.paymentMethod === 'BANK_TRANSFER' ? 'CK' : 'Tiền mặt'}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                          <Clock className="h-3 w-3" /> Chưa thanh toán
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setViewingPayslip(p)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-amber-800 hover:bg-stone-100 transition-colors"
                        title="Xem phiếu lương chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {p.paymentStatus === 'UNPAID' && (
                        <button
                          onClick={() => openPayModal(p)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                        >
                          <CreditCard className="h-3.5 w-3.5" /> Chi trả
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 text-xs text-stone-600 bg-stone-50/50">
            <span>Hiển thị {payrolls.length} / {totalElements} nhân viên</span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                className="px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-medium"
              >
                Trang trước
              </button>
              <span className="px-2 font-bold text-stone-900">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
                className="px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-medium"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MARK PAID MODAL */}
      {payingPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-fade-up-1">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-700" />
                Ghi nhận chi trả lương
              </h2>
              <button
                onClick={() => setPayingPayroll(null)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleMarkPaid} className="mt-4 space-y-4 text-xs">
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                <p className="font-bold text-sm text-stone-900">{payingPayroll.employeeNameSnapshot}</p>
                <p className="text-stone-500 font-mono">Mã NV: {payingPayroll.employeeCodeSnapshot}</p>
                <div className="pt-2 flex items-center justify-between border-t border-stone-200 mt-2">
                  <span className="font-semibold text-stone-700">Số tiền giải ngân:</span>
                  <span className="font-extrabold text-amber-800 text-base">
                    {new Intl.NumberFormat('vi-VN').format(payingPayroll.netSalary)} đ
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Phương thức chi trả</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('BANK_TRANSFER')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      payMethod === 'BANK_TRANSFER'
                        ? 'bg-amber-700 text-white border-amber-700 shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Building2 className="h-4 w-4" /> Chuyển khoản
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod('CASH')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      payMethod === 'CASH'
                        ? 'bg-amber-700 text-white border-amber-700 shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Wallet className="h-4 w-4" /> Tiền mặt
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Ngày chi trả</label>
                <input
                  type="date"
                  required
                  max={getLocalTodayDateString()}
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Ghi chú thanh toán</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Ghi chú giao dịch, số UNC ngân hàng..."
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setPayingPayroll(null)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingPay}
                  className="inline-flex items-center gap-1.5 px-5 py-2 font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-2xs disabled:opacity-60 cursor-pointer"
                >
                  {submittingPay && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Xác nhận chi trả
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PAYSLIP MODAL */}
      {viewingPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-fade-up-1">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-extrabold text-stone-900 text-base">PHIẾU LƯƠNG NHÂN VIÊN</h3>
                <p className="text-xs text-stone-400 font-mono mt-0.5">BanquetHub HR & Payroll System</p>
              </div>
              <button
                onClick={() => setViewingPayslip(null)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                <p className="font-bold text-stone-900 text-sm">{viewingPayslip.employeeNameSnapshot}</p>
                <p className="text-stone-500 font-mono">Mã số nhân viên: {viewingPayslip.employeeCodeSnapshot}</p>
              </div>

              <div className="space-y-2 border border-stone-200 rounded-2xl p-4">
                <div className="flex justify-between text-stone-600">
                  <span>Mức lương cơ bản hợp đồng:</span>
                  <span className="font-semibold text-stone-900">
                    {new Intl.NumberFormat('vi-VN').format(viewingPayslip.baseSalarySnapshot)} đ
                  </span>
                </div>

                <div className="flex justify-between text-stone-600">
                  <span>Ngày công thực tế / chuẩn:</span>
                  <span className="font-bold text-stone-900">
                    {viewingPayslip.actualWorkdaysSnapshot} / {viewingPayslip.standardWorkdaysSnapshot} ngày
                  </span>
                </div>

                <div className="flex justify-between text-stone-600">
                  <span>Lương tính theo ngày công:</span>
                  <span className="font-semibold text-stone-900">
                    {new Intl.NumberFormat('vi-VN').format(viewingPayslip.calculatedSalary)} đ
                  </span>
                </div>

                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Tổng phụ cấp (+):</span>
                  <span>+{new Intl.NumberFormat('vi-VN').format(viewingPayslip.totalAllowances)} đ</span>
                </div>

                <div className="flex justify-between text-rose-700 font-medium">
                  <span>Tổng khấu trừ (-):</span>
                  <span>-{new Intl.NumberFormat('vi-VN').format(viewingPayslip.totalDeductions)} đ</span>
                </div>

                <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-sm font-extrabold text-stone-900">
                  <span>LƯƠNG THỰC LĨNH:</span>
                  <span className="text-amber-800 text-base">
                    {new Intl.NumberFormat('vi-VN').format(viewingPayslip.netSalary)} đ
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-600 space-y-1">
                <p className="font-semibold text-stone-800">Trạng thái thanh toán:</p>
                {viewingPayslip.paymentStatus === 'PAID' ? (
                  <p className="text-emerald-700 font-bold">
                    ✓ Đã thanh toán ngày {viewingPayslip.paymentDate} ({viewingPayslip.paymentMethod})
                  </p>
                ) : (
                  <p className="text-rose-600 font-bold">⏳ Chưa thanh toán (Chờ chi trả)</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingPayslip(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
