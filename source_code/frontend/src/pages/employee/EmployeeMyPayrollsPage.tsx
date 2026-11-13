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
  Eye,
  FileSpreadsheet,
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
      setPayrolls(data);
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể tải danh sách phiếu lương của bạn'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPayrolls();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-stone-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
          <Receipt className="h-7 w-7 text-amber-700" />
          Phiếu lương của tôi
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Minh bạch thu nhập hàng tháng: lương theo ngày công thực tế, phụ cấp khen thưởng, khấu trừ và trạng thái chi trả.
        </p>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-stone-500">
          <Loader2 className="h-8 w-8 animate-spin text-amber-700 mb-3" />
          <p className="text-sm font-medium">Đang tải phiếu lương...</p>
        </div>
      ) : payrolls.length === 0 ? (
        <div className="py-20 text-center text-stone-500 bg-white rounded-3xl border border-stone-200 p-8 shadow-2xs">
          <Receipt className="h-12 w-12 mx-auto text-stone-300 mb-3" />
          <p className="text-base font-semibold text-stone-700">Chưa có phiếu lương nào được chốt</p>
          <p className="text-xs text-stone-400 mt-1">
            Phiếu lương chính thức sẽ xuất hiện sau khi ban quản lý hoàn tất chốt sổ kỳ tính lương.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {payrolls.map((p) => {
            const isPaid = p.paymentStatus === 'PAID';
            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs hover:border-amber-400/80 transition-all space-y-5"
              >
                {/* Payslip Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-stone-900 text-lg">
                        PHIẾU LƯƠNG NHÂN VIÊN
                      </span>
                      <span className="font-mono text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-lg">
                        #{String(p.id).padStart(5, '0')}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      BanquetHub • Chốt ngày: {new Date(p.finalizedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  <div>
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="h-4 w-4" /> Đã nhận lương ({p.paymentDate})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="h-4 w-4" /> Đang chờ giải ngân
                      </span>
                    )}
                  </div>
                </div>

                {/* Employee Info Snapshot */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-2xl text-xs">
                  <div>
                    <span className="text-stone-400 text-[11px] block">Họ và tên</span>
                    <span className="font-bold text-stone-900">{p.employeeNameSnapshot}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[11px] block">Mã nhân viên</span>
                    <span className="font-mono font-bold text-stone-800">{p.employeeCodeSnapshot}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[11px] block">Lương cơ bản</span>
                    <span className="font-bold text-stone-900">
                      {new Intl.NumberFormat('vi-VN').format(p.baseSalarySnapshot)} đ
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[11px] block">Công thực tế / chuẩn</span>
                    <span className="font-bold text-amber-800">
                      {p.actualWorkdaysSnapshot} / {p.standardWorkdaysSnapshot} ngày
                    </span>
                  </div>
                </div>

                {/* Calculation Table */}
                <div className="border border-stone-200 rounded-2xl overflow-hidden text-xs">
                  <div className="divide-y divide-stone-100">
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-stone-600">
                        1. Lương tính theo công ({p.baseSalarySnapshot.toLocaleString('vi-VN')} × {p.actualWorkdaysSnapshot} / {p.standardWorkdaysSnapshot}):
                      </span>
                      <span className="font-semibold text-stone-900">
                        {new Intl.NumberFormat('vi-VN').format(p.calculatedSalary)} đ
                      </span>
                    </div>

                    <div className="p-3 flex justify-between items-center text-emerald-700">
                      <span>2. Các khoản phụ cấp, khen thưởng (+):</span>
                      <span className="font-semibold">
                        +{new Intl.NumberFormat('vi-VN').format(p.totalAllowances)} đ
                      </span>
                    </div>

                    <div className="p-3 flex justify-between items-center text-rose-700">
                      <span>3. Các khoản khấu trừ, vi phạm, giảm trừ (-):</span>
                      <span className="font-semibold">
                        -{new Intl.NumberFormat('vi-VN').format(p.totalDeductions)} đ
                      </span>
                    </div>

                    <div className="p-4 bg-amber-50/70 flex justify-between items-center font-extrabold text-sm border-t border-amber-200/80">
                      <span className="text-amber-950 uppercase">TỔNG LƯƠNG THỰC LĨNH (=):</span>
                      <span className="text-amber-900 text-lg">
                        {new Intl.NumberFormat('vi-VN').format(p.netSalary)} đ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Detail note if paid */}
                {isPaid && (
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      {p.paymentMethod === 'BANK_TRANSFER' ? (
                        <Building2 className="h-4 w-4 text-emerald-700 shrink-0" />
                      ) : (
                        <Wallet className="h-4 w-4 text-emerald-700 shrink-0" />
                      )}
                      <span>
                        Chi trả qua {p.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'} • Ngày {p.paymentDate}
                        {p.paymentNote ? ` • "${p.paymentNote}"` : ''}
                      </span>
                    </div>
                    {p.paidBy && <span className="text-[11px] text-emerald-700">Bởi: {p.paidBy}</span>}
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
