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
} from 'lucide-react';
import { menuService } from '../services/menuService';
import type { MenuDto } from '../services/types';
import { formatVnd } from '../hooks/useFormatters';
import { LoadingState, ErrorState } from '../components/StatusStates';
import { extractErrorMessage } from '../services/apiClient';

export const MenuDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [menu, setMenu] = useState<MenuDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tableCount, setTableCount] = useState<number>(5);

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
      <div className="min-h-screen bg-[#faf8f5] py-20">
        <LoadingState message="Đang tải chi tiết thực đơn..." />
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="min-h-screen bg-[#faf8f5] py-20 max-w-4xl mx-auto px-4">
        <ErrorState
          message={error || 'Không tìm thấy thực đơn.'}
          onRetry={() => window.location.reload()}
        />
        <div className="mt-4 text-center">
          <Link to="/menus" className="text-amber-700 hover:underline text-sm">
            ← Quay lại danh sách thực đơn
          </Link>
        </div>
      </div>
    );
  }

  const totalEstimate = menu.pricePerTable * tableCount;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-800 pb-20">
      {/* Top Bar / Breadcrumb */}
      <div className="bg-stone-900 text-stone-300 py-3 px-4 sm:px-8 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/menus"
            className="inline-flex items-center gap-2 text-xs text-stone-300 hover:text-amber-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Tất Cả Thực Đơn
          </Link>
          <div className="text-xs font-mono text-amber-400 font-semibold">{menu.code}</div>
        </div>
      </div>

      {/* Hero header */}
      <div className="relative bg-gradient-to-b from-stone-900 to-stone-850 text-white py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-2">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider mb-3">
              Set Menu Chuẩn ({menu.itemsCount} món)
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-3">
              {menu.name}
            </h1>
            {menu.description && (
              <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-6">
                {menu.description}
              </p>
            )}

            <div className="flex flex-wrap items-baseline gap-6 text-sm">
              <div>
                <span className="text-stone-400 block text-xs">Đơn giá bàn:</span>
                <span className="text-2xl font-serif font-bold text-amber-400">
                  {formatVnd(menu.pricePerTable)}
                </span>
                <span className="text-xs text-stone-400"> / bàn 10 người</span>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-stone-700/50 aspect-video md:aspect-square">
            <img
              src={
                menu.imageUrl ||
                'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=80'
              }
              alt={menu.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dish list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
              <h2 className="text-lg font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-amber-600" />
                Danh Sách Món Ăn Trong Thực Đơn ({menu.items.length} món)
              </h2>

              <div className="divide-y divide-stone-100">
                {menu.items.map((item, idx) => (
                  <div key={item.id} className="py-4 flex items-center gap-4">
                    <span className="w-6 text-center text-xs font-mono font-bold text-stone-400">
                      {idx + 1}
                    </span>
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                      <img
                        src={
                          item.dishImageUrl ||
                          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'
                        }
                        alt={item.dishName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-stone-400 font-medium">
                          {item.dishCode}
                        </span>
                        {item.categoryName && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600">
                            {item.categoryName}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-stone-900 text-sm truncate">
                        {item.dishName}
                      </h4>
                      <p className="text-xs text-stone-500">
                        Đơn giá món: {formatVnd(item.dishPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-stone-500">x{item.quantityPerTable} phần/bàn</div>
                      <div className="font-semibold text-sm text-stone-900">
                        {formatVnd(item.lineTotalPerTable)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Summary Box */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm sticky top-6">
              <h3 className="text-base font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                Dự Tính Đặt Tiệc
              </h3>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
                  Số lượng bàn tiệc:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={tableCount}
                    onChange={(e) => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-3 py-2 border border-stone-300 rounded-xl text-center font-bold text-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-xs text-stone-500">
                    Bàn (Khoảng {tableCount * 10} khách)
                  </span>
                </div>
              </div>

              <div className="border-t border-b border-stone-100 py-3 space-y-2 text-xs mb-6">
                <div className="flex justify-between text-stone-600">
                  <span>Giá 1 bàn:</span>
                  <span className="font-semibold">{formatVnd(menu.pricePerTable)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Số bàn:</span>
                  <span className="font-semibold">{tableCount}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-100">
                  <span>Tổng tiền tiệc:</span>
                  <span className="text-amber-800 font-serif text-base">
                    {formatVnd(totalEstimate)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/checkout?menuId=${menu.id}&tables=${tableCount}`)}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  Tiến Hành Đặt Tiệc
                </button>
                <button
                  onClick={() => navigate(`/menu-builder?menuId=${menu.id}`)}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs tracking-wide flex items-center justify-center gap-2 transition-colors border border-stone-200"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Tùy Biến Thêm/Bớt Món Ăn
                </button>
              </div>

              <div className="mt-5 p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-xs text-amber-900 leading-relaxed">
                <div className="font-semibold flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                  Cam kết chất lượng
                </div>
                Nguyên liệu tươi sống được giữ trước 15 phút ngay sau khi tạo đơn. Không phụ thu phí dịch vụ bàn.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
