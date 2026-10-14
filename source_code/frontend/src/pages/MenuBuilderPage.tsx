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
  Sliders,
  ArrowRight,
  Info,
  RefreshCw,
  Sparkles,
  ShoppingBag,
  Filter,
  X,
  ShieldCheck,
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
import { formatVnd, formatQuantity } from '../hooks/useFormatters';
import { LoadingState, ErrorState } from '../components/StatusStates';
import { extractErrorMessage } from '../services/apiClient';

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

  // Basket State
  const [selectedItems, setSelectedItems] = useState<SelectedDishItem[]>([]);
  const [tableCount, setTableCount] = useState<number>(6);
  const [isRestored, setIsRestored] = useState<boolean>(false);

  // Preview & Validation State
  const [preview, setPreview] = useState<OrderPreviewResponseDto | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const loadCatalogAndDraft = async (mounted: boolean) => {
    try {
      setCatalogLoading(true);
      setCatalogError(null);
      const [cats, dishList] = await Promise.all([
        catalogService.getPublicCategories(),
        catalogService.getPublicDishes(),
      ]);
      if (!mounted) return;
      setCategories(cats);
      setDishes(dishList);

      if (menuIdParam) {
        // Load template menu
        try {
          const menu = await menuService.getMenuById(Number(menuIdParam));
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
              if (mounted) {
                setCatalogLoading(false);
                setIsRestored(true);
              }
              return;
            }
          }
        } catch (e) {
          console.error('Failed to load menu template', e);
        }
      }

      // Check sessionStorage
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
        } catch (e) {
          console.error('Failed to restore draft', e);
        }
      }

      // Catalog & draft restored successfully
      if (mounted) {
        setIsRestored(true);
      }
    } catch (err) {
      console.error('Error fetching catalog', err);
      if (mounted) {
        setCatalogError(extractErrorMessage(err));
        // Keep isRestored = false so effect never overwrites saved draft on network failure!
      }
    } finally {
      if (mounted) {
        setCatalogLoading(false);
      }
    }
  };

  // Initial Load from Menu or Storage
  useEffect(() => {
    let mounted = true;
    loadCatalogAndDraft(mounted);
    return () => {
      mounted = false;
    };
  }, [menuIdParam]);

  // Persist draft to sessionStorage only after initial load finishes
  useEffect(() => {
    if (!isRestored) return;
    const dataToSave = {
      tableCount,
      items: selectedItems.map((it) => ({
        dishId: it.dish.id,
        quantityPerTable: it.quantityPerTable,
      })),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [isRestored, selectedItems, tableCount]);

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

  // Helpers to add, update, remove (Immutable updates)
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
    setPreview(null);
  };

  // Filter Catalog
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      if (selectedCategoryId && dish.categoryId !== selectedCategoryId) return false;
      if (keyword.trim()) {
        const kw = keyword.toLowerCase();
        return (
          dish.name.toLowerCase().includes(kw) ||
          dish.code.toLowerCase().includes(kw) ||
          (dish.categoryName && dish.categoryName.toLowerCase().includes(kw))
        );
      }
      return true;
    });
  }, [dishes, selectedCategoryId, keyword]);

  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) return;
    navigate('/checkout');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up-1">
      {/* Header Banner */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
              <Sliders className="h-3.5 w-3.5 text-amber-600" />
              <span>Công cụ phối thực đơn thông minh</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Tùy biến thực đơn bàn tiệc
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Tự do chọn các món ưa thích từ danh mục bên trái, thêm vào bàn tiệc và điều chỉnh số lượng phần. Hệ thống tự động tính tổng chi phí và kiểm tra khả dụng tồn kho nguyên liệu theo thời gian thực.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/menus"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 transition-colors"
            >
              ← Chọn mẫu thực đơn có sẵn
            </Link>
          </div>
        </div>
      </div>

      {/* Main Workspace: 7 Cols Dishes Catalog, 5 Cols Custom Basket */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: DISH CATALOG (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Search & Category Pills */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs space-y-3.5">
            <div className="relative">
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

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedCategoryId(undefined)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategoryId === undefined
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                Tất cả ({dishes.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategoryId === cat.id
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Dish Listings Grid */}
          {catalogLoading ? (
            <LoadingState label="Đang tải danh mục món ăn..." />
          ) : catalogError ? (
            <div className="py-8">
              <ErrorState
                message={`Không thể kết nối danh mục món: ${catalogError}`}
                onRetry={() => loadCatalogAndDraft(true)}
              />
            </div>
          ) : filteredDishes.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-500 text-xs sm:text-sm">
              Không tìm thấy món ăn nào phù hợp với bộ lọc.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDishes.map((dish) => {
                const inBasket = selectedItems.find((it) => it.dish.id === dish.id);
                return (
                  <article
                    key={dish.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200 bg-white p-3.5 shadow-xs hover:border-amber-300 hover:shadow-md transition-all"
                  >
                    <div className="flex gap-3">
                      <div className="h-18 w-18 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                        <img
                          src={
                            dish.imageUrl ||
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'
                          }
                          alt={dish.name}
                          className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-stone-400 font-semibold uppercase">
                            {dish.code}
                          </span>
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                            {dish.categoryName}
                          </span>
                        </div>
                        <h4 className="font-bold text-stone-900 text-sm truncate">
                          {dish.name}
                        </h4>
                        <div className="text-xs font-bold text-stone-900">
                          {formatVnd(dish.price)} <span className="text-[10px] font-normal text-stone-400">/ phần</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
                      {inBasket ? (
                        <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Đã chọn {inBasket.quantityPerTable} phần/bàn
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-400">Chưa có trong bàn</span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleAddDish(dish)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                          inBasket
                            ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                            : 'bg-amber-800 hover:bg-amber-900 text-white shadow-xs'
                        }`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{inBasket ? '+1 phần' : 'Thêm món'}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: BASKET & REALTIME PREVIEW (5 Cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-5">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-5">
            {/* Basket Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-amber-700" />
                <h3 className="font-bold text-base text-stone-900 tracking-tight">
                  Bàn tiệc của bạn
                </h3>
                <span className="rounded-full bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 text-xs font-bold">
                  {selectedItems.length} món
                </span>
              </div>

              {selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearBasket}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Xóa hết</span>
                </button>
              )}
            </div>

            {/* Table Count Control */}
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Quy mô số bàn tiệc:
                </span>
                <span className="text-[11px] text-stone-400">1 bàn tiêu chuẩn 10 khách</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTableCount((prev) => Math.max(1, prev - 1))}
                  className="h-8 w-8 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 font-bold text-stone-700 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={tableCount}
                  onChange={(e) => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 text-center font-bold text-base border border-stone-300 rounded-lg py-1 focus:border-amber-600 focus:outline-none shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setTableCount((prev) => prev + 1)}
                  className="h-8 w-8 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 font-bold text-stone-700 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* Basket Items List */}
            {selectedItems.length === 0 ? (
              <div className="py-12 text-center text-stone-400 space-y-2 border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                <Utensils className="h-8 w-8 mx-auto text-stone-300" />
                <p className="text-xs font-semibold text-stone-600">Bàn tiệc hiện đang trống</p>
                <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                  Nhấn nút "+ Thêm món" từ danh mục bên trái để bắt đầu phối thực đơn.
                </p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-stone-100 pr-1 scrollbar-thin">
                {selectedItems.map((item) => (
                  <div key={item.dish.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-stone-900 truncate">
                        {item.dish.name}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {formatVnd(item.dish.price)} / phần • Tổng: {item.quantityPerTable * tableCount} phần
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.dish.id, -1)}
                        className="h-6 w-6 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-stone-800">
                        {item.quantityPerTable}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.dish.id, 1)}
                        className="h-6 w-6 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDish(item.dish.id)}
                        className="h-6 w-6 rounded hover:bg-rose-50 text-stone-400 hover:text-rose-600 flex items-center justify-center ml-1 transition-colors cursor-pointer"
                        title="Xóa món"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
              <div className="rounded-xl bg-stone-50 p-4 border border-stone-100 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Giá 01 bàn ({selectedItems.length} món):</span>
                  <span className="font-semibold text-stone-900">{formatVnd(preview.pricePerTable)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Số lượng bàn tiệc:</span>
                  <span className="font-semibold text-stone-900">{preview.tableCount} bàn</span>
                </div>
                <div className="border-t border-stone-200 pt-2 flex justify-between items-baseline text-sm font-bold text-stone-900">
                  <span>Tổng tiền tạm tính:</span>
                  <span className="text-lg font-bold text-amber-900">
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
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold py-3 shadow-xs transition-all ${
                selectedItems.length === 0
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-amber-800 hover:bg-amber-900 text-white cursor-pointer'
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
