import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Scale,
  Edit3,
  Eye,
  EyeOff,
  Utensils,
  Package,
  RefreshCw,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { extractErrorMessage } from '../services/apiClient';
import type {
  CategoryDto,
  DishDetailDto,
  DishStatus,
  IngredientDto,
} from '../services/types';
import { formatQuantity, formatVnd } from '../hooks/useFormatters';
import { DishStatusBadge, EmptyState, ErrorState, LoadingState } from '../components/StatusStates';
import { useToast } from '../hooks/useToast';
import { DishFormModal } from '../features/admin/DishFormModal';
import { RecipeConfigModal } from '../features/admin/RecipeConfigModal';
import { IngredientFormModal } from '../features/admin/IngredientFormModal';

export const AdminCatalogPage: React.FC = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'dishes' | 'ingredients'>('dishes');
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [dishes, setDishes] = useState<DishDetailDto[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<DishStatus | ''>('');
  const [keyword, setKeyword] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [dishModalOpen, setDishModalOpen] = useState<boolean>(false);
  const [editingDish, setEditingDish] = useState<DishDetailDto | null>(null);
  const [recipeModalDish, setRecipeModalDish] = useState<DishDetailDto | null>(null);
  const [ingredientModalOpen, setIngredientModalOpen] = useState<boolean>(false);
  const [editingIngredient, setEditingIngredient] = useState<IngredientDto | null>(null);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catList, ingList, dishList] = await Promise.all([
        catalogService.getAdminCategories(),
        catalogService.getAdminIngredients(),
        catalogService.getAdminDishes({
          categoryId: selectedCategoryId,
          status: selectedStatus || undefined,
          keyword: keyword.trim() || undefined,
        }),
      ]);
      setCategories(catList);
      setIngredients(ingList);
      setDishes(dishList);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, selectedStatus, keyword]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  const handleToggleStatus = async (dish: DishDetailDto) => {
    const nextStatus: DishStatus = dish.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE';
    try {
      const updated = await catalogService.updateDishStatus(dish.id, nextStatus);
      setDishes((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      showToast(
        nextStatus === 'HIDDEN'
          ? `Đã chuyển món "${dish.name}" sang trạng thái ẩn.`
          : `Đã kích hoạt hiển thị món "${dish.name}".`,
        'success'
      );
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể cập nhật trạng thái món.'), 'error');
    }
  };

  const stats = useMemo(() => {
    const activeCount = dishes.filter((d) => d.status === 'ACTIVE').length;
    const hiddenCount = dishes.filter((d) => d.status === 'HIDDEN').length;
    const lowStockCount = ingredients.filter((i) => i.lowStock).length;
    return {
      totalDishes: dishes.length,
      activeCount,
      hiddenCount,
      totalIngredients: ingredients.length,
      lowStockCount,
    };
  }, [dishes, ingredients]);

  return (
    <div className="space-y-8">
      {/* 4 Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-3xl border border-stone-800 bg-stone-900/60 p-6 backdrop-blur-md shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Tổng số món tiệc
            </span>
            <p className="text-3xl font-black font-serif-luxury text-white">{stats.totalDishes}</p>
            <span className="text-[11px] text-amber-400">Trên {categories.length} danh mục</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Utensils className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-stone-800 bg-stone-900/60 p-6 backdrop-blur-md shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Món đang phục vụ
            </span>
            <p className="text-3xl font-black font-serif-luxury text-emerald-400">{stats.activeCount}</p>
            <span className="text-[11px] text-stone-400">Hiển thị cho khách đặt tiệc</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-stone-800 bg-stone-900/60 p-6 backdrop-blur-md shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Món đang tạm ẩn
            </span>
            <p className="text-3xl font-black font-serif-luxury text-stone-400">{stats.hiddenCount}</p>
            <span className="text-[11px] text-stone-400">Giữ nguyên lịch sử đơn cũ</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-800/80 text-stone-400 border border-stone-700/50">
            <EyeOff className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-stone-800 bg-stone-900/60 p-6 backdrop-blur-md shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Nguyên liệu kho gốc
            </span>
            <p className="text-3xl font-black font-serif-luxury text-amber-400">
              {stats.totalIngredients}
            </p>
            <span className="text-[11px] text-stone-400">Chuẩn hóa theo kg, lít...</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Package className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tabs & Master Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div className="flex items-center gap-2 bg-stone-900/80 p-1.5 rounded-2xl border border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab('dishes')}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer ${
              activeTab === 'dishes'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
            }`}
          >
            <Utensils className="h-4 w-4" />
            <span>Món Ăn & Công Thức ({dishes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ingredients')}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer ${
              activeTab === 'ingredients'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Nguyên Liệu Gốc ({ingredients.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadAdminData()}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-stone-800 bg-stone-900/80 px-4 py-2.5 text-xs font-bold text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Làm Mới</span>
          </button>

          {activeTab === 'dishes' ? (
            <button
              type="button"
              onClick={() => {
                setEditingDish(null);
                setDishModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 px-5 py-2.5 text-xs font-black text-stone-950 shadow-lg shadow-amber-500/20 hover:scale-102 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Món Ăn Mới</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingIngredient(null);
                setIngredientModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 px-5 py-2.5 text-xs font-black text-stone-950 shadow-lg shadow-amber-500/20 hover:scale-102 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Nguyên Liệu</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'dishes' ? (
        <>
          {/* Dishes Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 rounded-3xl border border-stone-800 bg-stone-900/60 p-4">
            <div className="sm:col-span-6 relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo tên món, mã món, mô tả..."
                className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 pl-11 pr-4 py-2.5 text-xs text-white placeholder:text-stone-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedCategoryId ?? ''}
                onChange={(e) =>
                  setSelectedCategoryId(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-4 py-2.5 text-xs font-bold text-stone-200 focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value="">Tất cả danh mục món</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as DishStatus | '')}
                className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-4 py-2.5 text-xs font-bold text-stone-200 focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang phục vụ (ACTIVE)</option>
                <option value="HIDDEN">Đang ẩn (HIDDEN)</option>
              </select>
            </div>
          </div>

          {/* Dishes Master Table */}
          {loading ? (
            <LoadingState label="Đang tải danh sách món ăn & công thức định lượng..." />
          ) : error ? (
            <ErrorState message={error} onRetry={loadAdminData} />
          ) : dishes.length === 0 ? (
            <EmptyState
              title="Không có món ăn nào phù hợp bộ lọc"
              description="Bạn có thể tạo món ăn mới hoặc xóa từ khóa tìm kiếm."
            />
          ) : (
            <div className="overflow-hidden rounded-3xl border border-stone-800 bg-stone-900/60 shadow-2xl backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-800 bg-stone-950/80 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      <th className="py-4 px-5">Món Ăn</th>
                      <th className="py-4 px-5">Danh Mục</th>
                      <th className="py-4 px-5 text-right">Đơn Giá / 01 Phần</th>
                      <th className="py-4 px-5">Công Thức Định Lượng (01 Phần)</th>
                      <th className="py-4 px-5">Trạng Thái</th>
                      <th className="py-4 px-5 text-right">Thao Tác Quản Trị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/80 text-xs">
                    {dishes.map((dish) => (
                      <tr key={dish.id} className="hover:bg-stone-850/60 transition-colors align-top">
                        <td className="py-4 px-5">
                          <div className="flex items-start gap-3.5">
                            <div className="h-12 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-900 border border-stone-800">
                              {dish.imageUrl ? (
                                <img
                                  src={dish.imageUrl}
                                  alt={dish.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-stone-600">
                                  <Utensils className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-mono text-[10px] text-amber-400">
                                {dish.code}
                              </span>
                              <p className="font-bold text-white text-sm">{dish.name}</p>
                              <p className="text-stone-400 line-clamp-1 max-w-xs mt-0.5 text-[11px]">
                                {dish.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <span className="inline-block rounded-xl bg-stone-800/80 border border-stone-700/60 px-3 py-1 font-bold text-stone-300 text-[11px]">
                            {dish.categoryName}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right font-black text-amber-400 text-sm whitespace-nowrap font-serif-luxury">
                          {formatVnd(dish.price)}
                        </td>

                        <td className="py-4 px-5">
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {dish.recipeItems.map((item) => (
                              <span
                                key={item.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300"
                              >
                                <span>{item.ingredientName}:</span>
                                <strong>
                                  {formatQuantity(item.quantity)} {item.unit}
                                </strong>
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-4 px-5 whitespace-nowrap">
                          <DishStatusBadge status={dish.status} />
                        </td>

                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setRecipeModalDish(dish)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition-all cursor-pointer"
                              title="Cấu hình công thức định lượng nguyên liệu"
                            >
                              <Scale className="h-3.5 w-3.5" />
                              <span>Định Lượng</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingDish(dish);
                                setDishModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-xl border border-stone-800 bg-stone-800/80 px-3 py-1.5 text-xs font-bold text-stone-200 hover:bg-stone-700 transition-colors cursor-pointer"
                              title="Chỉnh sửa thông tin món ăn"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Sửa</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleToggleStatus(dish)}
                              className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                dish.status === 'ACTIVE'
                                  ? 'border-stone-800 bg-stone-900 text-stone-400 hover:text-white'
                                  : 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                              }`}
                              title={
                                dish.status === 'ACTIVE'
                                  ? 'Ẩn món khỏi danh mục'
                                  : 'Hiển thị lại món'
                              }
                            >
                              {dish.status === 'ACTIVE' ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5" />
                                  <span>Ẩn</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Hiện</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Ingredients Master Table */
        <div className="overflow-hidden rounded-3xl border border-stone-800 bg-stone-900/60 shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-800 bg-stone-950/80 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  <th className="py-4 px-5">Mã Nguyên Liệu</th>
                  <th className="py-4 px-5">Tên Nguyên Liệu</th>
                  <th className="py-4 px-5">Đơn Vị Gốc</th>
                  <th className="py-4 px-5 text-right">Ngưỡng Tồn Tối Thiểu</th>
                  <th className="py-4 px-5 text-right">Tồn Vật Lý Hiện Tại</th>
                  <th className="py-4 px-5 text-right">Đơn Giá Vốn Bình Quân</th>
                  <th className="py-4 px-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80 text-xs">
                {ingredients.map((ing) => (
                  <tr key={ing.id} className="hover:bg-stone-850/60 transition-colors">
                    <td className="py-4 px-5 font-mono font-bold text-amber-400">
                      {ing.code}
                    </td>
                    <td className="py-4 px-5 font-bold text-white">{ing.name}</td>
                    <td className="py-4 px-5">
                      <span className="rounded-lg bg-stone-800 px-2 py-0.5 font-bold text-stone-300">
                        {ing.unit}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right font-semibold text-stone-300">
                      {formatQuantity(ing.minStockThreshold)} {ing.unit}
                    </td>
                    <td className="py-4 px-5 text-right font-black text-emerald-400 font-mono">
                      {formatQuantity(ing.currentStock)} {ing.unit}
                    </td>
                    <td className="py-4 px-5 text-right font-bold text-stone-200">
                      {formatVnd(ing.avgUnitCost)}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIngredient(ing);
                          setIngredientModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-stone-800 bg-stone-800/80 px-3 py-1.5 text-xs font-bold text-stone-300 hover:text-white hover:bg-stone-700 transition-colors cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Sửa</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {dishModalOpen && (
        <DishFormModal
          initialDish={editingDish}
          categories={categories}
          ingredients={ingredients}
          onClose={() => {
            setDishModalOpen(false);
            setEditingDish(null);
          }}
          onSaved={() => {
            setDishModalOpen(false);
            setEditingDish(null);
            void loadAdminData();
          }}
        />
      )}

      {recipeModalDish && (
        <RecipeConfigModal
          dish={recipeModalDish}
          ingredients={ingredients}
          onClose={() => setRecipeModalDish(null)}
          onSaved={(updatedDish) => {
            setDishes((prev) => prev.map((d) => (d.id === updatedDish.id ? updatedDish : d)));
            setRecipeModalDish(null);
          }}
        />
      )}

      {ingredientModalOpen && (
        <IngredientFormModal
          initialIngredient={editingIngredient}
          onClose={() => {
            setIngredientModalOpen(false);
            setEditingIngredient(null);
          }}
          onSaved={() => {
            setIngredientModalOpen(false);
            setEditingIngredient(null);
            void loadAdminData();
          }}
        />
      )}
    </div>
  );
};
