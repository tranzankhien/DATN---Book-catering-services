import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt,
  Search,
  Plus,
  Filter,
  FileDown,
  Trash2,
  Eye,
  RefreshCw,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { supplierService } from '../../services/supplierService';
import type { StockReceiptDto, SupplierDto } from '../../services/types';
import { useToast } from '../../hooks/useToast';

export const AdminStockReceiptsPage: React.FC = () => {
  const [receipts, setReceipts] = useState<StockReceiptDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [keyword, setKeyword] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);

  const { showToast } = useToast();

  const loadSuppliers = async () => {
    try {
      const list = await supplierService.getSuppliers();
      setSuppliers(list);
    } catch {
      // ignore
    }
  };

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const list = await inventoryService.getStockReceipts({
        keyword: keyword || undefined,
        supplierId: selectedSupplierId !== 'ALL' ? parseInt(selectedSupplierId) : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        paymentStatus: paymentFilter !== 'ALL' ? paymentFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setReceipts(list);
    } catch {
      showToast('Không thể tải danh sách phiếu nhập', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    loadReceipts();
  }, [keyword, selectedSupplierId, statusFilter, paymentFilter, fromDate, toDate]);

  const handleDownloadPdf = async (e: React.MouseEvent, r: StockReceiptDto) => {
    e.stopPropagation();
    try {
      setDownloadingPdfId(r.id);
      showToast(`Đang kết xuất PDF phiếu ${r.code}...`, 'info');
      await inventoryService.downloadReceiptPdf(r.id, r.code);
      showToast(`Tải xuống PDF ${r.code} thành công!`, 'success');
    } catch {
      showToast('Không thể xuất file PDF', 'error');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleDeleteDraft = async (e: React.MouseEvent, r: StockReceiptDto) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phiếu nhập nháp "${r.code}"?`)) {
      return;
    }
    try {
      await inventoryService.deleteDraftReceipt(r.id);
      showToast(`Đã xóa phiếu nhập ${r.code}`, 'success');
      loadReceipts();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể xóa phiếu nhập';
      showToast(msg, 'error');
    }
  };

  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
            <Receipt className="h-4 w-4" />
            <span>Chứng Từ Kho & Nhập Hàng</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Quản Lý Phiếu Nhập Nguyên Liệu
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Lập phiếu nhập, lưu nháp hoặc xác nhận tăng tồn kho, tự động tính giá vốn bình quân di động và xuất PDF A4.
          </p>
        </div>

        <Link
          to="/admin/inventory/receipts/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm shadow-amber-600/20 cursor-pointer self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tạo Phiếu Nhập Mới</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm theo mã phiếu (PN-000001) hoặc tên NCC..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Supplier Filter */}
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white font-medium text-stone-700 focus:outline-none focus:border-amber-600 max-w-[200px] truncate"
            >
              <option value="ALL">Tất cả nhà cung cấp</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Receipt Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white font-medium text-stone-700 focus:outline-none focus:border-amber-600"
            >
              <option value="ALL">Tất cả trạng thái phiếu</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="CONFIRMED">Đã nhập kho (Xác nhận)</option>
            </select>

            {/* Payment Status Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white font-medium text-stone-700 focus:outline-none focus:border-amber-600"
            >
              <option value="ALL">Tất cả thanh toán</option>
              <option value="PAID">Đã thanh toán đủ</option>
              <option value="PARTIALLY_PAID">Còn nợ (Thanh toán 1 phần)</option>
              <option value="UNPAID">Chưa thanh toán</option>
            </select>

            <button
              type="button"
              onClick={loadReceipts}
              className="p-2 text-stone-500 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors"
              title="Làm mới"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-500">Từ ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-stone-200 text-xs focus:outline-none focus:border-amber-600 font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-500">Đến ngày:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-stone-200 text-xs focus:outline-none focus:border-amber-600 font-mono"
            />
          </div>
          {(fromDate || toDate || keyword || statusFilter !== 'ALL' || paymentFilter !== 'ALL' || selectedSupplierId !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setKeyword('');
                setSelectedSupplierId('ALL');
                setStatusFilter('ALL');
                setPaymentFilter('ALL');
                setFromDate('');
                setToDate('');
              }}
              className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer ml-auto"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Mã Phiếu</th>
                <th className="py-3 px-4">Ngày Nhập</th>
                <th className="py-3 px-4">Nhà Cung Cấp</th>
                <th className="py-3 px-4 text-right">Tổng Tiền</th>
                <th className="py-3 px-4 text-right">Đã Trả</th>
                <th className="py-3 px-4 text-right">Còn Nợ</th>
                <th className="py-3 px-4 text-center">Trạng Thái Kho</th>
                <th className="py-3 px-4 text-center">Thanh Toán</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && receipts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-600 mb-2" />
                    <span>Đang tải danh sách phiếu nhập...</span>
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400">
                    Không tìm thấy phiếu nhập nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                receipts.map((r) => {
                  const isConfirmed = r.status === 'CONFIRMED';
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-amber-50/30 transition-colors cursor-pointer"
                      onClick={() => (window.location.href = `/admin/inventory/receipts/${r.id}`)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">{r.code}</td>
                      <td className="py-3 px-4 font-mono text-stone-600">{formatDate(r.receiptDate)}</td>
                      <td className="py-3 px-4 font-semibold text-stone-900 max-w-xs truncate">
                        <div>{r.supplierName}</div>
                        <span className="text-[11px] font-mono text-stone-400 font-normal">{r.supplierPhone}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                        {formatVnd(r.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                        {formatVnd(r.amountPaid)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                        {formatVnd(r.remainingAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isConfirmed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isConfirmed ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Đã nhập kho
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" />
                              Bản nháp
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700'
                              : r.paymentStatus === 'PARTIALLY_PAID'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {r.paymentStatus === 'PAID'
                            ? 'Đã trả đủ'
                            : r.paymentStatus === 'PARTIALLY_PAID'
                            ? 'Trả 1 phần'
                            : 'Chưa trả'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <Link
                            to={`/admin/inventory/receipts/${r.id}`}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-amber-700 hover:bg-stone-100 transition-colors"
                            title="Xem chi tiết phiếu nhập"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => handleDownloadPdf(e, r)}
                            disabled={downloadingPdfId === r.id}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-blue-700 hover:bg-stone-100 transition-colors disabled:opacity-50"
                            title="Xuất file PDF A4"
                          >
                            <FileDown
                              className={`h-4 w-4 ${downloadingPdfId === r.id ? 'animate-bounce text-blue-600' : ''}`}
                            />
                          </button>
                          {!isConfirmed && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteDraft(e, r)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-100 transition-colors"
                              title="Xóa phiếu nháp"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
