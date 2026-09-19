import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChefHat,
  Scale,
  Sparkles,
  ShieldCheck,
  Utensils,
  Layers,
  Flame,
  Award,
  ChevronRight,
  CheckCircle2,
  Clock,
  Compass,
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
    <div className="space-y-24">
      {/* Grand Luxury Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
        {/* Background glow effects */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[550px] w-[900px] rounded-full bg-gradient-to-b from-amber-500/15 via-amber-700/5 to-transparent blur-3xl -z-10" />
        <div className="pointer-events-none absolute top-1/3 -left-40 h-80 w-80 rounded-full bg-amber-600/10 blur-3xl -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Sparkles className="h-4 w-4" />
                <span className="tracking-wide uppercase">Nghệ Thuật Bàn Tiệc Đẳng Cấp • Chuẩn Vị Việt</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-serif-luxury text-white tracking-tight leading-[1.15]">
                Tinh Hoa Yến Tiệc, <br />
                <span className="gold-gradient-text">Minh Bạch Định Lượng</span> Từng Bàn
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-stone-300 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                Nền tảng quản trị và đặt tiệc tích hợp đầu tiên kết nối trực tiếp công thức chế biến
                với kho nguyên liệu trung tâm. Khách hàng chủ động xây dựng thực đơn, tính toán chính
                xác chi phí theo bàn và theo dõi định mức tiêu hao nguyên liệu thực tế.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/dishes"
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 px-7 py-4 text-sm font-black text-stone-950 shadow-[0_0_30px_rgba(245,158,11,0.35)] hover:shadow-[0_0_40px_rgba(245,158,11,0.55)] hover:scale-103 transition-all"
                >
                  <Compass className="h-4 w-4" />
                  <span>Khám Phá Món & Bảng Tính Giá</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {user?.role === 'ROLE_ADMIN' ? (
                  <Link
                    to="/admin/catalog"
                    className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-stone-900/80 px-6 py-4 text-sm font-bold text-amber-300 hover:bg-stone-800 hover:border-amber-400 transition-all backdrop-blur-md"
                  >
                    <ShieldCheck className="h-4 w-4 text-amber-400" />
                    <span>Quản Trị Admin Panel</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-2xl border border-stone-800 bg-stone-900/80 px-6 py-4 text-sm font-bold text-stone-200 hover:bg-stone-800 hover:text-white transition-all backdrop-blur-md"
                  >
                    <span>Đăng Nhập Khách Hàng</span>
                  </Link>
                )}
              </div>

              {/* Quick Key Metrics */}
              <div className="pt-6 border-t border-stone-800/80 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-amber-400 font-serif-luxury">100%</p>
                  <p className="text-[11px] font-medium text-stone-400">Nguyên liệu tươi mới chuẩn hóa</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-amber-400 font-serif-luxury">01 Bàn</p>
                  <p className="text-[11px] font-medium text-stone-400">Đơn vị chuẩn hóa thực đơn tiệc</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-amber-400 font-serif-luxury">15 Phút</p>
                  <p className="text-[11px] font-medium text-stone-400">Giữ tồn tạm an toàn khi đặt đơn</p>
                </div>
              </div>
            </div>

            {/* Right Luxury Hero Showcase Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl border border-amber-500/30 bg-stone-900/80 p-3 shadow-2xl backdrop-blur-md gold-border-glow">
                <div className="relative h-96 sm:h-[430px] rounded-2xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85"
                    alt="Banquet Culinary Art"
                    className="h-full w-full object-cover brightness-90 hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

                  {/* Floating Badges */}
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-stone-950/80 backdrop-blur-md border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-300">
                    <Flame className="h-3.5 w-3.5 text-amber-400" />
                    <span>Món Đặc Biệt: Bò Hầm Tiêu Xanh</span>
                  </div>

                  <div className="absolute bottom-4 inset-x-4 rounded-2xl border border-stone-800/80 bg-stone-950/85 backdrop-blur-md p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400">Tiêu chuẩn thực đơn 01 bàn (10 khách)</span>
                      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 font-bold text-amber-300 border border-amber-500/30">
                        Quy tắc BR-01
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 leading-snug">
                      Tổng tiền = Số bàn × Giá thực đơn 01 bàn. Mỗi món ăn có định lượng nguyên liệu chuẩn xác (kg, lít) bảo đảm chất lượng đồng đều.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars of BanquetHub (SRS-PARTY-001) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Tiêu Chuẩn Vận Hành Độc Bản
          </span>
          <h2 className="text-3xl sm:text-4xl font-black font-serif-luxury text-white">
            Vì Sao Chọn Nền Tảng BanquetHub?
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
            Áp dụng triệt để các nguyên tắc nghiệp vụ trong đặc tả phần mềm MVP, kết hợp tính thẩm mỹ
            và độ chính xác tính toán mức cao nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="group rounded-3xl border border-stone-800/80 bg-stone-900/40 p-6 backdrop-blur-sm hover:border-amber-500/40 hover:bg-stone-900/80 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                <Scale className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                Minh Bạch Định Lượng (BR-02)
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Mỗi món ăn đi kèm công thức tiêu hao chuẩn cho 01 phần. Tự động nhân cấp theo số phần
                trên bàn và số lượng bàn tiệc.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-stone-800/60 flex items-center gap-1.5 text-[11px] font-semibold text-amber-400/80">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Chống thất thoát nguyên liệu</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="group rounded-3xl border border-stone-800/80 bg-stone-900/40 p-6 backdrop-blur-sm hover:border-amber-500/40 hover:bg-stone-900/80 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                Khóa Tồn Tạm 15 Phút (BR-04)
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Tồn khả dụng được tính toán theo thời gian thực (Tồn vật lý − Đang giữ). Tự giải phóng
                kho nếu đơn tiệc quá hạn chưa thanh toán.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-stone-800/60 flex items-center gap-1.5 text-[11px] font-semibold text-amber-400/80">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Không sợ trùng lặp đơn tiệc</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="group rounded-3xl border border-stone-800/80 bg-stone-900/40 p-6 backdrop-blur-sm hover:border-amber-500/40 hover:bg-stone-900/80 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                Trợ Lý Gợi Ý Thực Đơn AI
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Tích hợp AI Gemini phân tích bối cảnh tiệc (cưới hỏi, thôi nôi, liên hoan) để gợi ý
                tối đa 03 phương án thực đơn tối ưu chi phí.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-stone-800/60 flex items-center gap-1.5 text-[11px] font-semibold text-amber-400/80">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Chỉ dùng món có trong kho</span>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="group rounded-3xl border border-stone-800/80 bg-stone-900/40 p-6 backdrop-blur-sm hover:border-amber-500/40 hover:bg-stone-900/80 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                Bảo Vệ Lịch Sử Đơn Cũ (BR-05)
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Chốt bản sao giá và định lượng tại thời điểm tạo đơn. Sửa giá hoặc công thức sau này
                không bao giờ làm sai lệch báo cáo cũ.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-stone-800/60 flex items-center gap-1.5 text-[11px] font-semibold text-amber-400/80">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Toàn vẹn số liệu kế toán</span>
            </div>
          </div>
        </div>
      </section>

      {/* Culinary Categories Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Tuyển Tập Ẩm Thực
            </span>
            <h2 className="text-3xl font-black font-serif-luxury text-white mt-1">
              Phân Loại Danh Mục Món Tiệc
            </h2>
          </div>
          <Link
            to="/dishes"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {categories.map((cat, idx) => (
              <Link
                key={cat.id}
                to={`/dishes?categoryId=${cat.id}`}
                className="group relative overflow-hidden rounded-3xl border border-stone-800 bg-stone-900/60 p-5 hover:border-amber-500/50 hover:bg-stone-900/90 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400">
                    {cat.code}
                  </span>
                  <span className="text-xs font-bold text-stone-500 group-hover:text-amber-400 transition-colors">
                    #0{idx + 1}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  {cat.name}
                </h3>
                <p className="mt-1.5 text-xs text-stone-400 line-clamp-2 leading-relaxed">
                  {cat.description || 'Các món ăn tiêu chuẩn tiệc cưới & hội nghị.'}
                </p>
                <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-amber-400/80 group-hover:text-amber-400">
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Signature Dishes
            </span>
            <h2 className="text-3xl font-black font-serif-luxury text-white mt-1">
              Món Tiệc Hoàng Gia Nổi Bật
            </h2>
            <p className="mt-1 text-xs text-stone-400">
              Giá niêm yết tính cho 01 phần/đĩa phục vụ bàn tiệc tiêu chuẩn 10 khách
            </p>
          </div>
          <Link
            to="/dishes"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-800 bg-stone-900/80 px-4 py-2 text-xs font-bold text-stone-300 hover:text-white hover:border-amber-500/40 transition-all"
          >
            <span>Tất cả món ăn</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {featuredDishes.map((dish) => (
              <article
                key={dish.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-stone-800/80 bg-stone-900/50 hover:border-amber-500/40 hover:bg-stone-900/80 transition-all duration-300 shadow-xl"
              >
                {/* Image Area with hover zoom */}
                <div className="relative h-56 bg-stone-900 overflow-hidden">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-black/20" />

                  <span className="absolute top-3 left-3 rounded-xl bg-stone-950/80 backdrop-blur-md px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                    {dish.categoryName}
                  </span>

                  <span className="absolute top-3 right-3 rounded-lg bg-stone-900/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono text-stone-300 border border-stone-800">
                    {dish.code}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-6 space-y-4">
                  <div className="flex-1">
                    <Link
                      to={`/dishes/${dish.id}`}
                      className="text-lg font-bold text-white hover:text-amber-400 transition-colors line-clamp-1"
                    >
                      {dish.name}
                    </Link>
                    <p className="mt-2 text-xs text-stone-400 line-clamp-2 leading-relaxed">
                      {dish.description || 'Món ăn tiệc truyền thống phục vụ theo quy chuẩn 10 khách.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-800/60 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-stone-400">
                        Đơn giá / 01 phần
                      </span>
                      <span className="text-xl font-black text-amber-400 font-serif-luxury">
                        {formatVnd(dish.price)}
                      </span>
                    </div>

                    <Link
                      to={`/dishes/${dish.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-black text-stone-950 hover:from-amber-400 hover:to-amber-500 shadow-md shadow-amber-500/20 transition-all"
                    >
                      <span>Xem công thức</span>
                      <ArrowRight className="h-3.5 w-3.5" />
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
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-950 p-8 sm:p-14 text-center lg:text-left shadow-2xl">
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Sẵn Sàng Cho Bàn Tiệc Hoàn Hảo?
              </span>
              <h2 className="text-2xl sm:text-4xl font-black font-serif-luxury text-white">
                Tự Thiết Kế Thực Đơn Bàn Tiệc & Nhận Báo Giá Ngay
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
                Thử nghiệm bảng tính giá bàn tiệc theo thời gian thực (BR-01), xem định lượng nguyên
                liệu xuất kho (BR-02) và chuẩn bị cho quy trình thanh toán VNPAY Sandbox tự động.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <Link
                to="/dishes"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-4 text-xs font-black text-stone-950 shadow-lg shadow-amber-500/20 hover:scale-102 transition-all"
              >
                <Utensils className="h-4 w-4" />
                <span>Mở Bảng Tính Thực Đơn</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-700 bg-stone-900/80 px-6 py-4 text-xs font-bold text-stone-200 hover:bg-stone-800 transition-all"
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Đăng Ký Tài Khoản Tiệc</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
