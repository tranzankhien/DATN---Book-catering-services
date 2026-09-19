import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Scale,
  Utensils,
  Layers,
  CheckCircle2,
  ShieldCheck,
  ChefHat,
  Users,
  Sparkles,
  Info,
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

  // BR-02 Simulation: Lượng tiêu hao = Số bàn × Số phần/bàn × Định lượng 01 phần
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
          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300"
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
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Breadcrumb & Admin shortcut */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/dishes"
          className="inline-flex items-center gap-2 rounded-2xl border border-stone-800 bg-stone-900/80 px-4 py-2.5 text-xs font-bold text-stone-300 hover:text-white hover:border-amber-500/40 transition-all"
        >
          <ArrowLeft className="h-4 w-4 text-amber-400" />
          <span>Quay Lại Thực Đơn Món Tiệc</span>
        </Link>

        {user?.role === 'ROLE_ADMIN' && (
          <Link
            to="/admin/catalog"
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Mở Trang Quản Trị Công Thức (Admin)</span>
          </Link>
        )}
      </div>

      {/* Main Luxury Presentation Card */}
      <div className="overflow-hidden rounded-3xl border border-stone-800/80 bg-stone-900/50 shadow-2xl backdrop-blur-md grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Image with golden elements */}
        <div className="lg:col-span-5 bg-stone-900 min-h-80 relative overflow-hidden">
          {dish.imageUrl ? (
            <img
              src={dish.imageUrl}
              alt={dish.name}
              className="h-full w-full object-cover brightness-95"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-600">
              <Utensils className="h-16 w-16" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-black/30" />

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="rounded-xl bg-stone-950/85 backdrop-blur-md px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
              {dish.categoryName}
            </span>
            <DishStatusBadge status={dish.status} />
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-stone-300 bg-stone-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-stone-800">
            <span className="font-mono font-bold text-amber-400">Mã: {dish.code}</span>
            <span>Cập nhật: {formatDateTimeVn(dish.updatedAt)}</span>
          </div>
        </div>

        {/* Right: Dish Specs & Story */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Món Tiệc Cao Cấp Nhà Hàng BanquetHub</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black font-serif-luxury text-white">
              {dish.name}
            </h1>

            <p className="text-sm text-stone-300 leading-relaxed">
              {dish.description ||
                'Món ăn chế biến theo quy chuẩn ẩm thực tiệc cưới và yến tiệc truyền thống Việt Nam.'}
            </p>
          </div>

          {/* Pricing Highlight Box */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-stone-900 to-stone-950 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 gold-border-glow">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                Đơn Giá Niêm Yết / 01 Phần Món
              </span>
              <p className="text-3xl font-black text-amber-400 font-serif-luxury mt-1">
                {formatVnd(dish.price)}
              </p>
            </div>

            <div className="text-xs text-stone-300 space-y-1.5 border-t sm:border-t-0 sm:border-l border-stone-800 pt-3 sm:pt-0 sm:pl-5">
              <p className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Quy chuẩn 01 phần phục vụ 01 bàn (10 khách)</span>
              </p>
              <p className="flex items-center gap-2 font-medium">
                <Layers className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Gồm {dish.recipeItems.length} thành phần nguyên liệu định mức</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Ingredient Consumption Breakdown (BR-02) */}
      <div className="rounded-3xl border border-stone-800/80 bg-stone-900/50 p-6 sm:p-10 shadow-2xl backdrop-blur-md space-y-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-800 pb-6">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-serif-luxury text-white">
                Bảng Định Lượng Công Thức & Ước Tính Tiêu Hao (Quy Tắc BR-02)
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Công thức: <code className="text-amber-300">Tiêu hao = Số bàn × Số phần/bàn × Định lượng 01 phần</code>
              </p>
            </div>
          </div>

          {/* Interactive Steppers */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-800 bg-stone-950/80 p-3">
            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="portionStepp" className="font-bold text-stone-300">
                Phần/bàn:
              </label>
              <input
                id="portionStepp"
                type="number"
                min={1}
                max={20}
                value={portionsPerTable}
                onChange={(e) => setPortionsPerTable(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 rounded-xl border border-stone-800 bg-stone-900 px-2 py-1 text-center font-bold text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="tablesStepp" className="font-bold text-stone-300">
                Số bàn tiệc:
              </label>
              <input
                id="tablesStepp"
                type="number"
                min={1}
                max={100}
                value={tableCount}
                onChange={(e) => setTableCount(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 rounded-xl border border-stone-800 bg-stone-900 px-2 py-1 text-center font-bold text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-xs text-amber-300">
              <span>Thành tiền ({totalPortions} phần): </span>
              <strong className="font-bold text-white font-mono">{formatVnd(totalDishCost)}</strong>
            </div>
          </div>
        </div>

        {/* Recipe Table */}
        <div className="overflow-x-auto rounded-2xl border border-stone-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-950/70 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <th className="py-4 px-4">Mã Nguyên Liệu</th>
                <th className="py-4 px-4">Tên Nguyên Liệu</th>
                <th className="py-4 px-4">Đơn Vị Chuẩn</th>
                <th className="py-4 px-4 text-right">Định Lượng / 01 Phần</th>
                <th className="py-4 px-4 text-right">
                  Tổng Tiêu Hao ({totalPortions} Phần)
                </th>
                <th className="py-4 px-4">Ghi Chú Chế Biến</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80 text-xs sm:text-sm bg-stone-900/30">
              {dish.recipeItems.map((item) => {
                const totalNeeded = Number(item.quantity) * totalPortions;
                return (
                  <tr key={item.id} className="hover:bg-stone-800/40 transition-colors">
                    <td className="py-4 px-4 font-mono text-xs text-stone-400">
                      {item.ingredientCode}
                    </td>
                    <td className="py-4 px-4 font-bold text-white">
                      {item.ingredientName}
                    </td>
                    <td className="py-4 px-4">
                      <span className="rounded-lg bg-stone-800 px-2 py-0.5 text-xs font-semibold text-stone-300">
                        {item.unit}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-stone-200">
                      {formatQuantity(item.quantity)} {item.unit}
                    </td>
                    <td className="py-4 px-4 text-right font-black text-amber-400 font-mono">
                      {formatQuantity(totalNeeded)} {item.unit}
                    </td>
                    <td className="py-4 px-4 text-xs text-stone-400">
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
