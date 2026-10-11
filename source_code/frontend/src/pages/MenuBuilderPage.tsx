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

  // Basket State
  const [selectedItems, setSelectedItems] = useState<SelectedDishItem[]>([]);
  const [tableCount, setTableCount] = useState<number>(5);

  // Preview & Validation State
  const [preview, setPreview] = useState<OrderPreviewResponseDto | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Initial Load from Menu or Storage
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setCatalogLoading(true);
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
      } catch (err) {
        console.error('Error fetching catalog', err);
      } finally {
        if (mounted) setCatalogLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [menuIdParam]);

  // Persist draft to sessionStorage
  useEffect(() => {
    const dataToSave = {
      tableCount,
      items: selectedItems.map((it) => ({
        dishId: it.dish.id,
        quantityPerTable: it.quantityPerTable,
      })),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [selectedItems, tableCount]);

  // Real-time Preview API Debounced
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (selectedItems.length === 0) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
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
        setPreview(res);
      } catch (err) {
        setPreviewError(extractErrorMessage(err));
      } finally {
        setPreviewLoading(false);
      }
    }, 350);

    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, [selectedItems, tableCount]);

  // Helpers to add, update, remove
  const handleAddDish = (dish: DishSummaryDto) => {
    setSelectedItems((prev) => {
      const idx = prev.findIndex((it) => it.dish.id === dish.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantityPerTable += 1;
        return copy;
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
    <div className="min-h-screen bg-[#faf8f5] text-stone-800 pb-20">
      {/* Header */}
      <section className="bg-stone-900 text-white py-8 px-4 sm:px-8 border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sliders className="w-3 h-3" />
              Công Cụ Phối Thực Đơn Thông Minh
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Tùy Biến Thực Đơn Tiệc Theo Ý Muốn
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm mt-1">
              Chọn món từ thực đơn món ăn, tinh chỉnh số lượng phần trên bàn và xem trước giá cùng khả năng đáp ứng nguyên liệu.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/menus"
              className="text-xs text-amber-300 hover:underline flex items-center gap-1.5"
            >
              ← Chọn mẫu thực đơn có sẵn
            </Link>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: DISH CATALOG (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Search & Filter Controls */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm món ăn theo tên hoặc mã món..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  onClick={() => setSelectedCategoryId(undefined)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategoryId === undefined
                      ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                  }`}
                >
                  Tất cả ({dishes.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategoryId === cat.id
                        ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            {catalogLoading ? (
              <LoadingState message="Đang tải danh mục món ăn..." />
            ) : filteredDishes.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 text-stone-500 text-sm">
                Không tìm thấy món ăn nào phù hợp với điều kiện lọc.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredDishes.map((dish) => {
                  const inBasket = selectedItems.find((it) => it.dish.id === dish.id);
                  return (
                    <div
                      key={dish.id}
                      className="bg-white rounded-xl border border-stone-200/90 p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                          <img
                            src={
                              dish.imageUrl ||
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'
                            }
                            alt={dish.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-mono text-stone-400 font-semibold uppercase">
                            {dish.code} • {dish.categoryName}
                          </div>
                          <h4 className="font-semibold text-stone-900 text-sm truncate leading-snug">
                            {dish.name}
                          </h4>
                          <div className="text-amber-800 font-bold text-xs mt-1">
                            {formatVnd(dish.price)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
                        {inBasket ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-amber-700 font-semibold">
                              Đã chọn: {inBasket.quantityPerTable} phần/bàn
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400">Chưa có trong bàn</span>
                        )}

                        <button
                          onClick={() => handleAddDish(dish)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                            inBasket
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                              : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {inBasket ? 'Thêm +1' : 'Thêm Món'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: BASKET & REAL-TIME PREVIEW (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-md sticky top-6">
              {/* Basket Header */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                  <h3 className="font-serif font-bold text-stone-900 text-base">
                    Bàn Tiệc Của Bạn
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    {selectedItems.length} món
                  </span>
                </div>
                {selectedItems.length > 0 && (
                  <button
                    onClick={handleClearBasket}
                    className="text-xs text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Làm mới
                  </button>
                )}
              </div>

              {/* Table Count Selector */}
              <div className="py-4 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-stone-700 uppercase tracking-wide block">
                    Quy mô tiệc (Số bàn):
                  </span>
                  <span className="text-[11px] text-stone-400">1 bàn tiêu chuẩn 10 khách</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTableCount((prev) => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={tableCount}
                    onChange={(e) => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 text-center font-bold text-base border border-stone-300 rounded-lg py-1 focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    onClick={() => setTableCount((prev) => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Basket Dish Items */}
              {selectedItems.length === 0 ? (
                <div className="py-12 text-center text-stone-400 space-y-2">
                  <Utensils className="w-10 h-10 mx-auto text-stone-300" />
                  <p className="text-sm font-medium">Bàn tiệc đang trống</p>
                  <p className="text-xs max-w-xs mx-auto">
                    Hãy nhấn nút "+ Thêm Món" ở danh mục bên trái để bắt đầu phối thực đơn.
                  </p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-stone-100 my-3 pr-1 scrollbar-thin">
                  {selectedItems.map((item) => (
                    <div key={item.dish.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h5 className="font-semibold text-xs text-stone-900 truncate">
                          {item.dish.name}
                        </h5>
                        <div className="text-[11px] text-stone-500">
                          {formatVnd(item.dish.price)} / phần • Tổng: {item.quantityPerTable * tableCount} phần
                        </div>
                      </div>

                      {/* Quantity control */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleUpdateQuantity(item.dish.id, -1)}
                          className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 text-xs font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-stone-800">
                          {item.quantityPerTable}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.dish.id, 1)}
                          className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 text-xs font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRemoveDish(item.dish.id)}
                          className="w-6 h-6 rounded hover:bg-rose-50 text-stone-400 hover:text-rose-600 flex items-center justify-center ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Validation & Stock Warnings */}
              {previewLoading && (
                <div className="py-3 flex items-center justify-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl my-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Đang kiểm tra nguyên liệu tồn kho theo thời gian thực...
                </div>
              )}

              {previewError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 mb-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{previewError}</span>
                </div>
              )}

              {preview && !preview.canProceed && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 mb-3 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    Cảnh báo khả năng phục vụ:
                  </div>
                  {preview.validationMessages.map((msg, idx) => (
                    <div key={idx} className="pl-5 text-amber-800">
                      • {msg}
                    </div>
                  ))}
                </div>
              )}

              {/* Price Calculation Summary */}
              {preview && (
                <div className="pt-4 border-t border-stone-200 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Giá mỗi bàn ({selectedItems.length} món):</span>
                    <span className="font-semibold text-stone-900">
                      {formatVnd(preview.pricePerTable)}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Số lượng bàn:</span>
                    <span className="font-semibold text-stone-900">{preview.tableCount} bàn</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-100">
                    <span>Tổng tiền dự tính:</span>
                    <span className="font-serif text-lg text-amber-800">
                      {formatVnd(preview.totalAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-6">
                <button
                  disabled={selectedItems.length === 0}
                  onClick={handleProceedToCheckout}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-md transition-all ${
                    selectedItems.length === 0
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Tiếp Tục Đặt Tiệc
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>

              {/* Stock Reservation Assurance Note */}
              <div className="mt-4 p-3 bg-stone-50 rounded-xl text-[11px] text-stone-500 space-y-1">
                <div className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Chính sách giữ chỗ tự động (BR-07)
                </div>
                Kho sẽ giữ nguyên liệu độc quyền 15 phút ngay khi bạn tạo đơn. Không lo thiếu nguyên liệu trong lúc tiến hành thanh toán.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
