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

  // Bảng tính thử thực đơn bàn tiệc theo BR-01
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="rounded-3xl border border-stone-800 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 p-8 sm:p-12 relative overflow-hidden shadow-2xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Thực Đơn Công Khai & Định Mức Chuẩn Hóa</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-serif-luxury text-white tracking-tight">
              Danh Mục Món Tiệc Hoàng Gia
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Mỗi món ăn có đơn vị giá tính cho 01 phần trên mỗi bàn tiệc (chuẩn 10 khách). Bạn có
              thể bấm <strong>+ Chọn vào bàn tiệc</strong> để mô phỏng tính giá toàn bộ tiệc theo
              quy tắc <strong>BR-01</strong> tại thanh bên phải.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-stone-950/80 border border-stone-800 rounded-2xl p-3 text-xs text-stone-300 shrink-0">
            <Info className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Tiêu chuẩn tiệc: 01 bàn = 10 khách</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên món, mã món (VD: Tôm sú, Gỏi ngó sen...)"
              className="w-full rounded-2xl border border-stone-800 bg-stone-900/80 pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder:text-stone-400 focus:border-amber-500 focus:outline-none shadow-inner"
            />
          </div>

          {/* Controls: Sort and View mode */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-stone-800 bg-stone-900/80 px-3 py-2 text-xs">
              <span className="text-stone-400">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="default" className="bg-stone-900 text-white">Mặc định danh mục</option>
                <option value="price-asc" className="bg-stone-900 text-white">Giá: Thấp đến Cao</option>
                <option value="price-desc" className="bg-stone-900 text-white">Giá: Cao đến Thấp</option>
                <option value="name" className="bg-stone-900 text-white">Tên món: A → Z</option>
              </select>
            </div>

            <div className="flex items-center rounded-2xl border border-stone-800 bg-stone-900/80 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-xl p-2 transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
                }`}
                title="Dạng lưới"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded-xl p-2 transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
                }`}
                title="Dạng danh sách"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-400 mr-1">
            <Filter className="h-3.5 w-3.5 text-amber-400" />
            Danh mục:
          </span>

          <button
            type="button"
            onClick={() => handleSelectCategory(undefined)}
            className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              selectedCategoryId === undefined
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-500/20'
                : 'border border-stone-800 bg-stone-900/60 text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            Tất cả danh mục ({dishes.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                selectedCategoryId === cat.id
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'border border-stone-800 bg-stone-900/60 text-stone-300 hover:bg-stone-800 hover:text-white'
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
                  className="rounded-2xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 cursor-pointer shadow-md"
                >
                  Xem lại toàn bộ món ăn
                </button>
              }
            />
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {sortedDishes.map((dish) => {
                const draftItem = draftLines.find((l) => l.dish.id === dish.id);
                return (
                  <article
                    key={dish.id}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-stone-800/80 bg-stone-900/50 hover:border-amber-500/40 hover:bg-stone-900/80 transition-all duration-300 shadow-xl"
                  >
                    <div className="relative h-52 bg-stone-900 overflow-hidden">
                      {dish.imageUrl ? (
                        <img
                          src={dish.imageUrl}
                          alt={dish.name}
                          className="h-full w-full object-cover group-hover:scale-108 transition-transform duration-700 brightness-95"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-stone-600">
                          <Utensils className="h-12 w-12" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-black/20" />

                      <span className="absolute top-3 left-3 rounded-xl bg-stone-950/80 backdrop-blur-md px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                        {dish.categoryName}
                      </span>

                      <span className="absolute top-3 right-3 rounded-lg bg-stone-900/80 backdrop-blur-md px-2 py-0.5 text-[11px] font-mono text-stone-300 border border-stone-800">
                        {dish.code}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-6 space-y-4">
                      <div className="flex-1">
                        <Link
                          to={`/dishes/${dish.id}`}
                          className="text-base sm:text-lg font-bold text-white hover:text-amber-400 transition-colors line-clamp-1"
                        >
                          {dish.name}
                        </Link>
                        <p className="mt-1.5 text-xs text-stone-400 line-clamp-2 leading-relaxed">
                          {dish.description || 'Món ăn tiệc tiêu chuẩn phục vụ 10 khách.'}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-stone-800/60 flex items-center justify-between gap-3">
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-stone-400">
                            Giá / 01 phần
                          </span>
                          <span className="text-lg font-black text-amber-400 font-serif-luxury">
                            {formatVnd(dish.price)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => addDishToCalculator(dish)}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition-all cursor-pointer ${
                              draftItem
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                : 'bg-stone-800 text-stone-200 hover:bg-stone-700 hover:text-white border border-stone-700'
                            }`}
                            title="Thêm món này vào bàn tiệc dự tính"
                          >
                            {draftItem ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-amber-400" />
                                <span>Đã chọn ({draftItem.portionsPerTable})</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                <span>+ Chọn món</span>
                              </>
                            )}
                          </button>

                          <Link
                            to={`/dishes/${dish.id}`}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-stone-800 text-stone-300 hover:bg-amber-500 hover:text-stone-950 transition-colors"
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
            <div className="space-y-4">
              {sortedDishes.map((dish) => {
                const draftItem = draftLines.find((l) => l.dish.id === dish.id);
                return (
                  <article
                    key={dish.id}
                    className="flex flex-col sm:flex-row items-center gap-4 rounded-3xl border border-stone-800/80 bg-stone-900/50 p-4 hover:border-amber-500/40 hover:bg-stone-900/80 transition-all shadow-md"
                  >
                    <div className="h-24 w-28 shrink-0 rounded-2xl overflow-hidden bg-stone-900">
                      {dish.imageUrl ? (
                        <img
                          src={dish.imageUrl}
                          alt={dish.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-stone-600">
                          <Utensils className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="rounded-md bg-stone-800 px-2 py-0.5 text-[10px] font-mono text-stone-400">
                          {dish.code}
                        </span>
                        <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                          {dish.categoryName}
                        </span>
                      </div>
                      <Link
                        to={`/dishes/${dish.id}`}
                        className="text-base font-bold text-white hover:text-amber-400 transition-colors truncate block"
                      >
                        {dish.name}
                      </Link>
                      <p className="text-xs text-stone-400 line-clamp-1">
                        {dish.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="block text-[10px] text-stone-400">01 phần</span>
                        <span className="text-base font-black text-amber-400 font-serif-luxury">
                          {formatVnd(dish.price)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => addDishToCalculator(dish)}
                        className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-black text-stone-950 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer shadow-sm"
                      >
                        {draftItem ? `Đã chọn (${draftItem.portionsPerTable})` : '+ Chọn món'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sticky: Luxury Banquet Calculator (BR-01) */}
        <aside className="lg:col-span-4 sticky top-28 space-y-4">
          <div className="rounded-3xl border border-amber-500/30 bg-stone-900/95 backdrop-blur-xl p-6 shadow-2xl space-y-5 gold-border-glow">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 shadow-md">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white font-serif-luxury">
                    Bảng Tính Bàn Tiệc Hoàng Gia
                  </h2>
                  <p className="text-[10px] text-amber-400 font-medium">Quy tắc BR-01: Giá 01 bàn × Số bàn</p>
                </div>
              </div>

              {draftLines.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDraftLines([])}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  title="Xóa toàn bộ món đã chọn"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Xóa
                </button>
              )}
            </div>

            {/* Selected dishes list */}
            {draftLines.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-800 bg-stone-950/60 p-6 text-center space-y-2">
                <Utensils className="h-7 w-7 text-stone-600 mx-auto" />
                <p className="text-xs font-medium text-stone-400">Chưa có món nào trong bàn tiệc</p>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Bấm nút <strong>+ Chọn món</strong> ở danh sách bên trái để thêm món vào bàn tiệc.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {draftLines.map((line) => (
                  <div
                    key={line.dish.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-stone-800/80 bg-stone-950/70 p-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white truncate">{line.dish.name}</p>
                      <p className="text-[11px] text-amber-400">
                        {formatVnd(line.dish.price)} / phần
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updatePortion(line.dish.id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800 hover:text-white cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-white">
                        {line.portionsPerTable}
                      </span>
                      <button
                        type="button"
                        onClick={() => updatePortion(line.dish.id, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800 hover:text-white cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Calculations Breakdown */}
            <div className="border-t border-stone-800 pt-4 space-y-3.5">
              {/* Table Count Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="tableSlider" className="font-bold text-stone-300 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-amber-400" />
                    <span>Quy mô bàn tiệc:</span>
                  </label>
                  <span className="text-sm font-black text-amber-400 font-mono">
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
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Subtotal 1 Table */}
              <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
                <span>Đơn giá thực đơn 01 bàn:</span>
                <span className="font-bold text-stone-200">{formatVnd(pricePerTable)}</span>
              </div>

              {/* Grand Total */}
              <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-stone-900 to-amber-500/5 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Tổng tiền dự kiến ({tableCount} bàn):
                  </span>
                </div>
                <p className="text-2xl font-black text-amber-400 font-serif-luxury text-right">
                  {formatVnd(totalOrderPrice)}
                </p>
                <p className="text-[10px] text-stone-400 text-right">
                  Chưa bao gồm thuế/phí dịch vụ • Trả trước 100% qua VNPAY ở Phase 4
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
