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
          ? `Đã ẩn món "${dish.name}" khỏi danh mục công khai.`
          : `Đã hiển thị lại món "${dish.name}".`,
        'success'
      );
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể cập nhật trạng thái món.'), 'error');
    }
  };

  const stats = useMemo(() => {
    const activeCount = dishes.filter((d) => d.status === 'ACTIVE').length;
    const hiddenCount = dishes.filter((d) => d.status === 'HIDDEN').length;
    return {
      totalDishes: dishes.length,
      activeCount,
      hiddenCount,
      totalIngredients: ingredients.length,
    };
  }, [dishes, ingredients]);

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500">Tổng số món ăn</span>
          <p className="mt-1 text-2xl font-extrabold text-stone-900">{stats.totalDishes}</p>
          <span className="text-[11px] text-stone-500">Trên {categories.length} danh mục món</span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500">Món đang phục vụ</span>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700">{stats.activeCount}</p>
          <span className="text-[11px] text-stone-500">Hiển thị công khai cho khách</span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500">Món đang tạm ẩn</span>
          <p className="mt-1 text-2xl font-extrabold text-stone-600">{stats.hiddenCount}</p>
          <span className="text-[11px] text-stone-500">Giữ nguyên lịch sử đơn cũ</span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500">Danh mục nguyên liệu</span>
          <p className="mt-1 text-2xl font-extrabold text-amber-700">{stats.totalIngredients}</p>
          <span className="text-[11px] text-stone-500">Chuẩn hóa theo đơn vị gốc</span>
        </div>
      </div>

      {/* Tabs & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('dishes')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'dishes'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Utensils className="h-4 w-4" />
            <span>Danh mục Món ăn & Công thức ({dishes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ingredients')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'ingredients'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Nguyên liệu gốc ({ingredients.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadAdminData()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Làm mới</span>
          </button>

          {activeTab === 'dishes' ? (
            <button
              type="button"
              onClick={() => {
                setEditingDish(null);
                setDishModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm món ăn mới</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingIngredient(null);
                setIngredientModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm nguyên liệu</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'dishes' ? (
        <>
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="sm:col-span-5 relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo mã món, tên món, mô tả..."
                className="w-full rounded-xl border border-stone-300 pl-10 pr-3.5 py-2 text-xs text-stone-900 focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={selectedCategoryId ?? ''}
                onChange={(e) =>
                  setSelectedCategoryId(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 focus:border-amber-600 focus:outline-none"
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
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 focus:border-amber-600 focus:outline-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang phục vụ (ACTIVE)</option>
                <option value="HIDDEN">Đang ẩn (HIDDEN)</option>
              </select>
            </div>
          </div>

          {/* Dishes Table */}
          {loading ? (
            <LoadingState label="Đang tải danh sách món ăn và công thức định lượng..." />
          ) : error ? (
            <ErrorState message={error} onRetry={loadAdminData} />
          ) : dishes.length === 0 ? (
            <EmptyState
              title="Không có món ăn nào khớp với bộ lọc"
              description="Bạn có thể thêm món ăn mới hoặc xóa bộ lọc tìm kiếm."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      <th className="py-3.5 px-4">Món ăn</th>
                      <th className="py-3.5 px-4">Danh mục</th>
                      <th className="py-3.5 px-4 text-right">Đơn giá / 01 phần</th>
                      <th className="py-3.5 px-4">Công thức định lượng (01 phần)</th>
                      <th className="py-3.5 px-4">Trạng thái</th>
                      <th className="py-3.5 px-4 text-right">Thao tác quản trị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs">
                    {dishes.map((dish) => (
                      <tr key={dish.id} className="hover:bg-stone-50/70 align-top">
                        <td className="py-4 px-4">
                          <div className="flex items-start gap-3">
                            <div className="h-12 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-200">
                              {dish.imageUrl ? (
                                <img
                                  src={dish.imageUrl}
                                  alt={dish.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-stone-400">
                                  <Utensils className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-mono text-[11px] text-stone-500">
                                {dish.code}
                              </span>
                              <p className="font-bold text-stone-900 text-sm">{dish.name}</p>
                              <p className="text-stone-500 line-clamp-1 max-w-xs mt-0.5">
                                {dish.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-block rounded-lg bg-stone-100 px-2.5 py-1 font-semibold text-stone-700">
                            {dish.categoryName}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right font-extrabold text-amber-700 text-sm whitespace-nowrap">
                          {formatVnd(dish.price)}
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {dish.recipeItems.map((item) => (
                              <span
                                key={item.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/70 px-2 py-0.5 text-[11px] font-medium text-amber-950"
                              >
                                <span>{item.ingredientName}:</span>
                                <strong>
                                  {formatQuantity(item.quantity)} {item.unit}
                                </strong>
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <DishStatusBadge status={dish.status} />
                        </td>

                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setRecipeModalDish(dish)}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 font-bold text-amber-900 hover:bg-amber-100 cursor-pointer"
                              title="Cấu hình công thức định lượng nguyên liệu"
                            >
                              <Scale className="h-3.5 w-3.5" />
                              <span>Định lượng</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingDish(dish);
                                setDishModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                              title="Chỉnh sửa món ăn"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Sửa</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleToggleStatus(dish)}
                              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 font-semibold cursor-pointer ${
                                dish.status === 'ACTIVE'
                                  ? 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
                                  : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                              }`}
                              title={
                                dish.status === 'ACTIVE'
                                  ? 'Ẩn món ăn khỏi danh mục công khai'
                                  : 'Hiển thị lại món ăn'
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
        /* Ingredients Table */
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3.5 px-4">Mã NL</th>
                  <th className="py-3.5 px-4">Tên nguyên liệu</th>
                  <th className="py-3.5 px-4">Đơn vị gốc</th>
                  <th className="py-3.5 px-4 text-right">Ngưỡng tồn tối thiểu</th>
                  <th className="py-3.5 px-4 text-right">Tồn vật lý hiện tại</th>
                  <th className="py-3.5 px-4 text-right">Đơn giá vốn BQ</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {ingredients.map((ing) => (
                  <tr key={ing.id} className="hover:bg-stone-50/70">
                    <td className="py-3.5 px-4 font-mono font-semibold text-stone-600">
                      {ing.code}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900">{ing.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-md bg-stone-100 px-2 py-0.5 font-semibold text-stone-700">
                        {ing.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-stone-700">
                      {formatQuantity(ing.minStockThreshold)} {ing.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                      {formatQuantity(ing.currentStock)} {ing.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-stone-800">
                      {formatVnd(ing.avgUnitCost)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIngredient(ing);
                          setIngredientModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
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
