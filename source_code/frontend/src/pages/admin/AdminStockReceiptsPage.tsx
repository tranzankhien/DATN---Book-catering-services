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
  Warehouse,
  X,
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { supplierService } from '../../services/supplierService';
import type { StockReceiptDto, SupplierDto } from '../../services/types';
import { useToast } from '../../hooks/useToast';
import { Pagination, usePagination } from '../../components/common/Pagination';

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

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedReceipts,
    totalItems,
  } = usePagination(receipts, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, selectedSupplierId, statusFilter, paymentFilter, fromDate, toDate, setCurrentPage]);

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

  const totalReceiptsAmount = receipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const confirmedCount = receipts.filter((r) => r.status === 'CONFIRMED').length;
  const draftCount = receipts.filter((r) => r.status === 'DRAFT').length;

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
            <Receipt className="h-4 w-4" />
            <span>Chứng từ kho & nhập hàng</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight mt-1">
            Quản lý phiếu nhập nguyên liệu
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Lập phiếu nhập, lưu nháp hoặc xác nhận tăng tồn kho, tự động tính giá vốn bình quân di động và xuất PDF A4.
          </p>
        </div>

        <Link
          to="/admin/inventory/receipts/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-amber-700 hover:bg-amber-800 text-white transition-all shadow-xs cursor-pointer self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tạo phiếu nhập mới</span>
        </Link>
      </div>

      {/* 4 Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-stone-600">
              Tổng số phiếu nhập
            </span>
            <p className="text-2xl font-bold text-stone-900">{receipts.length}</p>
            <span className="text-[11px] text-stone-400">Chứng từ đã lập</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center border border-stone-200">
            <Receipt className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-emerald-700">
              Đã nhập kho
            </span>
            <p className="text-2xl font-bold text-emerald-700">{confirmedCount}</p>
            <span className="text-[11px] text-stone-400">Đã cộng tồn & tính giá vốn</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-amber-800">
              Bản nháp chờ duyệt
            </span>
            <p className="text-2xl font-bold text-amber-700">{draftCount}</p>
            <span className="text-[11px] text-stone-400">Chưa làm thay đổi tồn kho</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-amber-900">
              Tổng giá trị phiếu
            </span>
            <p className="text-xl font-bold tabular-nums text-amber-800">{formatVnd(totalReceiptsAmount)}</p>
            <span className="text-[11px] text-stone-400">Theo bộ lọc hiển thị</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <Warehouse className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm theo mã phiếu (PN-000001) hoặc tên nhà cung cấp..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                title="Xóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Supplier Filter */}
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-white font-medium text-stone-700 focus:outline-none focus:border-amber-600 max-w-[220px] truncate shadow-xs"
            >
              <option value="ALL">Tất cả nhà cung cấp ({suppliers.length})</option>
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
              className="px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-white font-medium text-stone-700 focus:outline-none focus:border-amber-600 shadow-xs"
            >
              <option value="ALL">Tất cả trạng thái kho</option>
              <option value="DRAFT">Bản nháp ({draftCount})</option>
              <option value="CONFIRMED">Đã nhập kho ({confirmedCount})</option>
            </select>

            {/* Payment Status Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-white font-medium text-stone-700 focus:outline-none focus:border-amber-600 shadow-xs"
            >
              <option value="ALL">Tất cả thanh toán</option>
              <option value="UNPAID">Chưa thanh toán</option>
              <option value="PAID">Đã thanh toán đủ</option>
            </select>

            <button
              type="button"
              onClick={loadReceipts}
              className="p-2 text-stone-500 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors border border-stone-200 shadow-xs cursor-pointer"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-stone-100 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-500">Từ ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs focus:outline-none focus:border-amber-600 tabular-nums shadow-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-500">Đến ngày:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs focus:outline-none focus:border-amber-600 tabular-nums shadow-xs"
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

      {/* Receipts Table with Optimized Proportional Column Widths */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-semibold text-xs">
                <th className="py-3 px-4 w-36 whitespace-nowrap">Mã phiếu</th>
                <th className="py-3 px-4 w-32 whitespace-nowrap">Ngày nhập</th>
                <th className="py-3 px-4 min-w-[280px]">Nhà cung cấp</th>
                <th className="py-3 px-4 text-right w-44 whitespace-nowrap">Tổng tiền</th>
                <th className="py-3 px-4 text-center w-36 whitespace-nowrap">Trạng thái kho</th>
                <th className="py-3 px-4 text-center w-36 whitespace-nowrap">Thanh toán</th>
                <th className="py-3 px-4 text-center w-40 whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-stone-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-600 mb-2" />
                    <span className="font-medium">Đang tải danh sách phiếu nhập...</span>
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-stone-400">
                    <Receipt className="h-8 w-8 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-600 text-sm">Không tìm thấy phiếu nhập nào</p>
                    <p className="text-xs text-stone-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc mốc thời gian</p>
                  </td>
                </tr>
              ) : (
                paginatedReceipts.map((r) => {
                  const isConfirmed = r.status === 'CONFIRMED';
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-amber-50/30 transition-colors cursor-pointer group"
                      onClick={() => (window.location.href = `/admin/inventory/receipts/${r.id}`)}
                    >
                      <td className="py-3.5 px-4 tabular-nums font-bold text-stone-900 whitespace-nowrap bg-stone-50/40">
                        {r.code}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums text-stone-600 whitespace-nowrap">
                        {formatDate(r.receiptDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                          {r.supplierName}
                        </div>
                        {r.supplierPhone && (
                          <span className="text-[11px] tabular-nums text-stone-400 font-normal">
                            {r.supplierPhone}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-bold text-amber-900 whitespace-nowrap text-sm">
                        {formatVnd(r.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isConfirmed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isConfirmed ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Đã nhập kho
                            </>
                          ) : (
                            <>
                              <Clock className="h-3.5 w-3.5" />
                              Bản nháp
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            r.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              r.paymentStatus === 'PAID' ? 'bg-emerald-500' : 'bg-stone-400'
                            }`}
                          />
                          {r.paymentStatus === 'PAID' ? 'Đã trả đủ' : 'Chưa thanh toán'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <Link
                            to={`/admin/inventory/receipts/${r.id}`}
                            className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:text-amber-800 hover:bg-amber-50 hover:border-amber-300 transition-colors shadow-2xs"
                            title="Xem chi tiết phiếu nhập"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => handleDownloadPdf(e, r)}
                            disabled={downloadingPdfId === r.id}
                            className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
                            title="Xuất file PDF A4 chuẩn in ấn"
                          >
                            <FileDown
                              className={`h-3.5 w-3.5 ${downloadingPdfId === r.id ? 'animate-bounce text-blue-600' : ''}`}
                            />
                          </button>
                          {!isConfirmed && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteDraft(e, r)}
                              className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-2xs cursor-pointer"
                              title="Xóa phiếu nháp"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

        {receipts.length > 0 && (
          <div className="p-4 border-t border-stone-100">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 20, 50]}
              itemLabel="phiếu nhập"
            />
          </div>
        )}
      </div>
    </div>
  );
};

