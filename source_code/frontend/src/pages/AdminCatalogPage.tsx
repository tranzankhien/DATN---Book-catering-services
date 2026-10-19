import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  CheckCircle2,
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
import { DEFAULT_DISH_IMAGE, handleImageError } from '../lib/imageConstants';

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

  const latestRequestIdRef = useRef<number>(0);

  const loadAdminData = useCallback(async () => {
    const requestId = ++latestRequestIdRef.current;
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
      if (requestId !== latestRequestIdRef.current) {
        return;
      }
      setCategories(catList);
      setIngredients(ingList);
      setDishes(dishList);
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
  }, [selectedCategoryId, selectedStatus, keyword]);

  useEffect(() => {
    void loadAdminData();
    return () => {
      latestRequestIdRef.current += 1;
    };
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
    <div className="space-y-6">
      {/* 4 Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-stone-500">
              Tổng số món tiệc
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-stone-900">{stats.totalDishes}</p>
            <span className="text-xs text-amber-700 font-medium">Trên {categories.length} danh mục</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <Utensils className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-stone-500">
              Món đang phục vụ
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{stats.activeCount}</p>
            <span className="text-xs text-stone-500">Hiển thị cho khách đặt</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-stone-500">
              Món đang tạm ẩn
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-stone-600">{stats.hiddenCount}</p>
            <span className="text-xs text-stone-500">Giữ nguyên lịch sử đơn</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-500 border border-stone-200">
            <EyeOff className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-stone-500">
              Nguyên liệu kho gốc
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-amber-700">
              {stats.totalIngredients}
            </p>
            <span className="text-xs text-stone-500">Chuẩn hóa theo kg, lít...</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <Package className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabs & Master Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-1.5 bg-stone-200/60 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('dishes')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'dishes'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Utensils className="h-4 w-4" />
            <span>Món ăn & công thức ({dishes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ingredients')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ingredients'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer shadow-xs"
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm nguyên liệu</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'dishes' ? (
        <>
          {/* Dishes Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-xl border border-stone-200 bg-white p-3.5 shadow-xs">
            <div className="sm:col-span-6 relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo tên món, mã món, mô tả..."
                className="w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedCategoryId ?? ''}
                onChange={(e) =>
                  setSelectedCategoryId(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-800 focus:border-amber-600 focus:outline-none cursor-pointer"
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
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-800 focus:border-amber-600 focus:outline-none cursor-pointer"
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
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50/80 text-left text-xs font-semibold text-stone-600">
                      <th className="py-3 px-4 min-w-[280px]">Món ăn</th>
                      <th className="py-3 px-4 w-36 whitespace-nowrap">Danh mục</th>
                      <th className="py-3 px-4 text-right w-44 whitespace-nowrap">Đơn giá / 01 phần</th>
                      <th className="py-3 px-4 min-w-[320px]">Công thức định lượng (01 phần)</th>
                      <th className="py-3 px-4 w-32 text-center whitespace-nowrap">Trạng thái</th>
                      <th className="py-3 px-4 text-right w-40 whitespace-nowrap">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs">
                    {dishes.map((dish) => (
                      <tr key={dish.id} className="hover:bg-stone-50/70 transition-colors align-top">
                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100 border border-stone-200">
                              <img
                                src={dish.imageUrl || DEFAULT_DISH_IMAGE}
                                alt={dish.name}
                                onError={handleImageError}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <span className="font-mono text-[10px] text-stone-500 font-semibold">
                                {dish.code}
                              </span>
                              <p className="font-bold text-stone-900 text-xs sm:text-sm">{dish.name}</p>
                              <p className="text-stone-500 line-clamp-1 max-w-xs mt-0.5 text-[11px]">
                                {dish.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block rounded bg-stone-100 px-2 py-0.5 font-medium text-stone-700 text-[11px]">
                            {dish.categoryName}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-amber-700 text-xs sm:text-sm whitespace-nowrap">
                          {formatVnd(dish.price)}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {dish.recipeItems.map((item) => (
                              <span
                                key={item.id}
                                className="inline-flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-700"
                              >
                                <span>{item.ingredientName}:</span>
                                <strong className="text-stone-900">
                                  {formatQuantity(item.quantity)} {item.unit}
                                </strong>
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <DishStatusBadge status={dish.status} />
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setRecipeModalDish(dish)}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                              title="Cấu hình công thức định lượng nguyên liệu"
                            >
                              <Scale className="h-3.5 w-3.5 text-amber-700" />
                              <span>Định lượng</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingDish(dish);
                                setDishModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer shadow-xs"
                              title="Chỉnh sửa thông tin món ăn"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Sửa</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleToggleStatus(dish)}
                              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                                dish.status === 'ACTIVE'
                                  ? 'border-stone-300 bg-white text-stone-600 hover:bg-stone-50'
                                  : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                              }`}
                              title={
                                dish.status === 'ACTIVE'
                                  ? 'Ẩn món khỏi danh mục'
                                  : 'Hiển thị lại món'
                              }
                            >
                              {dish.status === 'ACTIVE' ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5 text-stone-500" />
                                  <span>Ẩn</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
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
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold text-stone-600">
                  <th className="py-3 px-4 w-32 whitespace-nowrap">Mã nguyên liệu</th>
                  <th className="py-3 px-4 min-w-[280px]">Tên nguyên liệu</th>
                  <th className="py-3 px-4 w-24 text-center whitespace-nowrap">Đơn vị</th>
                  <th className="py-3 px-4 text-right w-36 whitespace-nowrap">Ngưỡng tối thiểu</th>
                  <th className="py-3 px-4 text-right w-40 whitespace-nowrap">Tồn kho hiện tại</th>
                  <th className="py-3 px-4 text-right w-44 whitespace-nowrap">Giá vốn bình quân</th>
                  <th className="py-3 px-4 text-right w-32 whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {ingredients.map((ing) => (
                  <tr key={ing.id} className="hover:bg-amber-50/20 transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-800 whitespace-nowrap bg-stone-50/40">
                      {ing.code}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900 group-hover:text-amber-800 transition-colors text-sm">
                      {ing.name}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-block rounded-md bg-stone-100 px-2.5 py-0.5 font-medium text-stone-700 border border-stone-200/80">
                        {ing.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-stone-600 font-mono whitespace-nowrap">
                      {formatQuantity(ing.minStockThreshold)} <span className="text-[11px] text-stone-400 font-normal">{ing.unit}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap text-sm">
                      {formatQuantity(ing.currentStock)} <span className="text-[11px] text-stone-400 font-normal">{ing.unit}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-900 whitespace-nowrap text-sm">
                      {formatVnd(ing.avgUnitCost)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIngredient(ing);
                          setIngredientModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer shadow-xs"
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
