import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Boxes,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import type { IngredientDto, MovementType, StockMovementDto } from '../../services/types';
import { useToast } from '../../hooks/useToast';

export const AdminStockMovementsPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovementDto[]>([]);
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Pagination
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('ALL');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Chống race-condition khi đổi bộ lọc nhanh: chỉ chấp nhận phản hồi của request mới nhất
  const latestRequestIdRef = useRef<number>(0);

  const { showToast } = useToast();

  const loadIngredients = async () => {
    try {
      const list = await inventoryService.getInventoryIngredients();
      setIngredients(list);
    } catch {
      // ignore
    }
  };

  const loadMovements = async () => {
    const requestId = ++latestRequestIdRef.current;
    try {
      setLoading(true);
      const fromTimeIso = fromDate ? `${fromDate}T00:00:00+07:00` : undefined;

      // Tính mốc 00:00:00 của ngày kế tiếp (exclusive boundary) để không bao giờ bỏ sót microsecond cuối ngày
      let toTimeIso: string | undefined = undefined;
      if (toDate) {
        const d = new Date(`${toDate}T00:00:00`);
        d.setDate(d.getDate() + 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        toTimeIso = `${yyyy}-${mm}-${dd}T00:00:00+07:00`;
      }

      const paged = await inventoryService.getStockMovementsPaged({
        ingredientId: selectedIngredientId !== 'ALL' ? Number(selectedIngredientId) : undefined,
        movementType: movementTypeFilter !== 'ALL' ? movementTypeFilter : undefined,
        fromTime: fromTimeIso,
        toTime: toTimeIso,
        page,
        size: pageSize,
      });

      if (requestId !== latestRequestIdRef.current) {
        // Phản hồi cũ đã lỗi thời, bỏ qua để tránh ghi đè
        return;
      }

      setMovements(paged.items);
      setTotalPages(paged.totalPages);
      setTotalCount(paged.totalCount);
    } catch {
      if (requestId === latestRequestIdRef.current) {
        showToast('Không thể tải sổ biến động kho', 'error');
      }
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadIngredients();
  }, []);

  useEffect(() => {
    void loadMovements();
  }, [selectedIngredientId, movementTypeFilter, fromDate, toDate, page, pageSize]);

  const handleFilterChange = (setter: () => void) => {
    setter();
    setPage(0);
  };

  const clearAllFilters = () => {
    setSelectedIngredientId('ALL');
    setMovementTypeFilter('ALL');
    setFromDate('');
    setToDate('');
    setPage(0);
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

  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
            <History className="h-4 w-4" />
            <span>Sổ kho & kiểm toán</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight mt-1">
            Sổ biến động kho nguyên liệu
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Nhật ký lưu vết toàn bộ hoạt động nhập kho, xuất kho và điều chỉnh kiểm kê theo thời gian thực.
          </p>
        </div>

        <button
          type="button"
          onClick={loadMovements}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors shadow-xs cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          <span>Làm mới sổ</span>
        </button>
      </div>

      {/* Filter Bar with Horizontal Layout */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Ingredient select */}
          <div className="flex items-center gap-2 min-w-[240px] flex-1">
            <span className="font-bold text-stone-600 shrink-0">Nguyên liệu:</span>
            <select
              value={selectedIngredientId}
              onChange={(e) => handleFilterChange(() => setSelectedIngredientId(e.target.value))}
              className="flex-1 px-3 py-2 rounded-xl border border-stone-200 bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600 text-xs shadow-xs"
            >
              <option value="ALL">Tất cả nguyên liệu ({ingredients.length})</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.code} - {ing.name}
                </option>
              ))}
            </select>
          </div>

          {/* Movement Type select */}
          <div className="flex items-center gap-2 min-w-[200px]">
            <span className="font-bold text-stone-600 shrink-0">Loại:</span>
            <select
              value={movementTypeFilter}
              onChange={(e) => handleFilterChange(() => setMovementTypeFilter(e.target.value))}
              className="px-3 py-2 rounded-xl border border-stone-200 bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600 text-xs shadow-xs"
            >
              <option value="ALL">Tất cả loại biến động</option>
              <option value="IMPORT">Nhập kho (IMPORT)</option>
              <option value="ADJUSTMENT">Điều chỉnh kiểm kê (ADJUSTMENT)</option>
              <option value="EXPORT">Xuất kho (EXPORT)</option>
            </select>
          </div>

          {/* Date range filters */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-600 shrink-0">Từ ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => handleFilterChange(() => setFromDate(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-xs focus:outline-none focus:border-amber-600 font-mono shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-600 shrink-0">Đến ngày:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => handleFilterChange(() => setToDate(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-xs focus:outline-none focus:border-amber-600 font-mono shadow-xs"
            />
          </div>

          {/* Page size */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-600 shrink-0">Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="px-3 py-2 rounded-xl border border-stone-200 bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600 text-xs font-mono shadow-xs"
            >
              <option value={20}>20 dòng</option>
              <option value={50}>50 dòng</option>
              <option value={100}>100 dòng</option>
            </select>
          </div>

          {(selectedIngredientId !== 'ALL' || movementTypeFilter !== 'ALL' || fromDate !== '' || toDate !== '') && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer ml-auto"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Movements Table with Optimized Proportional Column Widths */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-semibold text-xs">
                <th className="py-3 px-4 w-36 whitespace-nowrap">Thời gian</th>
                <th className="py-3 px-4 min-w-[260px]">Nguyên liệu</th>
                <th className="py-3 px-4 text-center w-32 whitespace-nowrap">Loại biến động</th>
                <th className="py-3 px-4 text-right w-36 whitespace-nowrap">Lượng thay đổi</th>
                <th className="py-3 px-4 text-right w-40 whitespace-nowrap">Tồn trước → sau</th>
                <th className="py-3 px-4 text-right w-36 whitespace-nowrap">Giá vốn sau</th>
                <th className="py-3 px-4 w-36 whitespace-nowrap">Chứng từ tham chiếu</th>
                <th className="py-3 px-4 w-32 whitespace-nowrap">Người thực hiện</th>
                <th className="py-3 px-4 min-w-[200px]">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && movements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-stone-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-600 mb-2" />
                    <span className="font-medium">Đang tải sổ biến động kho...</span>
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-stone-400">
                    <History className="h-8 w-8 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-600 text-sm">Không tìm thấy bản ghi biến động kho nào</p>
                    <p className="text-xs text-stone-400 mt-1">Thử thay đổi nguyên liệu hoặc khoảng thời gian tra cứu</p>
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const isPositive = m.quantityChange > 0;
                  return (
                    <tr key={m.id} className="hover:bg-amber-50/30 transition-colors group">
                      <td className="py-3.5 px-4 font-mono text-stone-600 whitespace-nowrap bg-stone-50/40">
                        {formatDateTime(m.createdAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-stone-900 block text-sm group-hover:text-amber-800 transition-colors">
                          {m.ingredientName}
                        </span>
                        <span className="font-mono text-[11px] text-stone-400 font-semibold">{m.ingredientCode}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
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
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span className={`text-sm ${isPositive ? 'text-emerald-600 font-extrabold' : 'text-rose-600'}`}>
                          {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                        </span>{' '}
                        <span className="text-[11px] text-stone-400 font-normal">{m.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[11px] text-stone-600 whitespace-nowrap">
                        <span>{m.stockBefore}</span>
                        <span className="text-stone-300 mx-1">→</span>
                        <span className="font-bold text-stone-900">{m.stockAfter}</span>{' '}
                        <span className="text-stone-400">{m.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-900 whitespace-nowrap">
                        {formatVnd(m.avgCostAfter)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {m.referenceType === 'STOCK_RECEIPT' && m.referenceId ? (
                          <Link
                            to={`/admin/inventory/receipts/${m.referenceId}`}
                            className="font-mono text-amber-700 hover:underline font-bold"
                          >
                            {m.referenceCode}
                          </Link>
                        ) : (
                          <span className="font-mono text-stone-700 font-medium">{m.referenceCode}</span>
                        )}
                        <span className="text-[10px] text-stone-400 block font-mono">
                          {m.referenceType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-stone-700">
                        {m.performedByName || 'Hệ thống'}
                      </td>
                      <td className="py-3.5 px-4 text-stone-500 text-xs">
                        {m.note ? (
                          <span className="line-clamp-2" title={m.note}>{m.note}</span>
                        ) : (
                          <span className="text-stone-300 italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Database-Level Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-stone-50/70 border-t border-stone-200 text-xs text-stone-600">
          <div>
            <span>
              Tổng số <strong className="font-mono text-stone-900">{totalCount}</strong> bản ghi biến động kho
              {totalPages > 1 && ` (Trang ${page + 1} / ${totalPages})`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 0 || loading}
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-white font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Trang trước</span>
            </button>

            <span className="px-2 font-mono font-bold text-stone-800 text-xs">
              {page + 1} / {Math.max(totalPages, 1)}
            </span>

            <button
              type="button"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => setPage((prev) => prev + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-white font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
            >
              <span>Trang sau</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

