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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Bảng tính thử thực đơn bàn tiệc theo BR-01
  const [draftLines, setDraftLines] = useState<DraftMenuLine[]>([]);
  const [tableCount, setTableCount] = useState<number>(5);

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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Danh mục công khai (FR-CAT-01)
          </span>
          <h1 className="text-3xl font-extrabold text-stone-900 mt-1">
            Thực đơn & Món ăn nhà hàng BanquetHub
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Đơn giá niêm yết tính cho 01 phần/đĩa trên mỗi bàn tiệc. Bấm vào từng món để xem công
            thức nguyên liệu định mức.
          </p>
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên món, mã món..."
            className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 mr-1">
          <Filter className="h-3.5 w-3.5" />
          Danh mục:
        </span>
        <button
          type="button"
          onClick={() => handleSelectCategory(undefined)}
          className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
            selectedCategoryId === undefined
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          Tất cả danh mục
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleSelectCategory(cat.id)}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              selectedCategoryId === cat.id
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Dish Grid */}
        <div className="lg:col-span-8">
          {loading ? (
            <LoadingState label="Đang tải danh sách món ăn từ máy chủ..." />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchCatalog} />
          ) : dishes.length === 0 ? (
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
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 cursor-pointer"
                >
                  Xem lại toàn bộ món ăn
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {dishes.map((dish) => (
                <article
                  key={dish.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xs hover:shadow-md transition-shadow"
                >
                  <div className="relative h-48 bg-stone-200">
                    {dish.imageUrl ? (
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-stone-400">
                        <Utensils className="h-10 w-10" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 rounded-lg bg-stone-900/80 backdrop-blur-xs px-2.5 py-1 text-xs font-semibold text-amber-300">
                      {dish.categoryName}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                      <span className="font-mono">{dish.code}</span>
                      <span>{dish.ingredientCount} thành phần công thức</span>
                    </div>
                    <Link
                      to={`/dishes/${dish.id}`}
                      className="text-lg font-bold text-stone-900 hover:text-amber-700 transition-colors line-clamp-1"
                    >
                      {dish.name}
                    </Link>
                    <p className="mt-1.5 text-xs text-stone-600 line-clamp-2 flex-1">
                      {dish.description || 'Món tiệc truyền thống chế biến từ nguyên liệu tươi.'}
                    </p>

                    <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-[11px] text-stone-500">Giá 01 phần/bàn</span>
                        <span className="text-base font-extrabold text-amber-700">
                          {formatVnd(dish.price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => addDishToCalculator(dish)}
                          className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                          title="Thêm vào bảng tính thử thực đơn bàn tiệc"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Chọn thử</span>
                        </button>
                        <Link
                          to={`/dishes/${dish.id}`}
                          className="inline-flex items-center gap-1 rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
                        >
                          <span>Chi tiết</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Right: Banquet Table Price Estimator (BR-01) */}
        <aside className="lg:col-span-4 sticky top-22">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-900">
                    Bảng tính thử thực đơn bàn tiệc
                  </h2>
                  <p className="text-[11px] text-stone-500">Quy tắc BR-01: Giá 1 bàn × Số bàn</p>
                </div>
              </div>
              {draftLines.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDraftLines([])}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Xóa
                </button>
              )}
            </div>

            {draftLines.length === 0 ? (
              <div className="rounded-xl bg-stone-50 border border-dashed border-stone-200 p-4 text-center text-xs text-stone-500">
                Bấm nút <strong>+ Chọn thử</strong> ở các món bên trái để ước tính chi phí 01 bàn
                tiệc và tổng tiền theo số bàn.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {draftLines.map((line) => (
                  <div
                    key={line.dish.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50/70 p-2.5 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stone-900 truncate">{line.dish.name}</p>
                      <p className="text-stone-500">
                        {formatVnd(line.dish.price)} × {line.portionsPerTable} phần/bàn
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updatePortion(line.dish.id, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center font-bold text-stone-900">
                        {line.portionsPerTable}
                      </span>
                      <button
                        type="button"
                        onClick={() => updatePortion(line.dish.id, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-stone-200 pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="tableCountInput" className="font-semibold text-stone-700">
                  Số bàn tiệc dự kiến:
                </label>
                <input
                  id="tableCountInput"
                  type="number"
                  min={1}
                  max={200}
                  value={tableCount}
                  onChange={(e) => setTableCount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 rounded-lg border border-stone-300 px-2.5 py-1 text-right text-sm font-bold text-stone-900"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-stone-600">
                <span>Đơn giá thực đơn 01 bàn:</span>
                <span className="font-bold text-stone-900">{formatVnd(pricePerTable)}</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-3">
                <span className="text-xs font-bold text-amber-950">
                  Tổng tạm tính ({tableCount} bàn):
                </span>
                <span className="text-base font-extrabold text-amber-700">
                  {formatVnd(totalOrderPrice)}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
