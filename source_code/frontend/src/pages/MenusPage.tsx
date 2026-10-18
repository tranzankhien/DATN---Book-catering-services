import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Utensils,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Sparkles,
  Calendar,
  ChefHat,
  Search,
  X,
  Info,
  Clock,
  Check,
  ShoppingBag,
} from 'lucide-react';
import { menuService } from '../services/menuService';
import type { MenuDto } from '../services/types';
import { formatVnd } from '../hooks/useFormatters';
import { LoadingState, ErrorState, EmptyState } from '../components/StatusStates';
import { extractErrorMessage } from '../services/apiClient';
import { DEFAULT_MENU_IMAGE, handleImageError } from '../lib/imageConstants';

export const MenusPage: React.FC = () => {
  const navigate = useNavigate();
  const [menus, setMenus] = useState<MenuDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState<string>('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await menuService.getActiveMenus();
        if (mounted) {
          setMenus(data);
        }
      } catch (err) {
        if (mounted) {
          setError(extractErrorMessage(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredMenus = useMemo(() => {
    let list = menus.filter((m) => {
      if (!keyword.trim()) return true;
      const kw = keyword.toLowerCase();
      return (
        m.name.toLowerCase().includes(kw) ||
        m.code.toLowerCase().includes(kw) ||
        (m.description && m.description.toLowerCase().includes(kw))
      );
    });

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.pricePerTable - b.pricePerTable);
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.pricePerTable - a.pricePerTable);
    }

    return list;
  }, [menus, keyword, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up-1">
      {/* Header Banner - Sang trọng đồng bộ với Phase 1/2 */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Bộ sưu tập thực đơn tiệc tiêu chuẩn</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Thực đơn tiệc mẫu định sẵn
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Các set menu được nghiên cứu kỹ lưỡng bởi bếp trưởng BanquetHub, cân bằng dinh dưỡng, phối vị hài hòa cho bàn tiệc 10 khách. Quý khách có thể chọn đặt ngay hoặc chuyển sang công cụ phối món để thay đổi theo khẩu vị riêng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/menu-builder"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition-all cursor-pointer"
            >
              <Sliders className="h-4 w-4" />
              <span>Tự phối thực đơn mới</span>
            </Link>
            <Link
              to="/dishes"
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-all shadow-xs"
            >
              <ChefHat className="h-4 w-4 text-stone-500" />
              <span>Khám phá món ăn</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Sort and Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên thực đơn, mã thực đơn..."
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

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs shadow-xs">
            <span className="text-stone-500 font-medium">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="default">Mặc định nhà hàng</option>
              <option value="price-asc">Đơn giá: Thấp → Cao</option>
              <option value="price-desc">Đơn giá: Cao → Thấp</option>
            </select>
          </div>

          <div className="text-xs text-stone-500 font-medium px-2">
            Hiển thị <span className="font-bold text-stone-900">{filteredMenus.length}</span> thực đơn
          </div>
        </div>
      </div>

      {/* States */}
      {loading && <LoadingState label="Đang tải danh sách thực đơn tiệc..." />}
      {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}

      {!loading && !error && filteredMenus.length === 0 && (
        <EmptyState
          title="Không tìm thấy thực đơn phù hợp"
          description="Hãy thử từ khóa tìm kiếm khác hoặc sử dụng công cụ tự phối thực đơn."
          action={
            <Link
              to="/menu-builder"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition-colors"
            >
              <Sliders className="h-4 w-4" />
              <span>Chuyển sang Tự phối món</span>
            </Link>
          }
        />
      )}

      {/* Menu Cards Grid */}
      {!loading && !error && filteredMenus.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenus.map((menu) => (
            <div
              key={menu.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-xs hover:border-amber-400 hover:shadow-lg transition-all duration-300"
            >
              {/* Image banner with robust fallback */}
              <div className="relative h-52 bg-stone-900 overflow-hidden select-none">
                <img
                  src={menu.imageUrl || DEFAULT_MENU_IMAGE}
                  alt=""
                  onError={handleImageError}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-stone-950/10 pointer-events-none" />

                {/* Floating Top Badges */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-200 bg-stone-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/30 shadow-xs">
                    {menu.code}
                  </span>
                  <span className="text-[11px] font-semibold text-stone-100 bg-stone-900/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20">
                    Set {menu.itemsCount} món
                  </span>
                </div>

                {/* Title over banner */}
                <div className="absolute bottom-3 left-4 right-4 z-10 text-white">
                  <h3 className="font-bold text-lg text-white group-hover:text-amber-300 transition-colors line-clamp-1 drop-shadow-sm">
                    {menu.name}
                  </h3>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-5 space-y-4">
                {menu.description ? (
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed min-h-[32px]">
                    {menu.description}
                  </p>
                ) : (
                  <p className="text-xs text-stone-400 italic min-h-[32px]">
                    Bộ thực đơn thiết kế chuẩn yến tiệc sang trọng
                  </p>
                )}

                {/* Dish snapshot preview */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    <span>Món trong bàn tiệc</span>
                    <span>Định mức</span>
                  </div>

                  <div className="space-y-1.5 rounded-xl bg-stone-50/80 p-3 border border-stone-100">
                    {menu.items.slice(0, 5).map((it) => (
                      <div key={it.id} className="flex items-center justify-between text-xs text-stone-700">
                        <span className="flex items-center gap-1.5 truncate">
                          <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{it.dishName}</span>
                        </span>
                        <span className="font-mono font-medium text-stone-500 text-[11px] ml-2 shrink-0">
                          x{it.quantityPerTable}
                        </span>
                      </div>
                    ))}
                    {menu.items.length > 5 && (
                      <div className="text-[11px] text-amber-800 font-semibold pt-1">
                        + {menu.items.length - 5} món tiếp theo...
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing & Actions */}
                <div className="pt-3 border-t border-stone-100 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="block text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                        Đơn giá bàn (10 khách)
                      </span>
                      <span className="text-xl font-bold text-amber-900 tracking-tight">
                        {formatVnd(menu.pricePerTable)}
                      </span>
                    </div>

                    <Link
                      to={`/menus/${menu.id}`}
                      className="text-xs font-semibold text-amber-800 hover:text-amber-900 transition-colors inline-flex items-center gap-1"
                    >
                      Chi tiết <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/checkout?menuId=${menu.id}`)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs py-2.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Đặt tiệc ngay</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/menu-builder?menuId=${menu.id}`)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-700/30 bg-amber-50/60 hover:bg-amber-100/80 text-amber-900 font-semibold text-xs py-2.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Sliders className="h-3.5 w-3.5 text-amber-700" />
                      <span>Tùy chỉnh món</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
