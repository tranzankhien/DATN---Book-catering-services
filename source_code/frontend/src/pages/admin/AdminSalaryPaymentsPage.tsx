import React, { useState, useEffect, useMemo } from 'react';
import {
  Banknote,
  Building2,
  Wallet,
  Calendar,
  Search,
  CheckCircle2,
  DollarSign,
  Loader2,
  FileSpreadsheet,
  ArrowUpRight,
} from 'lucide-react';
import { employeeService } from '../../services/employeeService';
import type { SalaryPaymentDto } from '../../services/types';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../services/apiClient';
import { Pagination, usePagination } from '../../components/common/Pagination';

export const AdminSalaryPaymentsPage: React.FC = () => {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<SalaryPaymentDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await employeeService.getAllSalaryPayments();
      setPayments(res);
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể tải lịch sử chi trả lương'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    if (!searchTerm.trim()) return payments;
    const term = searchTerm.toLowerCase();
    return payments.filter(
      (p) =>
        p.employeeName.toLowerCase().includes(term) ||
        p.employeeCode.toLowerCase().includes(term) ||
        (p.note && p.note.toLowerCase().includes(term))
    );
  }, [payments, searchTerm]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedPayments,
    totalItems,
  } = usePagination(filteredPayments, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, setCurrentPage]);

  // Statistics
  const totalAmount = useMemo(() => payments.reduce((s, p) => s + (p.amount || 0), 0), [payments]);
  const bankTransferTotal = useMemo(
    () => payments.filter((p) => p.paymentMethod === 'BANK_TRANSFER').reduce((s, p) => s + (p.amount || 0), 0),
    [payments]
  );
  const cashTotal = useMemo(
    () => payments.filter((p) => p.paymentMethod === 'CASH').reduce((s, p) => s + (p.amount || 0), 0),
    [payments]
  );

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-6 animate-fade-up-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <Banknote className="h-7 w-7 text-amber-700" />
            Nhật ký chi trả tiền lương
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Sổ cái giải ngân tiền lương cho nhân viên toàn hệ thống, theo dõi phương thức và thời gian thực hiện.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Tổng giải ngân lương</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5 tabular-nums">
              {new Intl.NumberFormat('vi-VN').format(totalAmount)} <span className="text-xs font-normal text-stone-500">đ</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xl">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Chuyển khoản ngân hàng</p>
            <p className="text-2xl font-extrabold text-blue-700 mt-0.5 tabular-nums">
              {new Intl.NumberFormat('vi-VN').format(bankTransferTotal)} <span className="text-xs font-normal text-stone-500">đ</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Tiền mặt tại quỹ</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-0.5 tabular-nums">
              {new Intl.NumberFormat('vi-VN').format(cashTotal)} <span className="text-xs font-normal text-stone-500">đ</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã NV, họ tên, hoặc ghi chú thanh toán..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
          />
        </div>
        <div className="text-xs text-stone-500 font-semibold tabular-nums">
          Tổng số giao dịch: {filteredPayments.length}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-stone-500">
            <Loader2 className="h-8 w-8 animate-spin text-amber-700 mb-3" />
            <p className="text-sm font-medium">Đang tải nhật ký thanh toán lương...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-16 text-center text-stone-500">
            <Banknote className="h-12 w-12 mx-auto text-stone-300 mb-3" />
            <p className="text-base font-semibold text-stone-700">Chưa có giao dịch thanh toán lương nào</p>
            <p className="text-xs text-stone-400 mt-1">
              Giao dịch sẽ được lưu trữ tự động sau khi kế toán xác nhận chi trả ở mục Bảng lương.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/80 text-[10px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-4">Mã giao dịch</th>
                  <th className="py-3.5 px-4">Nhân viên thụ hưởng</th>
                  <th className="py-3.5 px-4">Kỳ lương</th>
                  <th className="py-3.5 px-4 text-right">Số tiền giải ngân</th>
                  <th className="py-3.5 px-4 text-center">Hình thức</th>
                  <th className="py-3.5 px-4">Ngày chi</th>
                  <th className="py-3.5 px-4">Người ghi nhận</th>
                  <th className="py-3.5 px-4">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {paginatedPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-700 tabular-nums">
                      #{String(pay.id).padStart(5, '0')}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{pay.employeeName}</div>
                      <span className="font-mono text-[11px] text-stone-500 bg-stone-100 px-1 rounded tabular-nums">
                        {pay.employeeCode}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-stone-800 tabular-nums">
                        <Calendar className="h-3 w-3 text-stone-400" />
                        {pay.periodMonth
                          ? `Tháng ${String(pay.periodMonth).padStart(2, '0')}/${pay.periodYear}`
                          : 'Kỳ lương'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-stone-900 text-sm tabular-nums">
                      {new Intl.NumberFormat('vi-VN').format(pay.amount)} đ
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {pay.paymentMethod === 'BANK_TRANSFER' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Building2 className="h-3 w-3" /> Chuyển khoản
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Wallet className="h-3 w-3" /> Tiền mặt
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-stone-700 tabular-nums">
                      {pay.paymentDate}
                    </td>

                    <td className="py-3.5 px-4 text-stone-600">
                      {pay.recordedBy || 'Hệ thống'}
                    </td>

                    <td className="py-3.5 px-4 text-stone-500 italic max-w-xs truncate">
                      {pay.note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

            {filteredPayments.length > 0 && (
              <div className="p-4 border-t border-stone-100">
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[10, 20, 50]}
                  itemLabel="giao dịch chi lương"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
