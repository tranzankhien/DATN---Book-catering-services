import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Scale,
  Utensils,
  Layers,
  CheckCircle2,
  ShieldCheck,
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

  // Mô phỏng tính định lượng nguyên liệu tiêu hao theo BR-02:
  // Lượng nguyên liệu i = số bàn × số phần/bàn × định lượng trong 01 phần
  const [portionsPerTable, setPortionsPerTable] = useState<number>(1);
  const [tableCount, setTableCount] = useState<number>(5);

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
      <div className="mx-auto max-w-5xl px-4 py-12">
        <LoadingState label="Đang tải chi tiết món ăn và công thức định lượng..." />
      </div>
    );
  }

  if (error || !dish) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-4">
        <Link
          to="/dishes"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700 hover:text-amber-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách món ăn
        </Link>
        <ErrorState message={error || 'Không tìm thấy món ăn'} onRetry={loadDishDetail} />
      </div>
    );
  }

  const totalPortions = Math.max(1, portionsPerTable) * Math.max(1, tableCount);
  const totalDishCost = Number(dish.price) * totalPortions;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/dishes"
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Danh sách món ăn</span>
        </Link>

        {user?.role === 'ROLE_ADMIN' && (
          <Link
            to="/admin/catalog"
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-semibold text-amber-400 hover:bg-stone-800 transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Chỉnh sửa món & công thức trong Admin</span>
          </Link>
        )}
      </div>

      {/* Dish Hero Card */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xs grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5 bg-stone-200 min-h-72 relative">
          {dish.imageUrl ? (
            <img
              src={dish.imageUrl}
              alt={dish.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-400">
              <Utensils className="h-14 w-14" />
            </div>
          )}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="rounded-lg bg-stone-900/85 backdrop-blur-xs px-3 py-1 text-xs font-semibold text-amber-300">
              {dish.categoryName}
            </span>
            <DishStatusBadge status={dish.status} />
          </div>
        </div>

        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-stone-500">
              <span className="rounded-md bg-stone-100 px-2.5 py-1 font-mono font-semibold text-stone-700">
                Mã món: {dish.code}
              </span>
              <span>Cập nhật: {formatDateTimeVn(dish.updatedAt)}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">{dish.name}</h1>

            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
              {dish.description || 'Món ăn phục vụ theo tiêu chuẩn bàn tiệc nhà hàng BanquetHub.'}
            </p>
          </div>

          <div className="rounded-2xl bg-amber-50/90 border border-amber-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                Đơn giá niêm yết (01 phần / đĩa)
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-700 mt-0.5">
                {formatVnd(dish.price)}
              </p>
            </div>
            <div className="text-xs text-amber-900 space-y-1">
              <p className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Định lượng chuẩn cho 01 phần phục vụ bàn tiệc</span>
              </p>
              <p className="flex items-center gap-1.5 font-medium">
                <Layers className="h-4 w-4 text-amber-700 shrink-0" />
                <span>Gồm {dish.recipeItems.length} thành phần nguyên liệu gốc</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Breakdown & BR-02 Ingredient Consumption Calculator */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shrink-0">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                Định lượng nguyên liệu cho 01 phần món & Ước tính tiêu hao (BR-02)
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Công thức: Lượng tiêu hao = Số bàn × Số phần/bàn × Định lượng 01 phần món
              </p>
            </div>
          </div>

          {/* Interactive controls for portionsPerTable & tableCount */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-stone-50 border border-stone-200 p-3">
            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="portionsInput" className="font-semibold text-stone-700">
                Số phần/bàn:
              </label>
              <input
                id="portionsInput"
                type="number"
                min={1}
                max={20}
                value={portionsPerTable}
                onChange={(e) => setPortionsPerTable(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 rounded-lg border border-stone-300 bg-white px-2 py-1 text-center font-bold text-stone-900"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="tablesInput" className="font-semibold text-stone-700">
                Số bàn tiệc:
              </label>
              <input
                id="tablesInput"
                type="number"
                min={1}
                max={200}
                value={tableCount}
                onChange={(e) => setTableCount(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 rounded-lg border border-stone-300 bg-white px-2 py-1 text-center font-bold text-stone-900"
              />
            </div>

            <div className="rounded-xl bg-stone-900 px-3 py-1.5 text-xs text-white">
              <span>Thành tiền ({totalPortions} phần): </span>
              <strong className="text-amber-400">{formatVnd(totalDishCost)}</strong>
            </div>
          </div>
        </div>

        {/* Recipe Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-xs font-bold uppercase tracking-wider text-stone-500">
                <th className="py-3 px-4">Mã NL</th>
                <th className="py-3 px-4">Tên nguyên liệu</th>
                <th className="py-3 px-4">Đơn vị gốc</th>
                <th className="py-3 px-4 text-right">Định lượng / 01 phần</th>
                <th className="py-3 px-4 text-right">
                  Tổng tiêu hao ({totalPortions} phần)
                </th>
                <th className="py-3 px-4">Ghi chú sơ chế</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {dish.recipeItems.map((item) => {
                const totalNeeded = Number(item.quantity) * totalPortions;
                return (
                  <tr key={item.id} className="hover:bg-stone-50/80">
                    <td className="py-3.5 px-4 font-mono text-xs text-stone-600">
                      {item.ingredientCode}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-stone-900">
                      {item.ingredientName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
                        {item.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-stone-900">
                      {formatQuantity(item.quantity)} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-amber-700">
                      {formatQuantity(totalNeeded)} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-stone-500">
                      {item.note || '—'}
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
