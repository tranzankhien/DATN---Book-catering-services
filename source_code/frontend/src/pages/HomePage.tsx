import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Scale,
  Sparkles,
  Utensils,
  Layers,
  Flame,
  ChevronRight,
  CheckCircle2,
  Clock,
  Compass,
  CalendarCheck,
  Calculator,
  Award,
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
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Luxury Hero Section with Taste-Skill Inspired Entrance Motion */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content (Staggered Animation Entrance) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge with gentle pulse */}
              <div className="animate-fade-up-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/90 bg-amber-50 px-4 py-1.5 text-xs font-semibold text-amber-900 shadow-xs">
                  <Sparkles className="h-3.5 w-3.5 text-amber-700 animate-spin" style={{ animationDuration: '8s' }} />
                  <span>Nghệ Thuật Ẩm Thực Yến Tiệc & Hội Nghị Cao Cấp</span>
                </div>
              </div>

              {/* Headline */}
              <h1 className="animate-fade-up-2 text-3xl sm:text-5xl lg:text-5xl font-extrabold text-stone-900 tracking-tight leading-[1.18]">
                Tinh Hoa Yến Tiệc, <br />
                <span className="text-amber-700 underline decoration-amber-300 decoration-wavy decoration-from-font">
                  Minh Bạch Định Lượng
                </span> Từng Bàn
              </h1>

              {/* Subtitle */}
              <p className="animate-fade-up-3 text-sm sm:text-base text-stone-600 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                Nền tảng đặt tiệc và quản lý nhà hàng thông minh kết nối trực tiếp công thức món ăn
                với kho nguyên liệu trung tâm. Khách hàng chủ động chọn món, tính đúng chi phí theo quy chuẩn 1 bàn
                và theo dõi định mức tiêu hao nguyên liệu thực tế.
              </p>

              {/* Action Buttons (Strictly Guest-Focused: NO ADMIN BUTTONS HERE) */}
              <div className="animate-fade-up-4 flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  to="/dishes"
                  className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-700 hover:from-amber-800 hover:to-amber-900 text-white px-6 py-3.5 text-sm font-bold shadow-md shadow-amber-900/10 hover:shadow-lg transition-all"
                >
                  <Compass className="h-4 w-4" />
                  <span>Khám Phá Món & Bảng Tính Giá</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/dishes"
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-400 transition-colors shadow-xs"
                >
                  <Calculator className="h-4 w-4 text-amber-700" />
                  <span>Mô Phỏng Chi Phí Bàn Tiệc</span>
                </Link>
              </div>

              {/* Key Hospitality Metrics */}
              <div className="animate-fade-up-4 pt-6 border-t border-stone-200 grid grid-cols-3 gap-6 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">100%</p>
                  <p className="text-xs font-medium text-stone-500 mt-0.5">Nguyên liệu chuẩn tươi</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">01 Bàn</p>
                  <p className="text-xs font-medium text-stone-500 mt-0.5">Quy chuẩn 10 khách</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">15 Phút</p>
                  <p className="text-xs font-medium text-stone-500 mt-0.5">Giữ chỗ an toàn khi đặt</p>
                </div>
              </div>
            </div>

            {/* Right Hero Showcase Card (Floating Ambient Elevation) */}
            <div className="lg:col-span-5 relative animate-hero-showcase">
              <div className="animate-float-subtle">
                <div className="rounded-2xl border border-stone-200/90 bg-white p-2.5 shadow-xl shadow-stone-900/8 transition-all hover:shadow-2xl">
                  <div className="relative h-80 sm:h-96 rounded-xl overflow-hidden bg-stone-100">
                    <img
                      src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85"
                      alt="Banquet Culinary Art"
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-transparent to-transparent" />

                    {/* Floating Badges */}
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-white/95 backdrop-blur-sm border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-900 shadow-sm">
                      <Flame className="h-3.5 w-3.5 text-amber-600" />
                      <span>Món Đặc Biệt: Sườn Bò Nướng Sốt Tiêu Xanh</span>
                    </div>

                    <div className="absolute bottom-3 inset-x-3 rounded-xl border border-white/20 bg-stone-900/90 backdrop-blur-md p-3.5 text-white space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-amber-300">Tiêu chuẩn thực đơn 01 bàn (10 khách)</span>
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          Định mức chuẩn
                        </span>
                      </div>
                      <p className="text-xs text-stone-300 leading-snug">
                        Tổng tiền = Số bàn × Giá 01 bàn. Định lượng nguyên liệu chi tiết cho từng phần ăn, tươi mới chuẩn hóa.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars of BanquetHub */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Tiêu Chuẩn Vận Hành Độc Bản
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Vì Sao Chọn Nền Tảng BanquetHub?
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Quy chuẩn yến tiệc chuyên nghiệp, đảm bảo định lượng minh bạch và trải nghiệm dịch vụ đẳng cấp nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Pillar 1 */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200 group-hover:bg-amber-100 transition-colors">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Minh Bạch Định Lượng Từng Món
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Mỗi món ăn đi kèm công thức tiêu hao chuẩn cho 01 phần. Tự động nhân cấp theo số phần
                trên bàn và số lượng bàn tiệc.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Chống thất thoát nguyên liệu</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200 group-hover:bg-amber-100 transition-colors">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Giữ Chỗ Tạm 15 Phút Khi Đặt Tiệc
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Tồn khả dụng được tính toán theo thời gian thực (Tồn vật lý − Đang giữ). Tự giải phóng
                kho nếu đơn tiệc quá hạn chưa hoàn tất.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Không sợ trùng lặp đơn tiệc</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200 group-hover:bg-amber-100 transition-colors">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Trợ Lý Gợi Ý Thực Đơn Thông Minh
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Hệ thống phân tích bối cảnh tiệc (cưới hỏi, thôi nôi, liên hoan) để gợi ý
                các phương án thực đơn tối ưu chi phí và hương vị.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Chỉ dùng món có trong kho</span>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200 group-hover:bg-amber-100 transition-colors">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Bảo Đảm Giá Cố Định Theo Hợp Đồng
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Chốt bản sao giá và định lượng tại thời điểm tạo đơn. Thay đổi giá thị trường sau này
                không bao giờ làm ảnh hưởng đến đơn đã đặt.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Toàn vẹn số liệu minh bạch</span>
            </div>
          </div>
        </div>
      </section>

      {/* Culinary Categories Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Tuyển Tập Ẩm Thực
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1">
              Phân Loại Danh Mục Món Tiệc
            </h2>
          </div>
          <Link
            to="/dishes"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors"
          >
            <span>Xem toàn bộ thực đơn</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingState label="Đang tải dữ liệu ẩm thực..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadHomeData} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((cat, idx) => (
              <Link
                key={cat.id}
                to={`/dishes?categoryId=${cat.id}`}
                className="group rounded-xl border border-stone-200 bg-white p-4 shadow-xs hover:border-amber-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-mono font-bold text-stone-600">
                    {cat.code}
                  </span>
                  <span className="text-xs font-bold text-stone-400 group-hover:text-amber-700 transition-colors">
                    #0{idx + 1}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                  {cat.name}
                </h3>
                <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed">
                  {cat.description || 'Các món ăn tiêu chuẩn tiệc cưới & hội nghị.'}
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-amber-700 group-hover:text-amber-800">
                  <span>Khám phá món</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Signature Dishes Showcase */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Món Ăn Nổi Bật
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1">
              Thực Đơn Tiệc Đặc Sắc
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Giá niêm yết tính cho 01 phần phục vụ bàn tiệc tiêu chuẩn 10 khách
            </p>
          </div>
          <Link
            to="/dishes"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-400 transition-all shadow-xs"
          >
            <span>Tất cả món ăn</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDishes.map((dish) => (
              <article
                key={dish.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white hover:border-amber-300 hover:shadow-md transition-all shadow-xs"
              >
                {/* Image Area */}
                <div className="relative h-48 bg-stone-100 overflow-hidden">
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

                  <span className="absolute top-2.5 left-2.5 rounded-lg bg-white/95 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-stone-800 shadow-xs border border-stone-200">
                    {dish.categoryName}
                  </span>

                  <span className="absolute top-2.5 right-2.5 rounded bg-stone-900/80 backdrop-blur-sm px-2 py-0.5 text-[10px] font-mono font-medium text-stone-200">
                    {dish.code}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4 sm:p-5 space-y-3">
                  <div className="flex-1">
                    <Link
                      to={`/dishes/${dish.id}`}
                      className="text-base font-bold text-stone-900 hover:text-amber-700 transition-colors line-clamp-1"
                    >
                      {dish.name}
                    </Link>
                    <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {dish.description || 'Món ăn tiệc truyền thống phục vụ theo quy chuẩn 10 khách.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-semibold text-stone-400 uppercase">
                        Giá / 01 phần
                      </span>
                      <span className="text-base sm:text-lg font-bold text-amber-700">
                        {formatVnd(dish.price)}
                      </span>
                    </div>

                    <Link
                      to={`/dishes/${dish.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-stone-100 hover:bg-amber-50 hover:text-amber-800 px-3 py-2 text-xs font-semibold text-stone-700 transition-colors"
                    >
                      <span>Xem chi tiết</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Banquet Consultation CTA Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-stone-200 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 p-6 sm:p-10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Sẵn Sàng Cho Bàn Tiệc Hoàn Hảo?
              </span>
              <h2 className="text-xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                Tự Thiết Kế Thực Đơn Bàn Tiệc & Nhận Báo Giá Ngay
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl">
                Thử nghiệm bảng tính giá bàn tiệc theo thời gian thực, xem định lượng nguyên
                liệu xuất kho chi tiết và trải nghiệm quy trình đặt tiệc trực tuyến tiện lợi.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <Link
                to="/dishes"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-5 py-3 text-xs font-semibold shadow-xs transition-colors"
              >
                <Utensils className="h-4 w-4" />
                <span>Mở Bảng Tính Thực Đơn</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors shadow-xs"
              >
                <CalendarCheck className="h-4 w-4 text-amber-700" />
                <span>Đăng Ký Thành Viên</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
