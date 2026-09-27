import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Receipt,
  ArrowLeft,
  FileDown,
  CheckCircle2,
  Clock,
  Trash2,
  CreditCard,
  Truck,
  Boxes,
  Coins,
  RefreshCw,
  X,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import type { StockReceiptDto, StockReceiptPaymentPayload } from '../../services/types';
import { useToast } from '../../hooks/useToast';

export const AdminStockReceiptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [receipt, setReceipt] = useState<StockReceiptDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [confirming, setConfirming] = useState<boolean>(false);

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);

  const loadReceipt = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await inventoryService.getStockReceiptById(Number(id));
      setReceipt(data);
    } catch {
      showToast('Không tìm thấy phiếu nhập nguyên liệu', 'error');
      navigate('/admin/inventory/receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipt();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!receipt) return;
    try {
      setDownloadingPdf(true);
      showToast(`Đang kết xuất PDF phiếu ${receipt.code}...`, 'info');
      await inventoryService.downloadReceiptPdf(receipt.id, receipt.code);
      showToast(`Tải file PDF ${receipt.code} thành công!`, 'success');
    } catch {
      showToast('Không thể xuất file PDF', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleConfirm = async () => {
    if (!receipt) return;
    if (
      !window.confirm(
        `Xác nhận nhập kho phiếu ${receipt.code}? Tồn kho sẽ được cộng tăng và giá vốn bình quân di động sẽ được tính lại ngay lập tức.`
      )
    ) {
      return;
    }
    try {
      setConfirming(true);
      const res = await inventoryService.confirmStockReceipt(receipt.id);
      showToast('Xác nhận nhập kho thành công! Đã tăng tồn kho và cập nhật giá vốn.', 'success');
      setReceipt(res);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể xác nhận phiếu nhập';
      showToast(msg, 'error');
    } finally {
      setConfirming(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!receipt) return;
    if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn phiếu nhập nháp "${receipt.code}"?`)) {
      return;
    }
    try {
      await inventoryService.deleteDraftReceipt(receipt.id);
      showToast(`Đã xóa phiếu nhập ${receipt.code}`, 'success');
      navigate('/admin/inventory/receipts');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể xóa phiếu';
      showToast(msg, 'error');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receipt) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Số tiền thanh toán phải lớn hơn 0 VND', 'error');
      return;
    }
    if (amount > receipt.remainingAmount) {
      showToast('Số tiền thanh toán vượt quá số tiền còn nợ', 'error');
      return;
    }

    try {
      setSubmittingPayment(true);
      const payload: StockReceiptPaymentPayload = {
        paymentAmount: amount,
        paymentNote: paymentNote.trim() || undefined,
      };
      const res = await inventoryService.recordPayment(receipt.id, payload);
      showToast('Ghi nhận thanh toán thành công!', 'success');
      setReceipt(res);
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNote('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể ghi nhận thanh toán';
      showToast(msg, 'error');
    } finally {
      setSubmittingPayment(false);
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

  const formatDateTime = (isoStr: string) => {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || !receipt) {
    return (
      <div className="p-12 text-center text-stone-400">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-amber-600 mb-3" />
        <p className="text-sm">Đang tải chi tiết phiếu nhập...</p>
      </div>
    );
  }

  const isConfirmed = receipt.status === 'CONFIRMED';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/inventory/receipts"
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-stone-500 uppercase">Phiếu Nhập</span>
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
            </div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight font-mono mt-0.5">
              {receipt.code}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Download PDF button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            title="Xuất file PDF khổ A4 chuẩn in ấn"
          >
            <FileDown className={`h-4 w-4 text-blue-600 ${downloadingPdf ? 'animate-bounce' : ''}`} />
            <span>{downloadingPdf ? 'Đang tạo PDF...' : 'Xuất Phiếu Nhập PDF'}</span>
          </button>

          {!isConfirmed && (
            <>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm shadow-amber-600/20 cursor-pointer disabled:opacity-50"
                title="Cộng kho và tính giá vốn"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{confirming ? 'Đang xác nhận...' : 'Xác Nhận Nhập Kho'}</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteDraft}
                className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-100 transition-colors"
                title="Xóa phiếu nháp"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}

          {isConfirmed && receipt.remainingAmount > 0 && (
            <button
              type="button"
              onClick={() => {
                setPaymentAmount(receipt.remainingAmount.toString());
                setShowPaymentModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm shadow-purple-600/20 cursor-pointer"
            >
              <CreditCard className="h-4 w-4" />
              <span>Ghi Nhận Thanh Toán</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Card 1: NCC */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-stone-400 font-bold uppercase text-[10px] tracking-wider">
            <Truck className="h-3.5 w-3.5 text-amber-600" />
            <span>Nhà Cung Cấp</span>
          </div>
          <div>
            <div className="font-bold text-stone-900 text-sm">{receipt.supplierName}</div>
            <div className="text-stone-500 font-mono mt-0.5">SĐT: {receipt.supplierPhone}</div>
            {receipt.supplierAddress && (
              <div className="text-stone-400 text-[11px] truncate mt-0.5">{receipt.supplierAddress}</div>
            )}
          </div>
        </div>

        {/* Card 2: Date & Creator */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-stone-400 font-bold uppercase text-[10px] tracking-wider">
            <Clock className="h-3.5 w-3.5 text-blue-600" />
            <span>Thời Gian & Người Lập</span>
          </div>
          <div>
            <div className="text-stone-900 font-semibold">
              Ngày nhập: <span className="font-mono font-bold">{formatDate(receipt.receiptDate)}</span>
            </div>
            <div className="text-stone-500 mt-0.5">
              Người lập: <span className="font-medium text-stone-700">{receipt.createdByName || 'ADMIN'}</span>
            </div>
            {receipt.confirmedByName && (
              <div className="text-stone-500 text-[11px] mt-0.5">
                Xác nhận bởi:{' '}
                <span className="font-medium text-emerald-700">{receipt.confirmedByName}</span> (
                {formatDateTime(receipt.confirmedAt || '')})
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Financial Summary */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-stone-400 font-bold uppercase text-[10px] tracking-wider">
            <Coins className="h-3.5 w-3.5 text-emerald-600" />
            <span>Thanh Toán & Công Nợ</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-stone-500">Tổng tiền:</span>
              <span className="font-mono font-bold text-stone-900 text-sm">{formatVnd(receipt.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Đã trả:</span>
              <span className="font-mono font-semibold text-emerald-700">{formatVnd(receipt.amountPaid)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-stone-100">
              <span className="font-bold text-stone-700">Còn nợ:</span>
              <span className="font-mono font-extrabold text-rose-700">{formatVnd(receipt.remainingAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden space-y-0">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Boxes className="h-4 w-4 text-amber-600" />
            <span>Chi Tiết Nguyên Liệu Trong Phiếu ({receipt.items?.length || 0} dòng)</span>
          </h2>
          {receipt.note && (
            <span className="text-xs text-stone-500 italic max-w-md truncate">Ghi chú: {receipt.note}</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Mã</th>
                <th className="py-3 px-4">Tên Nguyên Liệu</th>
                <th className="py-3 px-4">Đơn Vị</th>
                <th className="py-3 px-4 text-right">Số Lượng</th>
                <th className="py-3 px-4 text-right">Đơn Giá (₫)</th>
                <th className="py-3 px-4 text-right">Thành Tiền (₫)</th>
                <th className="py-3 px-4">Ghi Chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {receipt.items?.map((item) => (
                <tr key={item.id} className="hover:bg-amber-50/20">
                  <td className="py-3 px-4 text-center font-mono text-stone-400">{item.lineNo}</td>
                  <td className="py-3 px-4 font-mono font-bold text-stone-700">{item.ingredientCode}</td>
                  <td className="py-3 px-4 font-semibold text-stone-900">{item.ingredientName}</td>
                  <td className="py-3 px-4 text-stone-600">{item.unit}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">{item.quantity}</td>
                  <td className="py-3 px-4 text-right font-mono text-stone-700">{formatVnd(item.unitPrice)}</td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-amber-900">
                    {formatVnd(item.lineTotal)}
                  </td>
                  <td className="py-3 px-4 text-stone-400 italic text-[11px]">{item.note || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-stone-50/90 border-t border-stone-200 font-bold text-xs">
                <td colSpan={6} className="py-3.5 px-4 text-right text-stone-600">
                  TỔNG CỘNG TIỀN PHIẾU:
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-black text-amber-800 text-sm">
                  {formatVnd(receipt.totalAmount)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handlePaymentSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <h3 className="text-base font-bold text-stone-900">Ghi Nhận Thanh Toán NCC</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Mã phiếu:</span>
                <span className="font-mono font-bold text-stone-900">{receipt.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Số tiền còn nợ:</span>
                <span className="font-mono font-extrabold text-rose-600">
                  {formatVnd(receipt.remainingAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Số tiền thanh toán thêm (₫) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max={receipt.remainingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono text-stone-900 focus:outline-none focus:border-amber-600 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Ghi chú thanh toán</label>
                <input
                  type="text"
                  placeholder="VD: Ủy nhiệm chi số UNC-8899..."
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-stone-600 hover:bg-stone-100"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submittingPayment}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {submittingPayment ? 'Đang lưu...' : 'Lưu Thanh Toán'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
