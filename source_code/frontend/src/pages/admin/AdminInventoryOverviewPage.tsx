import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Warehouse,
  AlertTriangle,
  Coins,
  Calendar,
  Receipt,
  History,
  Plus,
  Truck,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import type { InventorySummaryDto } from '../../services/types';
import { useToast } from '../../hooks/useToast';

export const AdminInventoryOverviewPage: React.FC = () => {
  const [summary, setSummary] = useState<InventorySummaryDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventoryOverview();
      setSummary(data);
    } catch {
      showToast('Không thể tải dữ liệu tổng quan kho', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  if (loading && !summary) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-stone-500">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mb-3" />
        <p className="text-sm font-medium">Đang tải dữ liệu tổng quan kho...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
            <Warehouse className="h-4 w-4" />
            <span>Phân hệ Kho & Quản lý Nhập Hàng</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Tổng Quan Kho Nguyên Liệu & Giá Vốn
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Theo dõi giá trị tồn kho thực tế, giá vốn bình quân di động, ngưỡng cảnh báo và công nợ nhà cung cấp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors shadow-sm cursor-pointer"
            title="Làm mới số liệu"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Làm mới</span>
          </button>
          <Link
            to="/admin/suppliers"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors shadow-sm"
          >
            <Truck className="h-3.5 w-3.5 text-stone-500" />
            <span>Nhà Cung Cấp</span>
          </Link>
          <Link
            to="/admin/inventory/receipts/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm shadow-amber-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo Phiếu Nhập</span>
          </Link>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng nguyên liệu & Cảnh báo tồn */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Nguyên Liệu Trong Kho</span>
            <div className="h-8 w-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
              <Warehouse className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-900">{summary?.totalIngredients || 0}</span>
            <span className="text-xs font-medium text-stone-500">mặt hàng</span>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500">Cảnh báo tồn thấp:</span>
            {summary && summary.lowStockCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                <AlertTriangle className="h-3 w-3" />
                {summary.lowStockCount} cần nhập
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                An toàn
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Giá trị tồn kho ước tính */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Giá Trị Tồn Kho Ước Tính</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-800 tracking-tight">
              {formatVnd(summary?.estimatedStockValue || 0)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Phương pháp tính:</span>
            <span className="font-semibold text-stone-700">Bình quân di động</span>
          </div>
        </div>

        {/* Card 3: Tiền nhập trong tháng */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Nhập Hàng Tháng Này</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-stone-900 tracking-tight">
              {formatVnd(summary?.monthlyPurchasedAmount || 0)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Toàn kỳ đã nhập:</span>
            <span className="font-semibold text-stone-700">{formatVnd(summary?.totalPurchasedAmount || 0)}</span>
          </div>
        </div>

        {/* Card 4: Công nợ nhà cung cấp */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Công Nợ Phải Trả NCC</span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-900 tracking-tight">
              {formatVnd(summary?.totalRemainingToSuppliers || 0)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Đã thanh toán:</span>
            <span className="font-semibold text-stone-700">{formatVnd(summary?.totalPaidToSuppliers || 0)}</span>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Section (If any) */}
      {summary && summary.lowStockIngredients && summary.lowStockIngredients.length > 0 && (
        <div className="bg-rose-50/60 rounded-2xl p-5 border border-rose-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900">
                  Cảnh Báo: {summary.lowStockIngredients.length} Nguyên Liệu Dưới Ngưỡng An Toàn
                </h3>
                <p className="text-xs text-rose-600">
                  Cần lập kế hoạch nhập hàng sớm để không gián đoạn khâu chế biến tiệc.
                </p>
              </div>
            </div>
            <Link
              to="/admin/inventory/receipts/new"
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-800 bg-white px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm"
            >
              <span>Nhập hàng ngay</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {summary.lowStockIngredients.map((item) => (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-400">
                    <span>{item.code}</span>
                    <span className="text-rose-600 font-bold">Tồn thấp</span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 mt-1 truncate" title={item.name}>
                    {item.name}
                  </h4>
                </div>
                <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-stone-400">Hiện tại: </span>
                    <span className="text-xs font-extrabold text-rose-600">
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-400">Tối thiểu: </span>
                    <span className="text-xs font-semibold text-stone-700">
                      {item.minStockThreshold} {item.unit}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Columns: Recent Receipts & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Stock Receipts */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-amber-700" />
              <h2 className="text-sm font-bold text-stone-900">Phiếu Nhập Gần Đây</h2>
            </div>
            <Link
              to="/admin/inventory/receipts"
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-stone-100 flex-1">
            {summary?.recentReceipts && summary.recentReceipts.length > 0 ? (
              summary.recentReceipts.map((r) => (
                <Link
                  key={r.id}
                  to={`/admin/inventory/receipts/${r.id}`}
                  className="p-4 flex items-center justify-between hover:bg-stone-50/70 transition-colors block"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-stone-900">{r.code}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {r.status === 'CONFIRMED' ? 'Đã nhập kho' : 'Bản nháp'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 truncate max-w-xs">{r.supplierName}</p>
                    <p className="text-[11px] text-stone-400 font-mono">{formatDate(r.receiptDate)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-extrabold text-stone-900">{formatVnd(r.totalAmount)}</div>
                    <span
                      className={`text-[10px] font-semibold ${
                        r.paymentStatus === 'PAID'
                          ? 'text-emerald-600'
                          : r.paymentStatus === 'PARTIALLY_PAID'
                          ? 'text-amber-600'
                          : 'text-stone-400'
                      }`}
                    >
                      {r.paymentStatus === 'PAID'
                        ? 'Đã trả đủ'
                        : r.paymentStatus === 'PARTIALLY_PAID'
                        ? `Còn nợ ${formatVnd(r.remainingAmount)}`
                        : 'Chưa thanh toán'}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-stone-400">Chưa có phiếu nhập hàng nào</div>
            )}
          </div>
        </div>

        {/* Recent Stock Movements */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-amber-700" />
              <h2 className="text-sm font-bold text-stone-900">Biến Động Kho Gần Đây</h2>
            </div>
            <Link
              to="/admin/inventory/movements"
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>Xem sổ biến động</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-stone-100 flex-1">
            {summary?.recentMovements && summary.recentMovements.length > 0 ? (
              summary.recentMovements.slice(0, 6).map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between hover:bg-stone-50/70 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          m.movementType === 'IMPORT'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : m.movementType === 'ADJUSTMENT'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {m.movementType === 'IMPORT'
                          ? 'Nhập kho'
                          : m.movementType === 'ADJUSTMENT'
                          ? 'Điều chỉnh'
                          : 'Xuất kho'}
                      </span>
                      <span className="text-xs font-bold text-stone-900 truncate max-w-[160px]">
                        {m.ingredientName}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400 flex items-center gap-2">
                      <span className="font-mono">{m.referenceCode}</span>
                      <span>•</span>
                      <span>{formatDateTime(m.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xs font-extrabold ${
                        m.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange} {m.unit}
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Tồn sau: <span className="font-semibold text-stone-600">{m.stockAfter} {m.unit}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-stone-400">Chưa ghi nhận biến động kho nào</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

