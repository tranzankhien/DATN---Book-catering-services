import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Utensils,
  ArrowRight,
  Calculator,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  LayoutGrid,
  List,
  Check,
  Users,
  Info,
} from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { extractErrorMessage } from '../services/apiClient';
import type { CategoryDto, DishSummaryDto } from '../services/types';
import { formatVnd } from '../hooks/useFormatters';
import { EmptyState, ErrorState, LoadingState } from '../components/StatusStates';

interface DraftMenuLine {
  dish: DishSummaryDto;
  portionsPerTable: number;
}

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategoryParam = searchParams.get('categoryId');

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [dishes, setDishes] = useState<DishSummaryDto[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(
    initialCategoryParam ? Number(initialCategoryParam) : undefined
  );
  const [keyword, setKeyword] = useState<string>('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Bảng tính thử thực đơn bàn tiệc
  const [draftLines, setDraftLines] = useState<DraftMenuLine[]>([]);
  const [tableCount, setTableCount] = useState<number>(6);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, dishList] = await Promise.all([
        catalogService.getPublicCategories(),
        catalogService.getPublicDishes({
          categoryId: selectedCategoryId,
          keyword: keyword.trim() || undefined,
        }),
      ]);
      setCategories(cats);
      setDishes(dishList);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, keyword]);

  useEffect(() => {
    void fetchCatalog();
  }, [fetchCatalog]);

  const handleSelectCategory = (catId?: number) => {
    setSelectedCategoryId(catId);
    if (catId) {
      setSearchParams({ categoryId: String(catId) });
    } else {
      setSearchParams({});
    }
  };

  const addDishToCalculator = (dish: DishSummaryDto) => {
    setDraftLines((prev) => {
      const existing = prev.find((item) => item.dish.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dish.id === dish.id
            ? { ...item, portionsPerTable: item.portionsPerTable + 1 }
            : item
        );
      }
      return [...prev, { dish, portionsPerTable: 1 }];
    });
  };

  const updatePortion = (dishId: number, delta: number) => {
    setDraftLines((prev) =>
      prev
        .map((item) =>
          item.dish.id === dishId
            ? { ...item, portionsPerTable: item.portionsPerTable + delta }
            : item
        )
        .filter((item) => item.portionsPerTable > 0)
    );
  };

  const sortedDishes = useMemo(() => {
    const list = [...dishes];
    if (sortBy === 'price-asc') {
      return list.sort((a, b) => Number(a.price) - Number(b.price));
    }
    if (sortBy === 'price-desc') {
      return list.sort((a, b) => Number(b.price) - Number(a.price));
    }
    if (sortBy === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    }
    return list;
  }, [dishes, sortBy]);

  const pricePerTable = useMemo(
    () =>
      draftLines.reduce(
        (sum, line) => sum + Number(line.dish.price) * line.portionsPerTable,
        0
      ),
    [draftLines]
  );

  const totalOrderPrice = useMemo(
    () => pricePerTable * Math.max(1, tableCount),
    [pricePerTable, tableCount]
  );

  const estimatedGuests = tableCount * 10;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Thực Đơn Công Khai & Định Mức Chuẩn Hóa</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Danh Mục Món Tiệc Chuẩn Vị
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Mỗi món ăn có đơn giá tính cho 01 phần trên mỗi bàn tiệc (chuẩn 10 khách). Bấm{' '}
              <strong className="text-stone-800">Chọn món</strong> để mô phỏng tính giá toàn bộ
              bàn tiệc theo quy chuẩn bàn tiệc tại bảng tính bên phải.
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-stone-700 shrink-0">
            <Info className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="font-medium">Tiêu chuẩn tiệc: 01 bàn = 10 khách</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên món, loại món (VD: Tôm sú, Gà ta, Bò hầm, Lẩu...)"
              className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none shadow-sm transition-colors"
            />
          </div>

          {/* Controls: Sort and View mode */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs shadow-sm">
              <span className="text-stone-500 font-medium">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-semibold text-stone-800 focus:outline-none cursor-pointer"
              >
                <option value="default">Mặc định danh mục</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
                <option value="name">Tên món: A → Z</option>
              </select>
            </div>

            <div className="flex items-center rounded-xl border border-stone-300 bg-white p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-amber-100 text-amber-900 font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Dạng lưới"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-amber-100 text-amber-900 font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Dạng danh sách"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 mr-1">
            <Filter className="h-3.5 w-3.5 text-amber-700" />
            Danh mục:
          </span>

          <button
            type="button"
            onClick={() => handleSelectCategory(undefined)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              selectedCategoryId === undefined
                ? 'bg-amber-700 text-white shadow-sm'
                : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-400'
            }`}
          >
            Tất cả danh mục ({dishes.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                selectedCategoryId === cat.id
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-400'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Dish Listings */}
        <div className="lg:col-span-8">
          {loading ? (
            <LoadingState label="Đang tải danh sách món ăn từ máy chủ..." />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchCatalog} />
          ) : sortedDishes.length === 0 ? (
            <EmptyState
              title="Không tìm thấy món ăn phù hợp"
              description="Hãy thử bỏ bộ lọc danh mục hoặc tìm kiếm với từ khóa khác."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setKeyword('');
                    handleSelectCategory(undefined);
                  }}
                  className="rounded-xl bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800 cursor-pointer shadow-sm transition-colors"
                >
                  Xem lại toàn bộ món ăn
                </button>
              }
            />
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {sortedDishes.map((dish) => {
                const draftItem = draftLines.find((l) => l.dish.id === dish.id);
                return (
                  <article
                    key={dish.id}
                    className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white hover:border-amber-300 hover:shadow-md transition-all shadow-sm"
                  >
                    <div className="relative h-44 bg-stone-100 overflow-hidden">
                      {dish.imageUrl ? (
                        <img
                          src={dish.imageUrl}
                          alt={dish.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-stone-400">
                          <Utensils className="h-10 w-10" />
                        </div>
                      )}

                      <span className="absolute top-2.5 left-2.5 rounded-lg bg-white/95 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-stone-800 shadow-sm border border-stone-200">
                        {dish.categoryName}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-4 sm:p-5 space-y-3">
                      <div className="flex-1">
                        <Link
                          to={`/dishes/${dish.id}`}
                          className="text-base font-bold text-stone-900 hover:text-amber-700 transition-colors line-clamp-1"
                        >
                          {dish.name}
                        </Link>
                        <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed">
                          {dish.description || 'Món ăn tiệc tiêu chuẩn phục vụ 10 khách.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                        <div>
                          <span className="block text-[10px] uppercase font-semibold text-stone-400">
                            Giá / 01 phần
                          </span>
                          <span className="text-base font-bold text-amber-700">
                            {formatVnd(dish.price)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => addDishToCalculator(dish)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                              draftItem
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                            }`}
                            title="Thêm món này vào bàn tiệc dự tính"
                          >
                            {draftItem ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-amber-700" />
                                <span>Đã chọn ({draftItem.portionsPerTable})</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                <span>Chọn món</span>
                              </>
                            )}
                          </button>

                          <Link
                            to={`/dishes/${dish.id}`}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-stone-100 text-stone-600 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                            title="Xem chi tiết công thức định lượng"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-3">
              {sortedDishes.map((dish) => {
                const draftItem = draftLines.find((l) => l.dish.id === dish.id);
                return (
                  <article
                    key={dish.id}
                    className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-stone-200 bg-white p-3.5 hover:border-amber-300 hover:shadow-sm transition-all shadow-sm"
                  >
                    <div className="h-20 w-24 shrink-0 rounded-lg overflow-hidden bg-stone-100">
                      {dish.imageUrl ? (
                        <img
                          src={dish.imageUrl}
                          alt={dish.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-stone-400">
                          <Utensils className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                          {dish.categoryName}
                        </span>
                      </div>
                      <Link
                        to={`/dishes/${dish.id}`}
                        className="text-sm font-bold text-stone-900 hover:text-amber-700 transition-colors truncate block"
                      >
                        {dish.name}
                      </Link>
                      <p className="text-xs text-stone-500 line-clamp-1">
                        {dish.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="block text-[10px] text-stone-400">01 phần</span>
                        <span className="text-sm font-bold text-amber-700">
                          {formatVnd(dish.price)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => addDishToCalculator(dish)}
                        className="rounded-lg bg-amber-700 hover:bg-amber-800 text-white px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                      >
                        {draftItem ? `Đã chọn (${draftItem.portionsPerTable})` : 'Chọn món'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sticky: Luxury Banquet Calculator */}
        <aside className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-900">
                    Bảng Tính Bàn Tiệc
                  </h2>
                  <p className="text-[10px] text-stone-500 font-medium">
                    Giá 01 bàn × Số lượng bàn tiệc
                  </p>
                </div>
              </div>

              {draftLines.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDraftLines([])}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  title="Xóa toàn bộ món đã chọn"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Xóa
                </button>
              )}
            </div>

            {/* Selected dishes list */}
            {draftLines.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 p-5 text-center space-y-1.5">
                <Utensils className="h-6 w-6 text-stone-400 mx-auto" />
                <p className="text-xs font-medium text-stone-600">Chưa có món nào trong bàn tiệc</p>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Bấm nút <strong>Chọn món</strong> ở danh sách bên trái để thêm món vào bàn tiệc.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {draftLines.map((line) => (
                  <div
                    key={line.dish.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-stone-100 bg-stone-50 p-2.5 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stone-800 truncate">{line.dish.name}</p>
                      <p className="text-[11px] text-amber-700 font-medium">
                        {formatVnd(line.dish.price)} / phần
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updatePortion(line.dish.id, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center font-bold text-stone-800">
                        {line.portionsPerTable}
                      </span>
                      <button
                        type="button"
                        onClick={() => updatePortion(line.dish.id, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Calculations Breakdown */}
            <div className="border-t border-stone-100 pt-3.5 space-y-3">
              {/* Table Count Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="tableSlider" className="font-semibold text-stone-700 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-amber-700" />
                    <span>Quy mô bàn tiệc:</span>
                  </label>
                  <span className="text-xs font-bold text-amber-800 font-mono">
                    {tableCount} bàn (~{estimatedGuests} khách)
                  </span>
                </div>
                <input
                  id="tableSlider"
                  type="range"
                  min={1}
                  max={50}
                  value={tableCount}
                  onChange={(e) => setTableCount(Number(e.target.value))}
                  className="w-full accent-amber-700 cursor-pointer"
                />
              </div>

              {/* Subtotal 1 Table */}
              <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                <span>Đơn giá thực đơn 01 bàn:</span>
                <span className="font-semibold text-stone-800">{formatVnd(pricePerTable)}</span>
              </div>

              {/* Grand Total */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-900 uppercase tracking-wide">
                    Tổng tiền dự kiến ({tableCount} bàn):
                  </span>
                </div>
                <p className="text-xl font-extrabold text-amber-700 text-right tracking-tight">
                  {formatVnd(totalOrderPrice)}
                </p>
                <p className="text-[10px] text-stone-500 text-right">
                  Chưa bao gồm thuế/phí • Hỗ trợ thanh toán trực tuyến an toàn
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
