import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CreditCard,
  CheckCircle2,
  Clock,
  Building2,
  DollarSign,
  Calendar,
  Wallet,
  ShieldCheck,
  Loader2,
  CalendarDays,
  FileCheck2,
  BadgePercent,
} from 'lucide-react';
import { employeeService } from '../../services/employeeService';
import type { PayrollDto } from '../../services/types';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../services/apiClient';

export const EmployeeMyPayrollsPage: React.FC = () => {
  const { showToast } = useToast();
  const [payrolls, setPayrolls] = useState<PayrollDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMyPayrolls = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getMyPayrolls();
      setPayrolls(data || []);
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể tải danh sách phiếu lương của bạn'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPayrolls();
  }, []);

  const formatVnd = (value?: number | null) => {
    if (value === undefined || value === null) return '0 ₫';
    return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-up-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <Receipt className="h-7 w-7 text-amber-700" />
            Phiếu lương của tôi
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-500">
            Minh bạch thu nhập hàng tháng: lương theo ngày công thực tế, phụ cấp thưởng, khấu trừ và tiến độ giải ngân.
          </p>
        </div>

        {payrolls.length > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs font-semibold text-amber-900 self-start sm:self-auto">
            <FileCheck2 className="h-4 w-4 text-amber-700" />
            <span>Tổng cộng: {payrolls.length} kỳ tính lương</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-stone-500">
          <Loader2 className="h-8 w-8 animate-spin text-amber-700 mb-3" />
          <p className="text-sm font-medium">Đang tải danh sách phiếu lương...</p>
        </div>
      ) : payrolls.length === 0 ? (
        <div className="py-20 text-center text-stone-500 bg-white rounded-2xl border border-stone-200 p-8 shadow-xs">
          <Receipt className="h-12 w-12 mx-auto text-stone-300 mb-3" />
          <p className="text-base font-semibold text-stone-700">Chưa có phiếu lương nào được chốt</p>
          <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
            Phiếu lương chính thức sẽ tự động xuất hiện tại đây sau khi ban quản lý hoàn tất chốt sổ kỳ tính lương.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {payrolls.map((p) => {
            const isPaid = p.paymentStatus === 'PAID';
            const periodTitle =
              p.month && p.year
                ? `Tháng ${String(p.month).padStart(2, '0')}/${p.year}`
                : p.finalizedAt
                ? `Kỳ ${new Date(p.finalizedAt).toLocaleDateString('vi-VN')}`
                : `Phiếu lương #${p.id}`;

            const standardDays = p.standardWorkdaysSnapshot || 26;
            const actualDays = p.actualWorkdaysSnapshot || 0;
            const completionPercent = Math.min(100, Math.round((actualDays / standardDays) * 100));

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/90 shadow-xs hover:border-amber-400/80 transition-all space-y-5"
              >
                {/* Payslip Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-2xs">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-extrabold text-stone-900 text-lg tracking-tight">
                          PHIẾU LƯƠNG {periodTitle.toUpperCase()}
                        </h2>
                        <span className="font-mono text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200/60">
                          #{String(p.id).padStart(5, '0')}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        BanquetHub • Ngày duyệt chốt: {new Date(p.finalizedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                        <span>Đã giải ngân ({p.paymentDate || 'Hoàn tất'})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                        <Clock className="h-4 w-4 text-amber-700" />
                        <span>Đang chờ giải ngân</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Employee Snapshot Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50/80 p-4 rounded-xl border border-stone-200/80 text-xs">
                  <div>
                    <span className="text-stone-400 text-[11px] font-medium block">Nhân sự</span>
                    <span className="font-bold text-stone-900 text-sm mt-0.5 block truncate">
                      {p.employeeNameSnapshot}
                    </span>
                    <span className="text-[11px] font-mono text-stone-500">{p.employeeCodeSnapshot}</span>
                  </div>

                  <div>
                    <span className="text-stone-400 text-[11px] font-medium block">Mức lương cơ bản</span>
                    <span className="font-bold text-stone-900 text-sm mt-0.5 block tabular-nums">
                      {formatVnd(p.baseSalarySnapshot)}
                    </span>
                    <span className="text-[11px] text-stone-400">Hợp đồng chính thức</span>
                  </div>

                  <div>
                    <span className="text-stone-400 text-[11px] font-medium block">Ngày công thực tế</span>
                    <span className="font-bold text-amber-900 text-sm mt-0.5 block tabular-nums">
                      {actualDays} / {standardDays} ngày
                    </span>
                    <span className="text-[11px] text-stone-500">Đạt {completionPercent}% định mức</span>
                  </div>

                  <div>
                    <span className="text-stone-400 text-[11px] font-medium block">Lương thực lĩnh</span>
                    <span className="font-black text-emerald-700 text-base mt-0.5 block tabular-nums">
                      {formatVnd(p.netSalary)}
                    </span>
                    <span className="text-[11px] text-stone-500">{isPaid ? 'Đã chi trả' : 'Chờ chuyển khoản'}</span>
                  </div>
                </div>

                {/* Financial Breakdown Table */}
                <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
                  <div className="divide-y divide-stone-100">
                    {/* Calculated salary */}
                    <div className="p-3.5 flex justify-between items-center hover:bg-stone-50/50">
                      <div>
                        <span className="font-medium text-stone-700">1. Lương tính theo công thực tế</span>
                        <span className="text-[11px] text-stone-400 ml-2">
                          ({formatVnd(p.baseSalarySnapshot)} × {actualDays}/{standardDays} công)
                        </span>
                      </div>
                      <span className="font-bold text-stone-900 tabular-nums">
                        {formatVnd(p.calculatedSalary)}
                      </span>
                    </div>

                    {/* Allowances */}
                    <div className="p-3.5 flex justify-between items-center text-emerald-700 hover:bg-emerald-50/20">
                      <div>
                        <span className="font-medium">2. Các khoản phụ cấp, khen thưởng (+)</span>
                        <span className="text-[11px] text-emerald-600 ml-2">Trách nhiệm, chuyên cần, hỗ trợ</span>
                      </div>
                      <span className="font-bold tabular-nums">
                        +{formatVnd(p.totalAllowances)}
                      </span>
                    </div>

                    {/* Deductions */}
                    <div className="p-3.5 flex justify-between items-center text-rose-700 hover:bg-rose-50/20">
                      <div>
                        <span className="font-medium">3. Các khoản khấu trừ, giảm trừ (-)</span>
                        <span className="text-[11px] text-rose-500 ml-2">Tạm ứng, vi phạm, bảo hiểm</span>
                      </div>
                      <span className="font-bold tabular-nums">
                        -{formatVnd(p.totalDeductions)}
                      </span>
                    </div>

                    {/* Net Salary Row */}
                    <div className="p-4 bg-amber-50/80 flex justify-between items-center font-extrabold text-sm border-t-2 border-amber-300">
                      <span className="text-amber-950 uppercase tracking-wide">TỔNG LƯƠNG THỰC LĨNH (=):</span>
                      <span className="text-amber-900 text-xl tabular-nums">
                        {formatVnd(p.netSalary)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Settlement Detail if Paid */}
                {isPaid && (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      {p.paymentMethod === 'BANK_TRANSFER' ? (
                        <Building2 className="h-4 w-4 text-emerald-700 shrink-0" />
                      ) : (
                        <Wallet className="h-4 w-4 text-emerald-700 shrink-0" />
                      )}
                      <span>
                        Chi trả qua {p.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản ngân hàng' : 'Tiền mặt'} • Ngày {p.paymentDate}
                        {p.paymentNote ? ` • "${p.paymentNote}"` : ''}
                      </span>
                    </div>
                    {p.paidBy && (
                      <span className="text-[11px] text-emerald-700 font-medium">Người giải ngân: {p.paidBy}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
