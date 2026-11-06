import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Scale,
  Utensils,
  Layers,
  Users,
  Calculator,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { extractErrorMessage } from '../services/apiClient';
import type { DishDetailDto } from '../services/types';
import { formatDateTimeVn, formatQuantity, formatVnd } from '../hooks/useFormatters';
import { DishStatusBadge, ErrorState, LoadingState } from '../components/StatusStates';
import { DEFAULT_DISH_IMAGE, handleImageError } from '../lib/imageConstants';

export const DishDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dish, setDish] = useState<DishDetailDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tính lượng tiêu hao = Số bàn × Số phần/bàn × Định lượng 01 phần
  const [portionsPerTable, setPortionsPerTable] = useState<number>(1);
  const [tableCount, setTableCount] = useState<number>(6);

  const handleAddToMenuBuilder = () => {
    if (!dish) return;
    try {
      const STORAGE_KEY = 'banquethub_builder_draft';
      const existing = sessionStorage.getItem(STORAGE_KEY);
      let items: { dishId: number; quantityPerTable: number }[] = [];
      let savedTables = tableCount;
      if (existing) {
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed.items)) items = parsed.items;
        if (parsed.tableCount) savedTables = parsed.tableCount;
      }
      const found = items.find((it) => it.dishId === dish.id);
      if (found) {
        found.quantityPerTable += portionsPerTable;
      } else {
        items.push({ dishId: dish.id, quantityPerTable: portionsPerTable });
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ items, tableCount: savedTables }));
    } catch {
      // ignore
    }
    navigate('/menu-builder');
  };

  const latestRequestIdRef = useRef<number>(0);

  const loadDishDetail = useCallback(async () => {
    const requestId = ++latestRequestIdRef.current;
    if (!id || Number.isNaN(Number(id))) {
      setError('Mã món ăn không hợp lệ');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await catalogService.getPublicDishDetail(Number(id));
      if (requestId !== latestRequestIdRef.current) {
        return;
      }
      setDish(data);
    } catch (err) {
      if (requestId !== latestRequestIdRef.current) {
        return;
      }
      setError(extractErrorMessage(err));
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    void loadDishDetail();
    return () => {
      latestRequestIdRef.current += 1;
    };
  }, [loadDishDetail]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <LoadingState label="Đang tải chi tiết món ăn và bảng định lượng công thức..." />
      </div>
    );
  }

  if (error || !dish) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 space-y-4">
        <Link
          to="/dishes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách món ăn</span>
        </Link>
        <ErrorState message={error || 'Không tìm thấy món ăn'} onRetry={loadDishDetail} />
      </div>
    );
  }

  const totalPortions = Math.max(1, portionsPerTable) * Math.max(1, tableCount);
  const totalDishCost = Number(dish.price) * totalPortions;
  const estimatedGuests = tableCount * 10;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up-1">
      {/* Top Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 font-medium">
        <Link to="/" className="hover:text-stone-900 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link to="/dishes" className="hover:text-stone-900 transition-colors">
          Thực đơn món tiệc
        </Link>
        <span>/</span>
        <span className="text-stone-400">{dish.categoryName}</span>
        <span>/</span>
        <span className="font-semibold text-stone-900 truncate max-w-xs">{dish.name}</span>
      </nav>

      {/* Main Showcase Card - Balanced Proportions & Full Width Utilization */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 lg:p-8 shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left: Culinary Showcase Image (Refined, Not Oversized) */}
          <div className="lg:col-span-5 xl:col-span-4 relative h-64 sm:h-72 lg:h-[280px] w-full rounded-2xl overflow-hidden shadow-xs border border-stone-200/80 bg-stone-100 group">
            <img
              src={dish.imageUrl || DEFAULT_DISH_IMAGE}
              alt={dish.name}
              onError={handleImageError}
              className="h-full w-full object-cover object-center block transition-transform duration-500 group-hover:scale-102"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/20 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Right: Dish Information & Actions */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold text-stone-500 tabular-nums">
                {dish.code}
              </span>
              <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                {dish.categoryName}
              </span>
              <DishStatusBadge status={dish.status} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight leading-tight">
              {dish.name}
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
              {dish.description ||
                'Món ăn chế biến theo quy chuẩn ẩm thực yến tiệc truyền thống Việt Nam, hương vị thanh tao và nguyên liệu tươi mới.'}
            </p>

            {/* Clean Specifications Row */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-700">
                <Users className="h-3.5 w-3.5 text-amber-700" />
                <span>Tiêu chuẩn bàn: <strong>10 khách</strong></span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-700">
                <Layers className="h-3.5 w-3.5 text-amber-700" />
                <span>Công thức: <strong className="tabular-nums">{dish.recipeItems.length} nguyên liệu</strong></span>
              </div>
            </div>

            {/* Price & Primary Actions Bar */}
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-stone-100">
              <div>
                <span className="text-xs text-stone-500 font-medium block">Đơn giá niêm yết (01 phần / bàn 10 khách)</span>
                <p className="text-2xl sm:text-3xl font-bold text-amber-900 tracking-tight mt-0.5 tabular-nums">
                  {formatVnd(dish.price)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToMenuBuilder}
                  className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Utensils className="h-4 w-4" />
                  <span>Đưa vào bàn tiệc tự phối</span>
                </button>

                <a
                  href="#recipe-section"
                  className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-2xs transition-colors"
                >
                  <Scale className="h-4 w-4 text-stone-500" />
                  <span>Bảng định lượng tiêu hao ↓</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balanced 2-Column Section: Left Recipe Table (8 Cols) + Right Interactive Estimator (4 Cols) */}
      <div id="recipe-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Recipe & Ingredient Consumption Breakdown */}
        <div className="lg:col-span-8 rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-start gap-3 border-b border-stone-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                Bảng định lượng công thức & ước tính tiêu hao nguyên liệu
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Tổng lượng tiêu hao = Số bàn ({tableCount} bàn) × Số phần/bàn ({portionsPerTable} phần) × Định lượng 01 phần
              </p>
            </div>
          </div>

          {/* Clean Recipe Table */}
          <div className="overflow-x-auto rounded-xl border border-stone-200/80">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Nguyên liệu</th>
                  <th className="py-3 px-4">Đơn vị</th>
                  <th className="py-3 px-4 text-right">Định lượng / 01 phần</th>
                  <th className="py-3 px-4 text-right">Tiêu hao ({totalPortions} phần)</th>
                  <th className="py-3 px-4">Ghi chú chuẩn bị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {dish.recipeItems.map((item) => {
                  const totalNeeded = Number(item.quantity) * totalPortions;
                  return (
                    <tr key={item.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-4 font-semibold text-stone-900">
                        {item.ingredientName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700 border border-stone-200/60">
                          {item.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-stone-700 tabular-nums">
                        {formatQuantity(item.quantity)} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-800 tabular-nums">
                        {formatQuantity(totalNeeded)} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-stone-500">
                        {item.note || 'Theo tiêu chuẩn đầu bếp trưởng'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-2 text-xs text-stone-500 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Định lượng được chuẩn hóa bởi Bếp trưởng, tự động đồng bộ khi xuất kho chuẩn bị tiệc.</span>
          </div>
        </div>

        {/* Right Column: Interactive Banquet Estimator & Quick Action */}
        <div className="lg:col-span-4 rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/80 shrink-0">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900 tracking-tight">
                Dự toán theo quy mô tiệc
              </h3>
              <p className="text-[11px] text-stone-500">
                Mô phỏng tiêu hao và chi phí món ăn
              </p>
            </div>
          </div>

          {/* Stepper Controls */}
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200/80 bg-stone-50/60">
              <span className="font-medium text-stone-700">Số phần mỗi bàn:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPortionsPerTable((p) => Math.max(1, p - 1))}
                  className="h-7 w-7 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 font-bold text-stone-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs text-xs"
                >
                  -
                </button>
                <input
                  id="portionStepp"
                  type="number"
                  min={1}
                  max={20}
                  value={portionsPerTable}
                  onChange={(e) => setPortionsPerTable(Math.max(1, Number(e.target.value) || 1))}
                  className="w-10 rounded-lg border border-stone-200 bg-white py-1 text-center font-bold text-xs text-stone-800 focus:outline-none focus:border-amber-600 shadow-2xs tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => setPortionsPerTable((p) => p + 1)}
                  className="h-7 w-7 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 font-bold text-stone-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs text-xs"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200/80 bg-stone-50/60">
              <div>
                <span className="font-medium text-stone-700 block">Số lượng bàn tiệc:</span>
                <span className="text-[10px] text-stone-400 tabular-nums">(~{estimatedGuests} khách tham dự)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTableCount((t) => Math.max(1, t - 1))}
                  className="h-7 w-7 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 font-bold text-stone-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs text-xs"
                >
                  -
                </button>
                <input
                  id="tablesStepp"
                  type="number"
                  min={1}
                  max={100}
                  value={tableCount}
                  onChange={(e) => setTableCount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-12 rounded-lg border border-stone-200 bg-white py-1 text-center font-bold text-xs text-stone-800 focus:outline-none focus:border-amber-600 shadow-2xs tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => setTableCount((t) => t + 1)}
                  className="h-7 w-7 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 font-bold text-stone-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs text-xs"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Cost Summary Box */}
          <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/70 space-y-2">
            <div className="flex justify-between items-center text-xs text-stone-600">
              <span>Tổng số phần phục vụ:</span>
              <strong className="font-bold text-stone-900 tabular-nums">
                {totalPortions} phần
              </strong>
            </div>
            <div className="flex justify-between items-center text-xs text-stone-600">
              <span>Đơn giá niêm yết:</span>
              <span className="tabular-nums font-medium text-stone-800">
                {formatVnd(dish.price)} / phần
              </span>
            </div>
            <div className="pt-2 border-t border-amber-200 flex justify-between items-baseline">
              <span className="text-xs font-semibold text-amber-900">Tổng chi phí món:</span>
              <span className="text-xl font-bold text-amber-950 tabular-nums">
                {formatVnd(totalDishCost)}
              </span>
            </div>
          </div>

          {/* Quick CTA */}
          <button
            type="button"
            onClick={handleAddToMenuBuilder}
            className="w-full inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Utensils className="h-4 w-4" />
            <span>Đưa {totalPortions} phần vào bàn tiệc tự phối</span>
          </button>

          {/* Banquet Commitments */}
          <div className="space-y-1.5 text-[11px] text-stone-500 pt-2 border-t border-stone-100">
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Khóa giá niêm yết, không phụ thu phát sinh</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Phục vụ đồng loạt nóng sốt đúng giờ tiệc</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
