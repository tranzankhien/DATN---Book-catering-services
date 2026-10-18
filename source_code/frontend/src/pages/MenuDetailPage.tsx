import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Sliders,
  CheckCircle2,
  ChefHat,
  Users,
  Sparkles,
  UtensilsCrossed,
  Info,
  Check,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { menuService } from '../services/menuService';
import type { MenuDto } from '../services/types';
import { formatVnd } from '../hooks/useFormatters';
import { LoadingState, ErrorState } from '../components/StatusStates';
import { extractErrorMessage } from '../services/apiClient';
import { DEFAULT_MENU_IMAGE, DEFAULT_DISH_IMAGE, handleImageError } from '../lib/imageConstants';

export const MenuDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [menu, setMenu] = useState<MenuDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tableCount, setTableCount] = useState<number>(6);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await menuService.getMenuById(Number(id));
        if (mounted) {
          setMenu(data);
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
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <LoadingState label="Đang tải chi tiết thực đơn..." />
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 space-y-4">
        <ErrorState
          message={error || 'Không tìm thấy thực đơn.'}
          onRetry={() => window.location.reload()}
        />
        <div className="text-center">
          <Link
            to="/menus"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay lại danh sách thực đơn</span>
          </Link>
        </div>
      </div>
    );
  }

  const totalEstimate = menu.pricePerTable * tableCount;
  const estimatedGuests = tableCount * 10;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up-1">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 font-medium">
        <Link to="/" className="hover:text-stone-900 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link to="/menus" className="hover:text-stone-900 transition-colors">
          Thực đơn mẫu
        </Link>
        <span>/</span>
        <span className="font-semibold text-stone-900 truncate max-w-xs">{menu.name}</span>
      </nav>

      {/* Hero Showcase Card */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                {menu.code}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Thực đơn chuẩn ({menu.itemsCount} món)</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              {menu.name}
            </h1>

            {menu.description ? (
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {menu.description}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-stone-400 italic">
                Bộ thực đơn thiết kế chuẩn yến tiệc sang trọng
              </p>
            )}

            <div className="pt-2 flex flex-wrap items-baseline gap-4">
              <div>
                <span className="block text-[11px] text-stone-400 font-semibold uppercase tracking-wider">
                  Đơn giá bàn tiêu chuẩn (10 khách)
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-amber-900 tracking-tight">
                  {formatVnd(menu.pricePerTable)}
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 relative rounded-xl overflow-hidden bg-stone-900 aspect-video sm:aspect-4/3 shadow-sm border border-stone-200">
            <img
              src={menu.imageUrl || DEFAULT_MENU_IMAGE}
              alt={menu.name}
              onError={handleImageError}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Content: Dishes List on Left, Calculator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Dishes Breakdown (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-amber-700" />
                  <span>Danh sách món trong bàn tiệc</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Được thiết kế đầy đủ các món khai vị, món chính và tráng miệng theo chuẩn yến tiệc
                </p>
              </div>
              <span className="text-xs font-semibold text-stone-500">
                {menu.items.length} món ăn
              </span>
            </div>

            <div className="divide-y divide-stone-100">
              {menu.items.map((item, idx) => (
                <div key={item.id} className="py-4 flex items-center gap-4 hover:bg-stone-50/50 rounded-xl px-2 transition-colors">
                  <span className="w-6 text-center font-mono text-xs font-bold text-stone-400">
                    {idx + 1}
                  </span>

                  <div className="h-16 w-16 rounded-xl overflow-hidden bg-stone-900 shrink-0 border border-stone-200">
                    <img
                      src={item.dishImageUrl || DEFAULT_DISH_IMAGE}
                      alt={item.dishName}
                      onError={handleImageError}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-stone-400 font-semibold uppercase">
                        {item.dishCode}
                      </span>
                      {item.categoryName && (
                        <span className="rounded-md bg-stone-100 text-stone-600 px-2 py-0.5 text-[10px] font-semibold">
                          {item.categoryName}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-stone-900 text-sm truncate">
                      {item.dishName}
                    </h3>
                    <p className="text-xs text-stone-500">
                      Đơn giá món lẻ: <span className="font-semibold text-stone-700">{formatVnd(item.dishPrice)}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-stone-500">
                      {item.quantityPerTable} phần/bàn
                    </div>
                    <div className="font-bold text-sm text-stone-900">
                      {formatVnd(item.lineTotalPerTable)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Booking Box (4 Cols) */}
        <div className="lg:col-span-4 sticky top-24 space-y-5">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-stone-900 tracking-tight flex items-center gap-2 border-b border-stone-100 pb-3">
              <Calendar className="h-4 w-4 text-amber-700" />
              <span>Dự tính đặt tiệc</span>
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Quy mô bàn tiệc:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={tableCount}
                  onChange={(e) => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 rounded-xl border border-stone-300 py-2 text-center font-bold text-lg text-stone-900 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none shadow-xs"
                />
                <span className="text-xs text-stone-500">
                  Bàn tiệc (khoảng <strong className="text-stone-800">{estimatedGuests}</strong> khách)
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-stone-50 p-4 border border-stone-100 space-y-2.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Đơn giá 01 bàn:</span>
                <span className="font-semibold text-stone-900">{formatVnd(menu.pricePerTable)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Số lượng bàn tiệc:</span>
                <span className="font-semibold text-stone-900">{tableCount} bàn</span>
              </div>
              <div className="border-t border-stone-200 pt-2.5 flex justify-between items-baseline text-sm font-bold text-stone-900">
                <span>Tổng chi phí dự tính:</span>
                <span className="text-lg font-bold text-amber-900">
                  {formatVnd(totalEstimate)}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => navigate(`/checkout?menuId=${menu.id}&tables=${tableCount}`)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs py-3 shadow-xs transition-all cursor-pointer"
              >
                <Calendar className="h-4 w-4" />
                <span>Tiến hành đặt tiệc</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate(`/menu-builder?menuId=${menu.id}`)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-700/30 bg-amber-50/60 hover:bg-amber-100/80 text-amber-900 font-semibold text-xs py-2.5 shadow-xs transition-colors cursor-pointer"
              >
                <Sliders className="h-3.5 w-3.5 text-amber-700" />
                <span>Tùy biến thêm/bớt món</span>
              </button>
            </div>

            <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3.5 text-[11px] text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-950">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                <span>Khóa giữ nguyên liệu an toàn 15 phút</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Ngay khi hoàn tất tạo đơn, hệ thống sẽ tạm giữ đủ nguyên liệu trong kho để đảm bảo không bị thiếu hụt khi tổ chức tiệc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
