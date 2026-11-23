import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Utensils,
  Search,
  Plus,
  Minus,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  X,
  ShieldCheck,
  ChefHat,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { menuService } from '../services/menuService';
import { orderService } from '../services/orderService';
import type {
  CategoryDto,
  DishSummaryDto,
  OrderPreviewResponseDto,
  CreateOrderItemPayload,
} from '../services/types';
import { formatVnd } from '../hooks/useFormatters';
import { LoadingState, ErrorState } from '../components/StatusStates';
import { extractErrorMessage } from '../services/apiClient';
import { DEFAULT_DISH_IMAGE, handleImageError } from '../lib/imageConstants';

interface SelectedDishItem {
  dish: DishSummaryDto;
  quantityPerTable: number;
}

const STORAGE_KEY = 'banquethub_builder_draft';

export const MenuBuilderPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const menuIdParam = searchParams.get('menuId');

  // Catalog State
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [dishes, setDishes] = useState<DishSummaryDto[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [keyword, setKeyword] = useState<string>('');
  const [catalogLoading, setCatalogLoading] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Builder State
  const [selectedItems, setSelectedItems] = useState<SelectedDishItem[]>([]);
  const [tableCount, setTableCount] = useState<number>(6);
  const [guestCount, setGuestCount] = useState<number>(60);
  const [isRestored, setIsRestored] = useState<boolean>(false);

  // Preview State
  const [preview, setPreview] = useState<OrderPreviewResponseDto | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const loadSeqRef = useRef<number>(0);

  // Fetch catalog & template or draft
  const loadCatalogAndDraft = async () => {
    const seq = ++loadSeqRef.current;
    try {
      setCatalogLoading(true);
      setCatalogError(null);
      const [cats, dishList] = await Promise.all([
        catalogService.getPublicCategories(),
        catalogService.getPublicDishes(),
      ]);
      if (loadSeqRef.current !== seq) return;
      setCategories(cats);
      setDishes(dishList);

      if (menuIdParam) {
        // Load template menu
        try {
          const menu = await menuService.getMenuById(Number(menuIdParam));
          if (loadSeqRef.current !== seq) return;
          if (menu && menu.items) {
            const loadedItems: SelectedDishItem[] = [];
            for (const it of menu.items) {
              const matchedDish = dishList.find((d) => d.id === it.dishId);
              if (matchedDish) {
                loadedItems.push({
                  dish: matchedDish,
                  quantityPerTable: it.quantityPerTable || 1,
                });
              }
            }
            if (loadedItems.length > 0) {
              setSelectedItems(loadedItems);
              setCatalogLoading(false);
              setIsRestored(true);
              return;
            }
          }
          throw new Error('Thực đơn mẫu không có món ăn khả dụng hoặc đã ngừng phục vụ.');
        } catch (e) {
          console.error('Failed to load menu template', e);
          if (loadSeqRef.current === seq) {
            setCatalogError(`Không thể tải thực đơn mẫu (ID: ${menuIdParam}): ${extractErrorMessage(e)}`);
            setCatalogLoading(false);
          }
          return;
        }
      }

      if (loadSeqRef.current !== seq) return;

      // Check sessionStorage draft
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.items && Array.isArray(parsed.items)) {
            const restored: SelectedDishItem[] = [];
            for (const it of parsed.items) {
              const matchedDish = dishList.find((d) => d.id === it.dishId);
              if (matchedDish) {
                restored.push({
                  dish: matchedDish,
                  quantityPerTable: it.quantityPerTable,
                });
              }
            }
            setSelectedItems(restored);
          }
          if (parsed.tableCount) {
            setTableCount(parsed.tableCount);
          }
          if (parsed.guestCount) {
            setGuestCount(parsed.guestCount);
          }
        } catch (e) {
          console.error('Failed to restore draft', e);
        }
      }

      if (loadSeqRef.current !== seq) return;
      setIsRestored(true);
    } catch (err) {
      console.error('Error fetching catalog', err);
      if (loadSeqRef.current === seq) {
        setCatalogError(extractErrorMessage(err));
      }
    } finally {
      if (loadSeqRef.current === seq) {
        setCatalogLoading(false);
      }
    }
  };

  useEffect(() => {
    loadCatalogAndDraft();
  }, [menuIdParam]);

  // Save draft to sessionStorage whenever selectedItems, tableCount, or guestCount change
  useEffect(() => {
    if (!isRestored) return;
    const dataToSave = {
      items: selectedItems.map((it) => ({
        dishId: it.dish.id,
        quantityPerTable: it.quantityPerTable,
      })),
      tableCount,
      guestCount,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [isRestored, selectedItems, tableCount, guestCount]);

  // Real-time Preview API Debounced with Stale Response Suppression
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewSeqRef = useRef<number>(0);

  useEffect(() => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
    }

    const seq = ++previewSeqRef.current;

    if (selectedItems.length === 0) {
      setPreview(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    previewTimerRef.current = setTimeout(async () => {
      try {
        setPreviewLoading(true);
        setPreviewError(null);
        const payloadItems: CreateOrderItemPayload[] = selectedItems.map((it) => ({
          dishId: it.dish.id,
          quantityPerTable: it.quantityPerTable,
        }));
        const res = await orderService.previewOrder({
          tableCount,
          items: payloadItems,
        });
        if (seq === previewSeqRef.current) {
          setPreview(res);
        }
      } catch (err) {
        if (seq === previewSeqRef.current) {
          setPreviewError(extractErrorMessage(err));
        }
      } finally {
        if (seq === previewSeqRef.current) {
          setPreviewLoading(false);
        }
      }
    }, 350);

    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, [selectedItems, tableCount]);

  const handleAddDish = (dish: DishSummaryDto) => {
    setSelectedItems((prev) => {
      const exists = prev.some((it) => it.dish.id === dish.id);
      if (exists) {
        return prev.map((it) =>
          it.dish.id === dish.id
            ? { ...it, quantityPerTable: it.quantityPerTable + 1 }
            : it
        );
      }
      return [...prev, { dish, quantityPerTable: 1 }];
    });
  };

  const handleUpdateQuantity = (dishId: number, delta: number) => {
    setSelectedItems((prev) => {
      return prev
        .map((it) => {
          if (it.dish.id === dishId) {
            const nextQty = it.quantityPerTable + delta;
            return nextQty > 0 ? { ...it, quantityPerTable: nextQty } : null;
          }
          return it;
        })
        .filter((it): it is SelectedDishItem => it !== null);
    });
  };

  const handleRemoveDish = (dishId: number) => {
    setSelectedItems((prev) => prev.filter((it) => it.dish.id !== dishId));
  };

  const handleClearBasket = () => {
    setSelectedItems([]);
  };

  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) return;
    const computedGuests = guestCount || (tableCount * 10);
    navigate(`/checkout?tables=${tableCount}&guests=${computedGuests}`);
  };

  // Group dishes by category for the structured box view (PITO style)
  const categoryGroups = useMemo(() => {
    const targetCategories = selectedCategoryId
      ? categories.filter((c) => c.id === selectedCategoryId)
      : categories;

    return targetCategories
      .map((cat) => {
        const catDishes = dishes.filter((d) => {
          if (d.categoryId !== cat.id) return false;
          if (keyword.trim()) {
            const kw = keyword.toLowerCase();
            return (
              d.name.toLowerCase().includes(kw) ||
              d.code.toLowerCase().includes(kw) ||
              (d.description && d.description.toLowerCase().includes(kw))
            );
          }
          return true;
        });

        const selectedCount = selectedItems.filter((it) => it.dish.categoryId === cat.id).length;

        return {
          category: cat,
          dishes: catDishes,
          selectedCount,
        };
      })
      .filter((group) => group.dishes.length > 0 || (selectedCategoryId !== undefined && group.category.id === selectedCategoryId));
  }, [categories, dishes, keyword, selectedCategoryId, selectedItems]);

  // Group selected items by category for the order summary sidebar (PITO style)
  const selectedGroupedByCategory = useMemo(() => {
    const map = new Map<string, SelectedDishItem[]>();
    for (const item of selectedItems) {
      const catName = item.dish.categoryName || 'Món khác';
      if (!map.has(catName)) {
        map.set(catName, []);
      }
      map.get(catName)!.push(item);
    }
    return Array.from(map.entries());
  }, [selectedItems]);

  const getSelectedCountForCategory = (catId: number) => {
    return selectedItems.filter((it) => it.dish.categoryId === catId).length;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-up-1">
      {/* Centered Clean Header */}
      <div className="text-center max-w-2xl mx-auto space-y-1.5 pt-1 pb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          Tùy biến thực đơn bàn tiệc
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
          Tự do lựa chọn từng món ăn theo khẩu vị riêng với định mức chi phí và tồn kho tự động kiểm tra theo thời gian thực.
        </p>
      </div>

      {/* Main Workspace: 7 Cols Dishes Catalog, 5 Cols Custom Basket */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: DISH CATALOG ORGANIZED BY CATEGORY BOXES (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Search Bar & Sticky Category Pills Navigation */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs space-y-3.5 sticky top-20 z-20 backdrop-blur-md bg-white/95">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Tìm món theo tên hoặc mã món..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-9 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none shadow-xs transition-colors"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  title="Xóa tìm kiếm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Link
              to="/menus"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition-colors shrink-0"
              title="Xem các bộ thực đơn chuẩn sẵn có"
            >
              ← Mẫu có sẵn
            </Link>
          </div>

            {/* Category Pills Navigation with Selected Indicators */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
              <button
                type="button"
                onClick={() => setSelectedCategoryId(undefined)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategoryId === undefined
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700'
                }`}
              >
                <span>Tất cả</span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  selectedCategoryId === undefined ? 'bg-amber-800 text-amber-100' : 'bg-stone-200 text-stone-600'
                }`}>
                  {dishes.length}
                </span>
              </button>

              {categories.map((cat) => {
                const countSelected = getSelectedCountForCategory(cat.id);
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {countSelected > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isSelected ? 'bg-amber-800 text-white' : 'bg-amber-200/80 text-amber-900'
                      }`}>
                        Đã chọn {countSelected}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dish Listings Grouped in Category Boxes (PITO Reference Style) */}
          {catalogLoading ? (
            <LoadingState label="Đang tải danh mục món ăn..." />
          ) : catalogError ? (
            <div className="py-8">
              <ErrorState
                message={`Không thể kết nối danh mục món: ${catalogError}`}
                onRetry={() => loadCatalogAndDraft()}
              />
            </div>
          ) : categoryGroups.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-stone-500 text-xs sm:text-sm space-y-2">
              <Utensils className="h-8 w-8 mx-auto text-stone-300" />
              <p className="font-semibold text-stone-700">Không tìm thấy món ăn nào phù hợp.</p>
              <p className="text-stone-400 text-xs">Vui lòng thử tìm từ khóa khác hoặc bấm chọn "Tất cả".</p>
            </div>
          ) : (
            <div className="space-y-6">
              {categoryGroups.map((group) => (
                <section
                  key={group.category.id}
                  id={`cat-section-${group.category.id}`}
                  className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4"
                >
                  {/* Category Box Header with Selection Indicator */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-stone-900 tracking-tight">
                          {group.category.name}
                        </h2>
                        <span className="text-[11px] font-medium text-stone-400">
                          ({group.dishes.length} món khả dụng)
                        </span>
                      </div>
                      {group.category.description && (
                        <p className="text-xs text-stone-500 line-clamp-1">
                          {group.category.description}
                        </p>
                      )}
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto border transition-colors">
                      {group.selectedCount > 0 ? (
                        <span className="text-emerald-800 bg-emerald-50 border-emerald-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Đã chọn {group.selectedCount} món
                        </span>
                      ) : (
                        <span className="text-stone-500 bg-stone-50 border-stone-200/60 px-2.5 py-0.5 rounded-full">
                          Chưa chọn món nào
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dishes in this Category Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {group.dishes.map((dish) => {
                      const inBasket = selectedItems.find((it) => it.dish.id === dish.id);
                      return (
                        <article
                          key={dish.id}
                          className={`group flex flex-col justify-between overflow-hidden rounded-xl border p-3 shadow-xs transition-all duration-200 ${
                            inBasket
                              ? 'border-amber-500/80 bg-amber-50/20 ring-1 ring-amber-500/30'
                              : 'border-stone-200 bg-white hover:border-amber-300 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="h-20 w-20 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200 shadow-2xs relative">
                              <img
                                src={dish.imageUrl || DEFAULT_DISH_IMAGE}
                                alt={dish.name}
                                onError={handleImageError}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                              />
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-stone-500 font-semibold uppercase bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200/60 tabular-nums">
                                  {dish.code}
                                </span>
                              </div>
                              <h3
                                className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-1"
                                title={dish.name}
                              >
                                {dish.name}
                              </h3>
                              <p className="text-[11px] text-stone-500 line-clamp-1">
                                {dish.description || 'Chế biến tươi chuẩn vị yến tiệc'}
                              </p>
                              <div className="text-xs font-bold text-amber-900 tabular-nums pt-0.5">
                                {formatVnd(dish.price)}{' '}
                                <span className="text-[10px] font-normal text-stone-400">/ phần</span>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Action Bar */}
                          <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                            <Link
                              to={`/dishes/${dish.id}`}
                              target="_blank"
                              className="text-[11px] font-medium text-stone-400 hover:text-stone-700 flex items-center gap-0.5 transition-colors"
                            >
                              <span>Xem chi tiết</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>

                            {inBasket ? (
                              /* Card Stepper for selected dish */
                              <div className="flex items-center gap-1 bg-white border border-amber-300 rounded-lg p-0.5 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(dish.id, -1)}
                                  className="h-6 w-6 rounded-md hover:bg-stone-100 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
                                  title="Giảm 1 phần"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-5 text-center font-bold text-xs text-stone-900 tabular-nums">
                                  {inBasket.quantityPerTable}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(dish.id, 1)}
                                  className="h-6 w-6 rounded-md hover:bg-stone-100 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
                                  title="Tăng 1 phần"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddDish(dish)}
                                className="inline-flex items-center gap-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Chọn món</span>
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: TÓM TẮT ĐƠN HÀNG GOM NHÓM THEO PHÂN LOẠI (Matching PITO Reference Image 2) */}
        <div className="lg:col-span-5 sticky top-20 space-y-5">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-5">
            {/* Basket Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-amber-700" />
                <h2 className="font-bold text-base text-stone-900 tracking-tight">
                  Tóm tắt đơn hàng
                </h2>
                <span className="rounded-full bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 text-xs font-bold tabular-nums">
                  {selectedItems.length} món
                </span>
              </div>

              {selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearBasket}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Xóa hết</span>
                </button>
              )}
            </div>

            {/* Table Count Control */}
            <div className="flex items-center justify-between py-2 bg-stone-50/70 p-3.5 rounded-xl border border-stone-200/80">
              <div>
                <span className="block text-xs font-bold text-stone-800">
                  Quy mô số bàn tiệc:
                </span>
                <span className="text-[11px] text-stone-500">
                  Tiêu chuẩn 10 khách/bàn (~{tableCount * 10} khách)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTableCount((prev) => Math.max(1, prev - 1))}
                  className="h-8 w-8 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 font-bold text-stone-700 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                  title="Giảm 1 bàn"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={tableCount}
                  onChange={(e) => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 text-center font-bold text-sm border border-stone-300 rounded-lg py-1 bg-white focus:border-amber-600 focus:outline-none shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setTableCount((prev) => prev + 1)}
                  className="h-8 w-8 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 font-bold text-stone-700 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                  title="Tăng 1 bàn"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Grouped Selected Dishes List (Matching PITO Reference Layout) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                <Layers className="h-4 w-4 text-amber-700" />
                <span>Món đã chọn</span>
              </div>

              {selectedItems.length === 0 ? (
                <div className="py-10 text-center text-stone-400 space-y-2 border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                  <Utensils className="h-8 w-8 mx-auto text-stone-300" />
                  <p className="text-xs font-semibold text-stone-600">Thực đơn hiện đang trống</p>
                  <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                    Bấm "+ Chọn món" từ các danh mục bên trái để đưa món vào bàn tiệc.
                  </p>
                </div>
              ) : (
                <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                  {selectedGroupedByCategory.map(([catName, itemsInCat]) => (
                    <div
                      key={catName}
                      className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-3 space-y-2"
                    >
                      {/* Category Header within Basket */}
                      <div className="flex items-center justify-between text-xs font-bold text-stone-800 border-b border-stone-200/60 pb-1.5">
                        <span className="text-amber-900">{catName}</span>
                        <span className="text-[10px] text-stone-500 font-normal">
                          {itemsInCat.length} món
                        </span>
                      </div>

                      {/* Items in this category */}
                      <div className="divide-y divide-stone-100">
                        {itemsInCat.map((item) => (
                          <div
                            key={item.dish.id}
                            className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-stone-900 truncate" title={item.dish.name}>
                                {item.dish.name}
                              </p>
                              <div className="text-[11px] text-stone-500">
                                {formatVnd(item.dish.price)} • Tổng: {item.quantityPerTable * tableCount} phần
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.dish.id, -1)}
                                className="h-5 w-5 rounded bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
                                title="Giảm 1 phần"
                              >
                                <Minus className="h-2.5 w-2.5" />
                              </button>
                              <span className="w-5 text-center font-bold text-xs text-stone-900 tabular-nums">
                                {item.quantityPerTable}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.dish.id, 1)}
                                className="h-5 w-5 rounded bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
                                title="Tăng 1 phần"
                              >
                                <Plus className="h-2.5 w-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveDish(item.dish.id)}
                                className="h-5 w-5 rounded hover:bg-rose-50 text-stone-400 hover:text-rose-600 flex items-center justify-center ml-0.5 transition-colors cursor-pointer"
                                title="Xóa món"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Validation & Stock Warnings */}
            {previewLoading && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center gap-2 text-xs text-amber-800">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Đang kiểm tra tồn kho nguyên liệu realtime...</span>
              </div>
            )}

            {previewError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{previewError}</span>
              </div>
            )}

            {preview && !preview.canProceed && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                  <span>Cảnh báo tồn kho không đủ:</span>
                </div>
                {preview.validationMessages.map((msg, idx) => (
                  <div key={idx} className="pl-5 text-amber-800 text-[11px]">
                    • {msg}
                  </div>
                ))}
              </div>
            )}

            {/* Price Calculations */}
            {preview && (
              <div className="rounded-xl bg-stone-50 p-4 border border-stone-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Giá 01 bàn ({selectedItems.length} món):</span>
                  <span className="font-semibold text-stone-900 tabular-nums">
                    {formatVnd(preview.pricePerTable)}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Quy mô bàn tiệc:</span>
                  <span className="font-semibold text-stone-900 tabular-nums">
                    {preview.tableCount} bàn ({preview.tableCount * 10} khách)
                  </span>
                </div>
                <div className="border-t border-stone-200 pt-2 flex justify-between items-baseline text-sm font-bold text-stone-900">
                  <span>Tổng tiền tạm tính:</span>
                  <span className="text-xl font-bold text-amber-900 tabular-nums">
                    {formatVnd(preview.totalAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Action Checkout Button */}
            <button
              type="button"
              disabled={selectedItems.length === 0}
              onClick={handleProceedToCheckout}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-bold py-3.5 shadow-xs transition-all ${
                selectedItems.length === 0
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-amber-700 hover:bg-amber-800 text-white cursor-pointer shadow-sm'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Tiếp tục đặt tiệc</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="rounded-xl bg-stone-50 border border-stone-100 p-3 text-[11px] text-stone-500 space-y-1">
              <div className="font-semibold text-stone-700 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Cam kết giữ chỗ nguyên liệu độc quyền</span>
              </div>
              <p className="leading-relaxed">
                Kho nguyên liệu sẽ được khóa giữ an toàn 15 phút ngay khi quý khách bấm gửi đơn đặt tiệc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
