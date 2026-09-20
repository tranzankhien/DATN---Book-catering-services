import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Scale,
  Utensils,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { extractErrorMessage } from '../services/apiClient';
import type { DishDetailDto } from '../services/types';
import { formatDateTimeVn, formatQuantity, formatVnd } from '../hooks/useFormatters';
import { DishStatusBadge, ErrorState, LoadingState } from '../components/StatusStates';
import { useAuth } from '../hooks/useAuth';

export const DishDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [dish, setDish] = useState<DishDetailDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tính lượng tiêu hao = Số bàn × Số phần/bàn × Định lượng 01 phần
  const [portionsPerTable, setPortionsPerTable] = useState<number>(1);
  const [tableCount, setTableCount] = useState<number>(6);

  const loadDishDetail = useCallback(async () => {
    if (!id || Number.isNaN(Number(id))) {
      setError('Mã món ăn không hợp lệ');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await catalogService.getPublicDishDetail(Number(id));
      setDish(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadDishDetail();
  }, [loadDishDetail]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <LoadingState label="Đang tải chi tiết món ăn và bảng định lượng công thức..." />
      </div>
    );
  }

  if (error || !dish) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 space-y-4">
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

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Admin shortcut */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/dishes"
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-400 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 text-stone-500" />
          <span>Quay Lại Thực Đơn Món Tiệc</span>
        </Link>

        {user?.role === 'ROLE_ADMIN' && (
          <Link
            to="/admin/catalog"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors shadow-sm"
          >
            <ShieldCheck className="h-4 w-4 text-amber-700" />
            <span>Cấu Hình Công Thức Món Ăn</span>
          </Link>
        )}
      </div>

      {/* Main Luxury Presentation Card */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Image */}
        <div className="lg:col-span-5 bg-stone-100 min-h-72 relative overflow-hidden">
          {dish.imageUrl ? (
            <img
              src={dish.imageUrl}
              alt={dish.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-400">
              <Utensils className="h-16 w-16" />
            </div>
          )}

          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="rounded-lg bg-white/95 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-stone-800 border border-stone-200 shadow-sm">
              {dish.categoryName}
            </span>
            <DishStatusBadge status={dish.status} />
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-stone-600 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm">
            <span className="font-mono font-semibold text-stone-800">Mã: {dish.code}</span>
            <span>Cập nhật: {formatDateTimeVn(dish.updatedAt)}</span>
          </div>
        </div>

        {/* Right: Dish Specs & Story */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Món Tiệc Nhà Hàng BanquetHub</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {dish.name}
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {dish.description ||
                'Món ăn chế biến theo quy chuẩn ẩm thực tiệc cưới và yến tiệc truyền thống Việt Nam.'}
            </p>
          </div>

          {/* Pricing Highlight Box */}
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Đơn Giá Niêm Yết / 01 Phần Món
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-700 tracking-tight mt-0.5">
                {formatVnd(dish.price)}
              </p>
            </div>

            <div className="text-xs text-stone-600 space-y-1 sm:border-l sm:border-stone-200 sm:pl-5">
              <p className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Quy chuẩn 01 phần phục vụ 10 khách</span>
              </p>
              <p className="flex items-center gap-1.5 font-medium">
                <Layers className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Gồm {dish.recipeItems.length} nguyên liệu định mức</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Ingredient Consumption Breakdown */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                Bảng Định Lượng Công Thức & Ước Tính Tiêu Hao Nguyên Liệu
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Công thức: <code className="text-stone-700 font-mono font-semibold">Tiêu hao = Số bàn × Số phần/bàn × Định lượng 01 phần</code>
              </p>
            </div>
          </div>

          {/* Interactive Steppers */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-2.5">
            <div className="flex items-center gap-1.5 text-xs">
              <label htmlFor="portionStepp" className="font-semibold text-stone-700">
                Phần/bàn:
              </label>
              <input
                id="portionStepp"
                type="number"
                min={1}
                max={20}
                value={portionsPerTable}
                onChange={(e) => setPortionsPerTable(Math.max(1, Number(e.target.value) || 1))}
                className="w-14 rounded-lg border border-stone-300 bg-white px-2 py-1 text-center font-bold text-stone-800 focus:outline-none focus:border-amber-600 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <label htmlFor="tablesStepp" className="font-semibold text-stone-700">
                Số bàn tiệc:
              </label>
              <input
                id="tablesStepp"
                type="number"
                min={1}
                max={100}
                value={tableCount}
                onChange={(e) => setTableCount(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 rounded-lg border border-stone-300 bg-white px-2 py-1 text-center font-bold text-stone-800 focus:outline-none focus:border-amber-600 shadow-sm"
              />
            </div>

            <div className="rounded-lg bg-amber-100/70 border border-amber-200 px-3 py-1 text-xs text-amber-900 font-medium">
              <span>Thành tiền ({totalPortions} phần): </span>
              <strong className="font-bold text-amber-800 font-mono">{formatVnd(totalDishCost)}</strong>
            </div>
          </div>
        </div>

        {/* Recipe Table */}
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                <th className="py-3 px-4">Mã Nguyên Liệu</th>
                <th className="py-3 px-4">Tên Nguyên Liệu</th>
                <th className="py-3 px-4">Đơn Vị</th>
                <th className="py-3 px-4 text-right">Định Lượng / 01 Phần</th>
                <th className="py-3 px-4 text-right">
                  Tổng Tiêu Hao ({totalPortions} Phần)
                </th>
                <th className="py-3 px-4">Ghi Chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs sm:text-sm bg-white">
              {dish.recipeItems.map((item) => {
                const totalNeeded = Number(item.quantity) * totalPortions;
                return (
                  <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-stone-500">
                      {item.ingredientCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-900">
                      {item.ingredientName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
                        {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-stone-700">
                      {formatQuantity(item.quantity)} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-700 font-mono">
                      {formatQuantity(totalNeeded)} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-xs text-stone-500">
                      {item.note || 'Theo công thức bếp trưởng'}
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
