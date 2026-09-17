import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChefHat,
  CheckCircle2,
  Scale,
  ShieldCheck,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { extractErrorMessage } from '../services/apiClient';
import type { CategoryDto, DishSummaryDto } from '../services/types';
import { formatVnd } from '../hooks/useFormatters';
import { ErrorState, LoadingState } from '../components/StatusStates';
import { useAuth } from '../hooks/useAuth';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [featuredDishes, setFeaturedDishes] = useState<DishSummaryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, dishes] = await Promise.all([
        catalogService.getPublicCategories(),
        catalogService.getPublicDishes(),
      ]);
      setCategories(cats);
      setFeaturedDishes(dishes.slice(0, 6));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHomeData();
  }, []);

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-stone-900 text-white border-b border-stone-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-22">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Nền tảng Đặt Tiệc & Quản Lý Nhà Hàng Tích Hợp</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                Trải nghiệm đặt tiệc chuẩn vị Việt cùng{' '}
                <span className="text-amber-400">BanquetHub</span>
              </h1>
              <p className="text-base sm:text-lg text-stone-300 max-w-2xl leading-relaxed">
                Hệ thống quản trị thực đơn bàn tiệc minh bạch theo định lượng nguyên liệu thực tế.
                Khách hàng dễ dàng tra cứu món ăn, xem định mức thành phần cho mỗi phần món và xây
                dựng thực đơn chuẩn xác cho từng bàn tiệc.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/dishes"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-amber-500 transition-colors"
                >
                  <span>Khám phá thực đơn món tiệc</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {user?.role === 'ROLE_ADMIN' ? (
                  <Link
                    to="/admin/catalog"
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-700 bg-stone-800 px-5 py-3.5 text-sm font-semibold text-amber-300 hover:bg-stone-700 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Vào trang Quản trị Admin</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-700 bg-stone-800/90 px-5 py-3.5 text-sm font-semibold text-stone-200 hover:bg-stone-800 transition-colors"
                  >
                    <span>Đăng nhập tài khoản</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Key MVP Rules Summary Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-stone-800 bg-stone-950/80 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-white">Tiêu chuẩn vận hành BanquetHub</h2>
                    <p className="text-xs text-stone-400">Áp dụng theo đặc tả nghiệp vụ SRS-PARTY-001</p>
                  </div>
                  <ChefHat className="h-7 w-7 text-amber-500" />
                </div>
                <ul className="space-y-3 text-sm text-stone-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-1" />
                    <span>
                      <strong>Đơn giá chuẩn theo phần/bàn:</strong> Mỗi thực đơn tính cho 01 bàn; Tổng
                      tiền = Số bàn × Tổng giá các phần món trên 01 bàn.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Scale className="h-4 w-4 text-amber-400 shrink-0 mt-1" />
                    <span>
                      <strong>Định lượng công thức minh bạch:</strong> Mỗi món ăn gắn liền với danh
                      mục nguyên liệu và định lượng chuẩn (kg, lít...) cho 01 phần.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Utensils className="h-4 w-4 text-sky-400 shrink-0 mt-1" />
                    <span>
                      <strong>Đồng bộ tồn kho & thanh toán:</strong> Kiểm tra khả năng phục vụ theo
                      định lượng và giữ tồn nguyên liệu tự động khi đặt tiệc.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Strip */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Danh mục ẩm thực
            </span>
            <h2 className="text-2xl font-bold text-stone-900 mt-1">
              Thực đơn tiệc truyền thống & hiện đại
            </h2>
          </div>
          <Link
            to="/dishes"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-800"
          >
            <span>Xem toàn bộ danh mục</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingState label="Đang tải danh mục và món ăn tiêu biểu từ PostgreSQL..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadHomeData} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/dishes?categoryId=${cat.id}`}
                  className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs hover:border-amber-500 hover:shadow-md transition-all"
                >
                  <span className="inline-block rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 mb-3">
                    {cat.code}
                  </span>
                  <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-stone-500 line-clamp-2">
                    {cat.description || 'Các món ăn đặc sắc phục vụ bàn tiệc.'}
                  </p>
                </Link>
              ))}
            </div>

            {/* Featured Dishes */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-stone-900">Món tiệc tiêu biểu</h2>
                <p className="text-sm text-stone-600">
                  Dữ liệu trực tiếp từ Backend API (/api/v1/catalog/dishes)
                </p>
              </div>
              <Link
                to="/dishes"
                className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
              >
                Tất cả món ăn
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredDishes.map((dish) => (
                <article
                  key={dish.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xs hover:shadow-md transition-shadow"
                >
                  <div className="relative h-48 bg-stone-200 overflow-hidden">
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
                      <span className="font-mono font-medium">{dish.code}</span>
                      <span>{dish.ingredientCount} nguyên liệu định mức</span>
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 line-clamp-1">{dish.name}</h3>
                    <p className="mt-1.5 text-sm text-stone-600 line-clamp-2 flex-1">
                      {dish.description || 'Món ăn phục vụ theo tiêu chuẩn bàn tiệc 10 khách.'}
                    </p>

                    <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="block text-[11px] text-stone-500">Đơn giá / 01 phần</span>
                        <span className="text-lg font-extrabold text-amber-700">
                          {formatVnd(dish.price)}
                        </span>
                      </div>
                      <Link
                        to={`/dishes/${dish.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
                      >
                        <span>Xem chi tiết</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
