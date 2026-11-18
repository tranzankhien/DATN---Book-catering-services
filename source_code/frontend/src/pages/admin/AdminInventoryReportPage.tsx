import React, { useEffect, useState } from 'react';
import {
  Warehouse,
  Boxes,
  Truck,
  AlertTriangle,
  Receipt,
  Download,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import type {
  IngredientValuationDto,
  InventoryReportResponse,
  SupplierPurchaseDto,
} from '../../services/types';
import { ReportDateFilter, type DateRange } from '../../components/ReportDateFilter';
import { extractErrorMessage } from '../../services/apiClient';

export const AdminInventoryReportPage: React.FC = () => {
  const getDefaultDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      startDate: formatDate(firstDay),
      endDate: formatDate(now),
    };
  };

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDates());
  const [activeTab, setActiveTab] = useState<'VALUATION' | 'SUPPLIERS'>('VALUATION');
  const [loading, setLoading] = useState<boolean>(true);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [overview, setOverview] = useState<InventoryReportResponse | null>(null);
  const [valuations, setValuations] = useState<IngredientValuationDto[]>([]);
  const [supplierPurchases, setSupplierPurchases] = useState<SupplierPurchaseDto[]>([]);

  const loadData = async (range: DateRange) => {
    setLoading(true);
    setError('');
    try {
      const [ovRes, valRes, supRes] = await Promise.all([
        reportService.getInventoryOverview(range),
        reportService.getIngredientValuation(),
        reportService.getSupplierPurchases(range),
      ]);

      setOverview(ovRes.data);
      setValuations(valRes.data || []);
      setSupplierPurchases(supRes.data || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Không thể tải báo cáo kho & giá vốn'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(dateRange);
  }, [dateRange]);

  const handleExportCsv = async () => {
    try {
      setExportLoading(true);
      await reportService.downloadExportCsv('inventory', dateRange);
    } catch (err) {
      alert(extractErrorMessage(err, 'Lỗi khi xuất file CSV'));
    } finally {
      setExportLoading(false);
    }
  };

  const formatVnd = (value?: number | null) => {
    if (value === undefined || value === null) return '0 ₫';
    return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
          <Warehouse className="h-7 w-7 text-amber-700" /> Báo cáo kho, giá vốn & nhập hàng
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">
          Định giá tồn kho theo giá vốn bình quân di động, tổng giá trị nhập kho đã xác nhận và theo dõi giá vốn tiêu hao đơn tiệc
        </p>
      </div>

      {/* Date Filter & Export */}
      <ReportDateFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onChange={setDateRange}
        onRefresh={() => loadData(dateRange)}
        onExportCsv={handleExportCsv}
        exportLoading={exportLoading}
        exportLabel="Xuất báo cáo kho CSV"
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Định giá tồn kho hiện tại</span>
          <div className="mt-2 text-2xl font-bold text-stone-900 tabular-nums">
            {formatVnd(overview?.estimatedInventoryValuation)}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            = Σ (Tồn kho thực tế × Giá vốn bình quân)
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Giá vốn NVL tiêu hao (COGS)</span>
          <div className="mt-2 text-2xl font-bold text-amber-700 tabular-nums">
            {formatVnd(overview?.totalConsumedCost)}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            Giá vốn xuất kho các đơn tiệc đã thanh toán
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Giá trị nhập kho trong kỳ</span>
          <div className="mt-2 text-2xl font-bold text-stone-900 tabular-nums">
            {formatVnd(overview?.confirmedPurchasesAmount)}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            Phiếu nhập kho trạng thái CONFIRMED
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-4.5 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Cảnh báo nguyên liệu</span>
          <div className="mt-2 text-2xl font-bold text-amber-700 tabular-nums">
            {overview?.lowStockCount ?? 0} / {overview?.totalIngredientsCount ?? 0}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            Nguyên liệu có tồn kho ≤ ngưỡng an toàn
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('VALUATION')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'VALUATION'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
          }`}
        >
          Định giá tồn kho từng nguyên liệu ({valuations.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SUPPLIERS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'SUPPLIERS'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
          }`}
        >
          Nhập hàng & Công nợ theo NCC ({supplierPurchases.length})
        </button>
      </div>

      {/* Tab 1: Valuation List */}
      {activeTab === 'VALUATION' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-semibold">
                  <th className="pb-3 font-semibold">Nguyên liệu</th>
                  <th className="pb-3 font-semibold text-center">Đơn vị</th>
                  <th className="pb-3 font-semibold text-right">Tồn kho thực tế</th>
                  <th className="pb-3 font-semibold text-right">Ngưỡng tối thiểu</th>
                  <th className="pb-3 font-semibold text-right">Giá vốn bình quân</th>
                  <th className="pb-3 font-semibold text-right">Tổng giá trị định giá</th>
                  <th className="pb-3 font-semibold text-center">Trạng thái kho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {valuations.length > 0 ? (
                  valuations.map((item) => (
                    <tr key={item.ingredientId} className="hover:bg-stone-50/50">
                      <td className="py-3 font-bold text-stone-900">{item.name}</td>
                      <td className="py-3 text-center text-stone-600">{item.unit}</td>
                      <td className="py-3 text-right font-semibold text-stone-900 tabular-nums">
                        {Number(item.currentStock).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 text-right text-stone-500 tabular-nums">
                        {Number(item.minStockThreshold).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 text-right font-medium text-stone-700 tabular-nums">
                        {formatVnd(item.avgUnitCost)}
                      </td>
                      <td className="py-3 text-right font-bold text-amber-800 tabular-nums">
                        {formatVnd(item.totalValue)}
                      </td>
                      <td className="py-3 text-center">
                        {item.lowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            <AlertCircle className="h-3 w-3" /> Cảnh báo tồn thấp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> An toàn
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400 italic">
                      Không có dữ liệu nguyên liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Supplier Purchases & Debt */}
      {activeTab === 'SUPPLIERS' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-semibold">
                  <th className="pb-3 font-semibold">Nhà cung cấp</th>
                  <th className="pb-3 font-semibold text-center">Số phiếu đã nhập</th>
                  <th className="pb-3 font-semibold text-right">Tổng giá trị nhập</th>
                  <th className="pb-3 font-semibold text-right">Đã thanh toán</th>
                  <th className="pb-3 font-semibold text-right">Công nợ còn nợ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {supplierPurchases.length > 0 ? (
                  supplierPurchases.map((sup) => (
                    <tr key={sup.supplierId} className="hover:bg-stone-50/50">
                      <td className="py-3">
                        <p className="font-bold text-stone-900">{sup.supplierName}</p>
                        <p className="text-[11px] text-stone-400 tabular-nums">{sup.supplierPhone}</p>
                      </td>
                      <td className="py-3 text-center font-semibold text-stone-800 tabular-nums">
                        {sup.confirmedReceiptsCount}
                      </td>
                      <td className="py-3 text-right font-semibold text-stone-900 tabular-nums">
                        {formatVnd(sup.totalPurchasedAmount)}
                      </td>
                      <td className="py-3 text-right font-medium text-emerald-700 tabular-nums">
                        {formatVnd(sup.totalPaidAmount)}
                      </td>
                      <td className="py-3 text-right font-bold text-rose-700 tabular-nums">
                        {formatVnd(sup.outstandingDebt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400 italic">
                      Không có giao dịch nhập hàng nào từ nhà cung cấp trong khoảng thời gian này
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
