import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Boxes,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  Eye,
  Trash2,
  RefreshCw,
  UtensilsCrossed,
  History,
  X,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { catalogService } from '../../services/catalogService';
import type {
  IngredientDto,
  IngredientStockDetailDto,
  IngredientUpsertPayload,
  StockAdjustmentPayload,
} from '../../services/types';
import { useToast } from '../../hooks/useToast';
import { Pagination, usePagination } from '../../components/common/Pagination';

export const AdminIngredientsInventoryPage: React.FC = () => {
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('ACTIVE');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);

  // Detail Modal
  const [selectedIngredientId, setSelectedIngredientId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<IngredientStockDetailDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Adjust Stock Modal
  const [adjustTarget, setAdjustTarget] = useState<IngredientDto | null>(null);
  const [adjustQtyChange, setAdjustQtyChange] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [submittingAdjust, setSubmittingAdjust] = useState<boolean>(false);

  // Create Ingredient Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState<IngredientUpsertPayload>({
    code: '',
    name: '',
    unit: 'kg',
    minStockThreshold: 5,
    active: true,
  });
  const [submittingCreate, setSubmittingCreate] = useState<boolean>(false);

  const { showToast } = useToast();

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedIngredients,
    totalItems,
  } = usePagination(ingredients, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, activeFilter, lowStockOnly, setCurrentPage]);

  const loadIngredients = async () => {
    try {
      setLoading(true);
      const activeParam = activeFilter === 'ALL' ? undefined : activeFilter === 'ACTIVE';
      const data = await inventoryService.getInventoryIngredients({
        keyword: searchKeyword || undefined,
        active: activeParam,
        lowStockOnly,
      });
      setIngredients(data);
    } catch {
      showToast('Không thể tải danh sách nguyên liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIngredients();
  }, [searchKeyword, activeFilter, lowStockOnly]);

  const openDetail = async (id: number) => {
    try {
      setSelectedIngredientId(id);
      setLoadingDetail(true);
      const res = await inventoryService.getIngredientDetail(id);
      setDetailData(res);
    } catch {
      showToast('Không thể tải chi tiết nguyên liệu', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;

    const qty = parseFloat(adjustQtyChange);
    if (isNaN(qty) || qty === 0) {
      showToast('Số lượng điều chỉnh phải khác 0', 'error');
      return;
    }
    if (!adjustReason.trim()) {
      showToast('Lý do điều chỉnh là bắt buộc', 'error');
      return;
    }

    try {
      setSubmittingAdjust(true);
      const payload: StockAdjustmentPayload = {
        ingredientId: adjustTarget.id,
        quantityChange: qty,
        reason: adjustReason.trim(),
      };
      await inventoryService.adjustStock(payload);
      showToast('Điều chỉnh tồn kho thành công!', 'success');
      setAdjustTarget(null);
      setAdjustQtyChange('');
      setAdjustReason('');
      loadIngredients();
      if (selectedIngredientId === adjustTarget.id) {
        openDetail(adjustTarget.id);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Lỗi khi điều chỉnh tồn kho';
      showToast(msg, 'error');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      showToast('Vui lòng nhập tên nguyên liệu', 'error');
      return;
    }
    try {
      setSubmittingCreate(true);
      await catalogService.createIngredient(createForm);
      showToast('Thêm nguyên liệu thành công!', 'success');
      setShowCreateModal(false);
      setCreateForm({ code: '', name: '', unit: 'kg', minStockThreshold: 5, active: true });
      loadIngredients();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Lỗi khi thêm nguyên liệu';
      showToast(msg, 'error');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleDeleteIngredient = async (item: IngredientDto) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn nguyên liệu "${item.name}"?`)) {
      return;
    }
    try {
      await inventoryService.deleteIngredient(item.id);
      showToast('Đã xóa nguyên liệu thành công', 'success');
      if (selectedIngredientId === item.id) {
        setSelectedIngredientId(null);
        setDetailData(null);
      }
      loadIngredients();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể xóa nguyên liệu';
      showToast(msg, 'error');
    }
  };

  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
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

  const activeIngredientsCount = ingredients.filter((i) => i.active).length;
  const lowStockCount = ingredients.filter((i) => i.active && i.currentStock <= i.minStockThreshold).length;
  const safeStockCount = Math.max(0, activeIngredientsCount - lowStockCount);
  const totalStockValue = ingredients.reduce(
    (sum, i) => sum + (i.currentStock || 0) * (i.avgUnitCost || 0),
    0
  );

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
            <Boxes className="h-4 w-4" />
            <span>Kho nguyên liệu & tồn kho</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight mt-1">
            Quản lý nguyên liệu & tồn kho thực tế
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Theo dõi tồn kho, giá vốn bình quân di động, ngưỡng an toàn và kiểm kê điều chỉnh số dư.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-amber-700 hover:bg-amber-800 text-white transition-all shadow-xs cursor-pointer self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm nguyên liệu mới</span>
        </button>
      </div>

      {/* 4 Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-stone-500">
              Tổng mặt hàng kho
            </span>
            <p className="text-2xl font-bold text-stone-900">{ingredients.length}</p>
            <span className="text-[11px] text-stone-400">Nguyên liệu trong danh mục</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center border border-stone-200">
            <Boxes className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-emerald-700">
              Tồn kho an toàn
            </span>
            <p className="text-2xl font-bold text-emerald-700">{safeStockCount}</p>
            <span className="text-[11px] text-stone-400">Trên ngưỡng cảnh báo</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className={`rounded-2xl p-4.5 border shadow-xs flex items-center justify-between ${
          lowStockCount > 0 ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-stone-200/80'
        }`}>
          <div className="space-y-1">
            <span className={`text-xs font-medium ${
              lowStockCount > 0 ? 'text-rose-700' : 'text-stone-500'
            }`}>
              Cảnh báo tồn thấp
            </span>
            <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-rose-700' : 'text-stone-600'}`}>
              {lowStockCount}
            </p>
            <span className="text-[11px] text-stone-400">Cần lập phiếu nhập bổ sung</span>
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
            lowStockCount > 0 ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-stone-100 text-stone-500 border-stone-200'
          }`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-amber-800">
              Tổng giá trị kho
            </span>
            <p className="text-xl font-bold tabular-nums text-amber-800">{formatVnd(totalStockValue)}</p>
            <span className="text-[11px] text-stone-400">Theo giá vốn bình quân di động</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm theo tên nguyên liệu hoặc mã (VD: Bò, Tôm, ING-BUN-TUOI)..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => setSearchKeyword('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              title="Xóa tìm kiếm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active status filter */}
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-white font-medium text-stone-700 focus:outline-none focus:border-amber-600 shadow-xs"
          >
            <option value="ACTIVE">Đang sử dụng ({activeIngredientsCount})</option>
            <option value="ALL">Tất cả trạng thái ({ingredients.length})</option>
            <option value="INACTIVE">Tạm ngừng / Ẩn ({ingredients.length - activeIngredientsCount})</option>
          </select>

          {/* Low Stock toggle */}
          <button
            type="button"
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              lowStockOnly
                ? 'bg-rose-100 border-rose-300 text-rose-800 shadow-xs'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <AlertTriangle className={`h-3.5 w-3.5 ${lowStockOnly ? 'text-rose-700' : 'text-stone-400'}`} />
            <span>Chỉ xem tồn thấp {lowStockCount > 0 && `(${lowStockCount})`}</span>
          </button>

          <button
            type="button"
            onClick={loadIngredients}
            className="p-2.5 text-stone-500 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors border border-stone-200 shadow-xs"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Ingredients Table with Optimized Proportional Column Widths */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-semibold text-xs">
                <th className="py-3 px-4 w-28 whitespace-nowrap">Mã nguyên liệu</th>
                <th className="py-3 px-4 min-w-[280px]">Tên nguyên liệu</th>
                <th className="py-3 px-4 w-24 text-center whitespace-nowrap">Đơn vị</th>
                <th className="py-3 px-4 text-right w-40 whitespace-nowrap">Tồn kho hiện tại</th>
                <th className="py-3 px-4 text-right w-36 whitespace-nowrap">Ngưỡng tối thiểu</th>
                <th className="py-3 px-4 text-right w-44 whitespace-nowrap">Giá vốn bình quân</th>
                <th className="py-3 px-4 text-center w-32 whitespace-nowrap">Trạng thái</th>
                <th className="py-3 px-4 text-center w-36 whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && ingredients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-stone-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-600 mb-2" />
                    <span className="font-medium">Đang tải danh sách nguyên liệu...</span>
                  </td>
                </tr>
              ) : ingredients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-stone-400">
                    <Boxes className="h-8 w-8 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-600 text-sm">Không tìm thấy nguyên liệu nào phù hợp</p>
                    <p className="text-xs text-stone-400 mt-1">Thử thay đổi từ khóa hoặc bộ lọc trạng thái</p>
                  </td>
                </tr>
              ) : (
                paginatedIngredients.map((item) => {
                  const isLow = item.currentStock <= item.minStockThreshold;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-amber-50/40 transition-colors group ${
                        isLow && item.active ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 tabular-nums font-bold text-stone-800 whitespace-nowrap bg-stone-50/40">
                        {item.code}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-stone-900">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold group-hover:text-amber-800 transition-colors">
                            {item.name}
                          </span>
                          {isLow && item.active && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shrink-0"
                              title="Tồn kho thấp hơn hoặc bằng ngưỡng cảnh báo"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Tồn thấp
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-stone-100 font-medium text-stone-700 border border-stone-200/80">
                          {item.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-bold whitespace-nowrap">
                        <span
                          className={`text-sm ${
                            isLow && item.active ? 'text-rose-600 font-extrabold' : 'text-stone-900'
                          }`}
                        >
                          {item.currentStock}
                        </span>{' '}
                        <span className="text-[11px] text-stone-400 font-normal">{item.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-stone-600 whitespace-nowrap">
                        <span>{item.minStockThreshold}</span>{' '}
                        <span className="text-[11px] text-stone-400">{item.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-bold text-amber-900 whitespace-nowrap text-sm">
                        {formatVnd(item.avgUnitCost)}
                        <span className="text-[11px] text-stone-400 font-normal"> / {item.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            item.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border border-stone-200'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${item.active ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                          {item.active ? 'Đang dùng' : 'Tạm ẩn'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openDetail(item.id)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            title="Xem chi tiết & món ăn sử dụng"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustTarget(item);
                              setAdjustQtyChange('');
                              setAdjustReason('');
                            }}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            title="Điều chỉnh tồn kho thủ công"
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteIngredient(item)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Xóa nguyên liệu (nếu chưa dùng)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {ingredients.length > 0 && (
          <div className="p-4 border-t border-stone-100">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 20, 50]}
              itemLabel="nguyên liệu"
            />
          </div>
        )}
      </div>

      {/* Ingredient Detail & Recipe Usage Modal */}
      {selectedIngredientId &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in duration-150 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-amber-700" />
                <h3 className="text-base font-bold text-stone-900">Chi Tiết Nguyên Liệu & Lịch Sử</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedIngredientId(null);
                  setDetailData(null);
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetail || !detailData ? (
              <div className="py-12 text-center text-stone-400">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-600 mb-2" />
                <span>Đang tải chi tiết nguyên liệu...</span>
              </div>
            ) : (
              <div className="space-y-5 text-xs">
                {/* Basic Info Pill Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                  <div>
                    <span className="text-[11px] text-stone-400 block">Mã nguyên liệu</span>
                    <span className="tabular-nums font-bold text-stone-900">{detailData.ingredient.code}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-400 block">Tên nguyên liệu</span>
                    <span className="font-bold text-stone-900">{detailData.ingredient.name}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-400 block">Tồn hiện tại</span>
                    <span className="tabular-nums font-bold text-amber-700">
                      {detailData.ingredient.currentStock} {detailData.ingredient.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-400 block">Giá vốn bình quân</span>
                    <span className="tabular-nums font-bold text-stone-900">
                      {formatVnd(detailData.ingredient.avgUnitCost)}
                    </span>
                  </div>
                </div>

                {/* Delete Protection Alert */}
                {!detailData.canDelete && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span className="font-bold block">Khóa xóa vĩnh viễn (Ràng buộc toàn vẹn)</span>
                      <span>{detailData.deleteBlockReason}</span>
                    </div>
                  </div>
                )}

                {/* Used in Dishes */}
                <div>
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <UtensilsCrossed className="h-3.5 w-3.5 text-amber-600" />
                    <span>Món ăn đang dùng nguyên liệu này ({detailData.usedInDishes.length})</span>
                  </h4>
                  {detailData.usedInDishes.length > 0 ? (
                    <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                      {detailData.usedInDishes.map((dish) => (
                        <div key={dish.dishId} className="p-2.5 flex items-center justify-between hover:bg-stone-50">
                          <div>
                            <span className="tabular-nums text-stone-400 text-[11px] mr-2">{dish.dishCode}</span>
                            <span className="font-semibold text-stone-900">{dish.dishName}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="tabular-nums font-bold text-amber-800">{dish.quantityFormatted}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-stone-100 text-stone-600 border border-stone-200">
                              {dish.dishStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-stone-400 italic">Chưa có món ăn nào sử dụng nguyên liệu này</p>
                  )}
                </div>

                {/* Recent Movements */}
                <div>
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-amber-600" />
                    <span>Lịch sử biến động kho gần đây ({detailData.recentMovements.length})</span>
                  </h4>
                  {detailData.recentMovements.length > 0 ? (
                    <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100 max-h-48 overflow-y-auto">
                      {detailData.recentMovements.map((mov) => (
                        <div key={mov.id} className="p-2.5 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-bold text-stone-800 mr-2">[{mov.movementType}]</span>
                            <span className="tabular-nums text-stone-500 mr-2">{mov.referenceCode}</span>
                            <span className="text-stone-400">{formatDateTime(mov.createdAt)}</span>
                            {mov.note && <p className="text-stone-500 italic mt-0.5">{mov.note}</p>}
                          </div>
                          <div className="text-right">
                            <span
                              className={`tabular-nums font-bold ${
                                mov.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {mov.quantityChange > 0 ? `+${mov.quantityChange}` : mov.quantityChange}{' '}
                              {detailData.ingredient.unit}
                            </span>
                            <span className="block text-stone-400 text-[10px] tabular-nums">
                              Tồn sau: {mov.stockAfter} {detailData.ingredient.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-stone-400 italic">Chưa có lịch sử biến động</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Adjust Stock Modal */}
      {adjustTarget &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleAdjustSubmit}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in duration-150"
            >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-stone-900">Điều Chỉnh Tồn Kho Thủ Công</h3>
              </div>
              <button
                type="button"
                onClick={() => setAdjustTarget(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs space-y-1">
              <div>
                <span className="text-stone-400">Nguyên liệu: </span>
                <span className="font-bold text-stone-900">{adjustTarget.name}</span>{' '}
                <span className="tabular-nums text-stone-500 font-semibold">({adjustTarget.code})</span>
              </div>
              <div>
                <span className="text-stone-400">Tồn hiện tại: </span>
                <span className="font-bold text-amber-700 tabular-nums">
                  {adjustTarget.currentStock} {adjustTarget.unit}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Số lượng thay đổi (+ để tăng, - để giảm) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="VD: 5 hoặc -2.5"
                    value={adjustQtyChange}
                    onChange={(e) => setAdjustQtyChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 tabular-nums font-semibold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 font-medium">
                    {adjustTarget.unit}
                  </span>
                </div>
                {adjustQtyChange && !isNaN(parseFloat(adjustQtyChange)) && (
                  <p className="text-[11px] text-stone-500 mt-1">
                    Dự kiến tồn sau điều chỉnh:{' '}
                    <span
                      className={`tabular-nums font-bold ${
                        adjustTarget.currentStock + parseFloat(adjustQtyChange) < 0
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {(adjustTarget.currentStock + parseFloat(adjustQtyChange)).toFixed(3)} {adjustTarget.unit}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Lý do điều chỉnh kiểm kê <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="VD: Kiểm kê định kỳ phát hiện hao hụt, hư hỏng trong bảo quản, nhập bù thừa..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setAdjustTarget(null)}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-stone-600 hover:bg-stone-100"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submittingAdjust}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {submittingAdjust ? 'Đang lưu...' : 'Lưu Điều Chỉnh'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Create Ingredient Modal */}
      {showCreateModal &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleCreateSubmit}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in duration-150"
            >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-amber-700" />
                <h3 className="text-base font-bold text-stone-900">Thêm Nguyên Liệu Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Mã nguyên liệu (Để trống để hệ thống tự sinh mã)
                </label>
                <input
                  type="text"
                  placeholder="VD: ING-BO-UC (tùy chọn)"
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 tabular-nums font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Tên nguyên liệu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Bò Úc Thăn Ngoại Tươi"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Đơn vị tính <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={createForm.unit}
                    onChange={(e) => setCreateForm({ ...createForm, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 bg-white"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="g">g (Gram)</option>
                    <option value="lít">lít (Litre)</option>
                    <option value="ml">ml (Millilitre)</option>
                    <option value="cái">cái / con</option>
                    <option value="lon">lon / hộp</option>
                    <option value="gói">gói / túi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Ngưỡng tồn tối thiểu</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={createForm.minStockThreshold}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, minStockThreshold: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 tabular-nums font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-stone-600 hover:bg-stone-100"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submittingCreate}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-700 hover:bg-amber-800 text-white transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submittingCreate ? 'Đang tạo...' : 'Tạo Nguyên Liệu'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
};

