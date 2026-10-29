import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Scale,
  Utensils,
  Layers,
  CheckCircle2,
  Sparkles,
  Users,
  Clock,
  Compass,
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/dishes"
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-colors shadow-xs"
        >
          <ArrowLeft className="h-4 w-4 text-stone-500" />
          <span>Quay lại thực đơn món tiệc</span>
        </Link>

        <span className="text-xs text-stone-500">
          Danh mục: <strong className="text-stone-800 font-semibold">{dish.categoryName}</strong>
        </span>
      </div>

      {/* Main Luxury Presentation Card (Full width 7xl) */}
      <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-xs grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left: Fixed Dimension Culinary Showcase - Khung ảnh cố định chuẩn mực, chống vỡ layout */}
        <div className="lg:col-span-5 xl:col-span-5 relative h-[320px] sm:h-[380px] lg:h-[420px] w-full bg-stone-100 overflow-hidden shrink-0 border-b lg:border-b-0 lg:border-r border-stone-200/70">
          <img
            src={dish.imageUrl || DEFAULT_DISH_IMAGE}
            alt={dish.name}
            onError={handleImageError}
            className="h-full w-full object-cover object-center block transition-transform duration-500 hover:scale-102"
          />
        </div>

        {/* Right: Dish Specs & Story */}
        <div className="lg:col-span-7 xl:col-span-7 p-6 sm:p-8 lg:p-9 flex flex-col justify-between space-y-6">
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-0.5">
                {dish.categoryName}
              </span>
              <DishStatusBadge status={dish.status} />
              <span className="text-stone-400">
                • Cập nhật {formatDateTimeVn(dish.updatedAt)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight leading-tight">
              {dish.name}
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl font-normal">
              {dish.description ||
                'Món ăn chế biến theo quy chuẩn ẩm thực tiệc cưới và yến tiệc truyền thống Việt Nam, đảm bảo hương vị tinh túy và nguyên liệu tươi ngon nhất.'}
            </p>

            {/* Quick Specs Strip */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs text-stone-500">
              <div className="flex items-center gap-1.5 font-medium text-stone-700">
                <Users className="h-4 w-4 text-amber-700" />
                <span>Tiêu chuẩn: 01 bàn / 10 khách</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-stone-700">
                <Layers className="h-4 w-4 text-amber-700" />
                <span>{dish.recipeItems.length} loại nguyên liệu</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-stone-700">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>Chế biến nóng tươi mới</span>
              </div>
            </div>
          </div>

          {/* Pricing & Serving Standard Box */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="shrink-0">
              <span className="text-xs font-medium text-stone-500 whitespace-nowrap block">
                Đơn giá niêm yết / 01 phần món
              </span>
              <p className="text-2xl sm:text-3xl font-bold text-amber-900 tracking-tight mt-0.5 tabular-nums">
                {formatVnd(dish.price)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleAddToMenuBuilder}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Utensils className="h-4 w-4" />
                <span>Đưa vào bàn tiệc tự phối</span>
              </button>

              <a
                href="#recipe-section"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-2xs transition-colors"
              >
                <Scale className="h-4 w-4 text-stone-500" />
                <span>Xem định lượng tiêu hao ↓</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Ingredient Consumption Breakdown (No technical codes!) */}
      <div id="recipe-section" className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                Bảng định lượng công thức & ước tính tiêu hao nguyên liệu
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Tổng lượng tiêu hao = Số bàn × Số phần/bàn × Định lượng 01 phần
              </p>
            </div>
          </div>

          {/* Interactive Steppers */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-2.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-stone-700">Phần/bàn:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPortionsPerTable((p) => Math.max(1, p - 1))}
                  className="h-7 w-7 rounded-md border border-stone-300 bg-white hover:bg-stone-100 font-bold text-stone-700 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
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
                  className="w-12 rounded-md border border-stone-300 bg-white py-1 text-center font-bold text-sm text-stone-800 focus:outline-none focus:border-amber-600 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setPortionsPerTable((p) => p + 1)}
                  className="h-7 w-7 rounded-md border border-stone-300 bg-white hover:bg-stone-100 font-bold text-stone-700 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-stone-700 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-amber-700" />
                <span>Số bàn:</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTableCount((t) => Math.max(1, t - 1))}
                  className="h-7 w-7 rounded-md border border-stone-300 bg-white hover:bg-stone-100 font-bold text-stone-700 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
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
                  className="w-14 rounded-md border border-stone-300 bg-white py-1 text-center font-bold text-sm text-stone-800 focus:outline-none focus:border-amber-600 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setTableCount((t) => t + 1)}
                  className="h-7 w-7 rounded-md border border-stone-300 bg-white hover:bg-stone-100 font-bold text-stone-700 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                >
                  +
                </button>
              </div>
              <span className="text-[11px] text-stone-500 font-medium">(~{estimatedGuests} khách)</span>
            </div>

            <div className="rounded-lg bg-amber-100/70 border border-amber-200 px-3 py-1.5 text-xs text-amber-900 font-medium">
              <span>Thành tiền ({totalPortions} phần): </span>
              <strong className="font-bold text-amber-900 tabular-nums text-sm">{formatVnd(totalDishCost)}</strong>
            </div>
          </div>
        </div>

        {/* Clean Recipe Table (NO TECHNICAL CODES!) */}
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-stone-600">
                <th className="py-3 px-5">Nguyên liệu món ăn</th>
                <th className="py-3 px-5">Đơn vị chuẩn</th>
                <th className="py-3 px-5 text-right">Định lượng / 01 phần</th>
                <th className="py-3 px-5 text-right">
                  Tổng tiêu hao cho bàn tiệc ({totalPortions} phần)
                </th>
                <th className="py-3 px-5">Ghi chú chế biến</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs sm:text-sm bg-white">
              {dish.recipeItems.map((item) => {
                const totalNeeded = Number(item.quantity) * totalPortions;
                return (
                  <tr key={item.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3 px-5 font-semibold text-stone-900">
                      {item.ingredientName}
                    </td>
                    <td className="py-3 px-5">
                      <span className="rounded-lg bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700 border border-stone-200/60">
                        {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right font-medium text-stone-700 tabular-nums">
                      {formatQuantity(item.quantity)} {item.unit}
                    </td>
                    <td className="py-3 px-5 text-right font-semibold text-amber-700 tabular-nums">
                      {formatQuantity(totalNeeded)} {item.unit}
                    </td>
                    <td className="py-3 px-5 text-xs text-stone-500">
                      {item.note || 'Theo tiêu chuẩn đầu bếp trưởng'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
