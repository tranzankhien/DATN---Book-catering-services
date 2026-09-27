import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import type { IngredientDto, MovementType, StockMovementDto } from '../../services/types';
import { useToast } from '../../hooks/useToast';

export const AdminStockMovementsPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovementDto[]>([]);
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('ALL');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');
  const [limit, setLimit] = useState<number>(50);

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
    try {
      setLoading(true);
      const list = await inventoryService.getStockMovements({
        ingredientId: selectedIngredientId !== 'ALL' ? Number(selectedIngredientId) : undefined,
        movementType: movementTypeFilter !== 'ALL' ? movementTypeFilter : undefined,
        limit,
      });
      setMovements(list);
    } catch {
      showToast('Không thể tải sổ biến động kho', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  useEffect(() => {
    loadMovements();
  }, [selectedIngredientId, movementTypeFilter, limit]);

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
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
            <History className="h-4 w-4" />
            <span>Sổ Kho & Kiểm Toán</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Sổ Biến Động Kho Nguyên Liệu
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Nhật ký lưu vết toàn bộ hoạt động Nhập kho (IMPORT), Xuất kho (EXPORT) và Điều chỉnh kiểm kê (ADJUSTMENT).
          </p>
        </div>

        <button
          type="button"
          onClick={loadMovements}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors shadow-sm cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          <span>Làm mới sổ</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Ingredient select */}
          <div className="flex items-center gap-2 min-w-[220px]">
            <span className="font-semibold text-stone-500">Nguyên liệu:</span>
            <select
              value={selectedIngredientId}
              onChange={(e) => setSelectedIngredientId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-stone-200 bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600 text-xs"
            >
              <option value="ALL">Tất cả nguyên liệu</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.code} - {ing.name}
                </option>
              ))}
            </select>
          </div>

          {/* Movement Type select */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-500">Loại biến động:</span>
            <select
              value={movementTypeFilter}
              onChange={(e) => setMovementTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600 text-xs"
            >
              <option value="ALL">Tất cả loại biến động</option>
              <option value="IMPORT">Nhập kho (IMPORT)</option>
              <option value="ADJUSTMENT">Điều chỉnh kiểm kê (ADJUSTMENT)</option>
              <option value="EXPORT">Xuất kho (EXPORT)</option>
            </select>
          </div>

          {/* Limit */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-500">Hiển thị:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-stone-200 bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600 text-xs font-mono"
            >
              <option value={30}>30 dòng</option>
              <option value={50}>50 dòng</option>
              <option value={100}>100 dòng</option>
              <option value={200}>200 dòng</option>
            </select>
          </div>
        </div>

        {(selectedIngredientId !== 'ALL' || movementTypeFilter !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSelectedIngredientId('ALL');
              setMovementTypeFilter('ALL');
            }}
            className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Thời Gian</th>
                <th className="py-3 px-4">Nguyên Liệu</th>
                <th className="py-3 px-4 text-center">Loại Biến Động</th>
                <th className="py-3 px-4 text-right">Lượng Thay Đổi</th>
                <th className="py-3 px-4 text-right">Tồn Trước → Sau</th>
                <th className="py-3 px-4 text-right">Giá Vốn Sau</th>
                <th className="py-3 px-4">Chứng Từ Tham Chiếu</th>
                <th className="py-3 px-4">Người Thực Hiện</th>
                <th className="py-3 px-4">Ghi Chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && movements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-600 mb-2" />
                    <span>Đang tải sổ biến động kho...</span>
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400">
                    Không tìm thấy bản ghi biến động kho nào
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const isPositive = m.quantityChange > 0;
                  return (
                    <tr key={m.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-stone-500 whitespace-nowrap">
                        {formatDateTime(m.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-stone-900 block">{m.ingredientName}</span>
                        <span className="font-mono text-[11px] text-stone-400">{m.ingredientCode}</span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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
                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span className={isPositive ? 'text-emerald-600 font-extrabold' : 'text-rose-600'}>
                          {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                        </span>{' '}
                        <span className="text-[11px] text-stone-400 font-normal">{m.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-stone-600 whitespace-nowrap">
                        <span>{m.stockBefore}</span>
                        <span className="text-stone-300 mx-1">→</span>
                        <span className="font-bold text-stone-900">{m.stockAfter}</span>{' '}
                        <span className="text-stone-400">{m.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-amber-800 whitespace-nowrap">
                        {formatVnd(m.avgCostAfter)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
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
                      <td className="py-3 px-4 text-stone-600 whitespace-nowrap">
                        {m.performedByName || 'Hệ thống'}
                      </td>
                      <td className="py-3 px-4 text-stone-500 italic max-w-xs truncate text-[11px]">
                        {m.note || '—'}
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
