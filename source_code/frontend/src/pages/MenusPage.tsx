import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { menuService } from '../services/menuService';
import type { MenuDto } from '../services/types';
import { formatVnd } from '../hooks/useFormatters';
import { LoadingState, ErrorState, EmptyState } from '../components/StatusStates';
import { extractErrorMessage } from '../services/apiClient';

export const MenusPage: React.FC = () => {
  const navigate = useNavigate();
  const [menus, setMenus] = useState<MenuDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState<string>('');

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

  const filteredMenus = menus.filter((m) => {
    if (!keyword.trim()) return true;
    const kw = keyword.toLowerCase();
    return (
      m.name.toLowerCase().includes(kw) ||
      m.code.toLowerCase().includes(kw) ||
      (m.description && m.description.toLowerCase().includes(kw))
    );
  });

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-800 pb-20">
      {/* Hero section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-850 to-stone-900 text-amber-50 py-16 px-4 sm:px-6 lg:px-8 border-b border-amber-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Thực Đơn Tiệc Chuẩn Mực BanquetHub
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-white mb-4">
            Bộ Sưu Tập Thực Đơn Tiệc Đẳng Cấp
          </h1>
          <p className="max-w-2xl mx-auto text-stone-300 text-sm sm:text-base leading-relaxed">
            Tuyển chọn các set menu được thiết kế cân bằng dinh dưỡng, phối vị hài hòa bởi các bếp trưởng
            hàng đầu. Bạn có thể chọn ngay hoặc tùy chỉnh từng món theo phong cách riêng.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/menu-builder"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold shadow-lg shadow-amber-500/20 transition-all duration-200"
            >
              <Sliders className="w-4 h-4" />
              Tự Phối Thực Đơn Mới
            </Link>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 border border-amber-500/20 transition-all duration-200 font-medium"
            >
              <ChefHat className="w-4 h-4" />
              Xem Toàn Bộ Món Ăn
            </Link>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Search bar */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm kiếm thực đơn..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            />
          </div>
          <div className="text-sm text-stone-500 font-medium">
            Hiển thị <span className="font-semibold text-stone-900">{filteredMenus.length}</span> thực đơn
          </div>
        </div>

        {/* State handlers */}
        {loading && <LoadingState message="Đang tải danh sách thực đơn tiệc..." />}
        {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}

        {!loading && !error && filteredMenus.length === 0 && (
          <EmptyState
            title="Không tìm thấy thực đơn phù hợp"
            description="Hãy thử từ khóa tìm kiếm khác hoặc tự phối thực đơn mới theo ý thích."
            action={
              <Link
                to="/menu-builder"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-stone-950 font-semibold text-sm"
              >
                <Sliders className="w-4 h-4" />
                Đến Trang Phối Món
              </Link>
            }
          />
        )}

        {/* Menu grid */}
        {!loading && !error && filteredMenus.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMenus.map((menu) => (
              <div
                key={menu.id}
                className="bg-white rounded-2xl border border-stone-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Menu Image */}
                <div className="relative h-52 w-full overflow-hidden bg-stone-100">
                  <img
                    src={
                      menu.imageUrl ||
                      'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=80'
                    }
                    alt={menu.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-stone-900/80 backdrop-blur-sm text-amber-300 text-xs font-mono font-semibold tracking-wider border border-amber-500/30">
                    {menu.code}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="text-xs text-amber-300 uppercase tracking-widest font-semibold mb-0.5">
                      Thực đơn chuẩn ({menu.itemsCount} món)
                    </div>
                    <h3 className="font-serif text-lg font-bold line-clamp-1">{menu.name}</h3>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col">
                  {menu.description && (
                    <p className="text-stone-600 text-sm line-clamp-2 mb-4 leading-relaxed">
                      {menu.description}
                    </p>
                  )}

                  {/* Dishes list preview */}
                  <div className="mb-5 flex-1">
                    <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                      Danh sách món ăn:
                    </div>
                    <ul className="space-y-1.5 text-xs text-stone-700">
                      {menu.items.slice(0, 5).map((it) => (
                        <li key={it.id} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                            <span className="truncate">{it.dishName}</span>
                          </span>
                          <span className="text-stone-400 font-mono flex-shrink-0 ml-2">
                            x{it.quantityPerTable}
                          </span>
                        </li>
                      ))}
                      {menu.items.length > 5 && (
                        <li className="text-amber-700 font-medium text-xs pt-1">
                          + {menu.items.length - 5} món khác...
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Price & Actions */}
                  <div className="pt-4 border-t border-stone-100 mt-auto">
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="text-xs text-stone-500 font-medium">Giá mỗi bàn:</span>
                      <span className="text-lg font-bold font-serif text-amber-800">
                        {formatVnd(menu.pricePerTable)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => navigate(`/checkout?menuId=${menu.id}`)}
                        className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Đặt Ngay
                      </button>
                      <button
                        onClick={() => navigate(`/menu-builder?menuId=${menu.id}`)}
                        className="w-full py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs tracking-wide flex items-center justify-center gap-1.5 transition-colors border border-stone-200"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        Tùy Chỉnh
                      </button>
                    </div>

                    <Link
                      to={`/menus/${menu.id}`}
                      className="mt-3 block text-center text-xs text-stone-500 hover:text-amber-700 transition-colors"
                    >
                      Xem chi tiết thực đơn →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
