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
  ChevronLeft,
  CheckCircle2,
  Clock,
  Compass,
  CalendarCheck,
  Calculator,
  ChefHat,
  Award,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { extractErrorMessage } from '../services/apiClient';
import type { CategoryDto, DishSummaryDto } from '../services/types';
import { formatVnd } from '../hooks/useFormatters';
import { ErrorState, LoadingState } from '../components/StatusStates';

// Cấu hình theme màu và ánh sáng background linh hoạt theo từng món ăn
interface DishTheme {
  categoryLabel: string;
  badgeStyle: string;
  bgSection: string;
  glowGradient: string;
  secondaryGlow: string;
  ringColor: string;
  accentText: string;
}

const getDishTheme = (dish: { name?: string; categoryName?: string }): DishTheme => {
  const cat = (dish.categoryName || '').toLowerCase();
  const name = (dish.name || '').toLowerCase();

  if (cat.includes('khai vị') || cat.includes('gỏi') || name.includes('gỏi')) {
    return {
      categoryLabel: 'Khai Vị Hoàng Gia',
      badgeStyle: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      bgSection: 'from-emerald-50/70 via-amber-50/40 to-stone-50',
      glowGradient: 'from-emerald-400/30 to-teal-300/15',
      secondaryGlow: 'from-amber-300/30 to-emerald-200/20',
      ringColor: 'ring-emerald-500/40',
      accentText: 'text-emerald-800',
    };
  }
  if (cat.includes('lẩu') || cat.includes('canh') || name.includes('lẩu')) {
    return {
      categoryLabel: 'Lẩu Thảo Mộc & Tiềm',
      badgeStyle: 'bg-rose-50 text-rose-900 border-rose-200',
      bgSection: 'from-rose-50/70 via-amber-50/40 to-stone-50',
      glowGradient: 'from-rose-400/30 to-amber-400/20',
      secondaryGlow: 'from-orange-300/30 to-rose-200/20',
      ringColor: 'ring-rose-500/40',
      accentText: 'text-rose-800',
    };
  }
  if (name.includes('bò') || cat.includes('thịt')) {
    return {
      categoryLabel: 'Món Thịt & Bò Thượng Hạng',
      badgeStyle: 'bg-amber-100/80 text-amber-950 border-amber-300',
      bgSection: 'from-orange-100/60 via-stone-50/70 to-stone-50',
      glowGradient: 'from-amber-600/30 to-orange-400/20',
      secondaryGlow: 'from-amber-300/30 to-amber-200/20',
      ringColor: 'ring-amber-500/40',
      accentText: 'text-amber-800',
    };
  }
  if (cat.includes('hải sản') || name.includes('tôm') || name.includes('mực') || name.includes('cá')) {
    return {
      categoryLabel: 'Hải Sản Tươi Sống',
      badgeStyle: 'bg-sky-50 text-sky-900 border-sky-200',
      bgSection: 'from-sky-50/60 via-amber-50/30 to-stone-50',
      glowGradient: 'from-sky-400/25 to-amber-300/15',
      secondaryGlow: 'from-cyan-300/20 to-sky-100/20',
      ringColor: 'ring-sky-500/40',
      accentText: 'text-sky-800',
    };
  }
  // Mặc định: Gà ta xôi sen, món yến tiệc cung đình
  return {
    categoryLabel: 'Mỹ Vị Yến Tiệc',
    badgeStyle: 'bg-amber-50 text-amber-900 border-amber-200',
    bgSection: 'from-amber-100/70 via-orange-50/40 to-stone-50',
    glowGradient: 'from-amber-500/30 to-yellow-300/20',
    secondaryGlow: 'from-amber-200/30 to-orange-100/20',
    ringColor: 'ring-amber-500/40',
    accentText: 'text-amber-800',
  };
};

// Dữ liệu fallback cho Hero Carousel nếu chưa tải xong dữ liệu từ API
const defaultHeroDishes = [
  {
    id: 1,
    name: 'Gỏi Củ Hủ Dừa Tôm Thịt Hoàng Gia',
    categoryName: 'Món Khai Vị & Gỏi',
    price: 260000,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85',
    description: 'Khai vị truyền thống thanh mát, tôm sú tươi ngọt kết hợp củ hủ dừa giòn thơm.',
    highlight: 'Khai vị truyền thống thanh mát, tôm sú tươi ngọt kết hợp củ hủ dừa giòn thơm.',
  },
  {
    id: 7,
    name: 'Gà Ta Hấp Lá Chanh Xôi Hạt Sen',
    categoryName: 'Thịt & Gia Cầm Đặc Sắc',
    price: 390000,
    imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=1200&q=85',
    description: 'Gà thả vườn hấp chín tới da giòn thịt ngọt, xôi hạt sen Huế dẻo bùi thơm lừng.',
    highlight: 'Gà thả vườn hấp chín tới da giòn thịt ngọt, xôi hạt sen Huế dẻo bùi thơm lừng.',
  },
  {
    id: 9,
    name: 'Lẩu Hải Sản Chua Cay Thập Cẩm',
    categoryName: 'Món Lẩu & Canh Tiềm',
    price: 520000,
    imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85',
    description: 'Nước lẩu đậm đà tròn vị, mực ống giòn sần sật, tôm sú và cá chẽm phi lê tươi ngon.',
    highlight: 'Nước lẩu đậm đà tròn vị, mực ống giòn sần sật, tôm sú và cá chẽm phi lê tươi ngon.',
  },
  {
    id: 5,
    name: 'Bò Úc Hầm Tiêu Xanh Bánh Mì',
    categoryName: 'Thịt & Gia Cầm Đặc Sắc',
    price: 450000,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85',
    description: 'Thịt bò mềm tan trong miệng, sốt tiêu xanh Phú Quốc nồng nàn ấm áp.',
    highlight: 'Thịt bò mềm tan trong miệng, sốt tiêu xanh Phú Quốc nồng nàn ấm áp.',
  },
];

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [featuredDishes, setFeaturedDishes] = useState<DishSummaryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Carousel State cho Hero Section
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

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

  // Danh sách các món chạy trong Carousel
  const carouselItems = featuredDishes.length >= 3 ? featuredDishes : defaultHeroDishes;

  // Auto-play vòng tròn sau mỗi 4.2 giây
  useEffect(() => {
    if (isPaused || carouselItems.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [isPaused, carouselItems.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  // Tính toán 3 món hiển thị cùng lúc trên quỹ đạo xoay (Orbit)
  const prevIndex = (currentSlide - 1 + carouselItems.length) % carouselItems.length;
  const nextIndex = (currentSlide + 1) % carouselItems.length;

  const prevDish = carouselItems[prevIndex] || carouselItems[0];
  const activeDish = carouselItems[currentSlide] || carouselItems[0];
  const nextDish = carouselItems[nextIndex] || carouselItems[0];

  const activeTheme = getDishTheme(activeDish);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Luxury Hero Section with Rotary Orbit Showcase & Dynamic Atmospheric Background */}
      <section
        className={`relative overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-22 transition-all duration-1000 ease-in-out bg-gradient-to-br ${activeTheme.bgSection}`}
      >
        {/* Dynamic Atmospheric Blurred Orbs & Ambient Culinary Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Main Ambient Glow Orb (morphs dynamically with active dish) */}
          <div
            className={`absolute -top-24 -right-24 w-[580px] h-[580px] rounded-full blur-3xl opacity-60 transition-all duration-1000 ease-in-out bg-gradient-to-br ${activeTheme.glowGradient} animate-pulse-glow`}
          />
          {/* Secondary Ambient Accent Orb */}
          <div
            className={`absolute top-1/2 right-1/4 w-[380px] h-[380px] rounded-full blur-2xl opacity-45 transition-all duration-1000 ease-in-out bg-gradient-to-tr ${activeTheme.secondaryGlow}`}
          />
          {/* Diffused ambient photo of active dish */}
          {activeDish.imageUrl && (
            <img
              key={`ambient-${activeDish.id}`}
              src={activeDish.imageUrl}
              alt=""
              className="absolute right-0 top-1/3 -translate-y-1/2 w-[520px] h-[520px] object-cover rounded-full blur-[115px] opacity-25 pointer-events-none select-none transition-all duration-1000"
            />
          )}
          {/* Subtle Radial Dot Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(#d6d3d1_1px,transparent_1px)] [background-size:24px_24px] opacity-35" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Content (Staggered Animation Entrance) */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="animate-fade-up-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/90 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-amber-900 shadow-xs">
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

              {/* Action Buttons (Strictly Guest-Focused) */}
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
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white/90 backdrop-blur-sm px-5 py-3.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-400 transition-colors shadow-xs"
                >
                  <Calculator className="h-4 w-4 text-amber-700" />
                  <span>Mô Phỏng Chi Phí Bàn Tiệc</span>
                </Link>
              </div>

              {/* Key Hospitality Metrics */}
              <div className="animate-fade-up-4 pt-6 border-t border-stone-200/80 grid grid-cols-3 gap-6 max-w-lg mx-auto lg:mx-0 text-left">
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

            {/* Right Hero: Orbital 3-Card Revolving Showcase */}
            <div
              className="lg:col-span-6 relative h-[490px] sm:h-[530px] w-full flex items-center justify-center animate-hero-showcase select-none"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Background SVG Orbital Track (Curved trajectory with direction arrows) */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none select-none"
                viewBox="0 0 540 500"
                fill="none"
              >
                {/* Orbital Arc Sweeping from Top to Center to Bottom */}
                <path
                  d="M 390 50 C 500 130, 510 360, 370 450"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="6 8"
                  className="text-amber-500/35"
                />
                {/* Flow Arrow Indicators */}
                <path
                  d="M 470 180 L 464 205 L 440 200"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-600/60"
                />
                <path
                  d="M 450 330 L 440 355 L 415 348"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-600/60"
                />
              </svg>

              {/* 1. TOP CARD: Orbit Item (Previous / Upcoming in rotation) */}
              <div
                onClick={prevSlide}
                className="absolute top-2 sm:top-4 right-0 sm:right-3 w-[72%] sm:w-[75%] max-w-[340px] z-20 cursor-pointer transform transition-all duration-700 ease-out hover:scale-95 hover:opacity-100 opacity-75 rotate-3 hover:rotate-0"
                title="Bấm để xoay về món này"
              >
                <div className="rounded-2xl border border-stone-200/90 bg-white/90 backdrop-blur-md p-2.5 shadow-lg hover:shadow-xl transition-all">
                  <div className="relative h-22 sm:h-26 rounded-xl overflow-hidden bg-stone-100">
                    <img
                      src={prevDish.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'}
                      alt={prevDish.name}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-transparent to-transparent" />
                    <span className="absolute top-2 left-2 rounded-md bg-stone-900/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                      <RotateCcw className="h-2.5 w-2.5" />
                      <span>Món trước</span>
                    </span>
                    <span className="absolute bottom-2 right-2 text-[11px] font-bold text-white bg-stone-900/70 px-2 py-0.5 rounded-md font-mono">
                      {formatVnd(prevDish.price)}
                    </span>
                  </div>
                  <div className="pt-2 px-1">
                    <p className="text-xs font-bold text-stone-800 truncate">{prevDish.name}</p>
                    <p className="text-[10px] text-stone-500 truncate">{prevDish.categoryName}</p>
                  </div>
                </div>
              </div>

              {/* 2. CENTER SPOTLIGHT CARD: Active Main Showcase */}
              <div
                className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 w-[85%] sm:w-[88%] max-w-[420px] z-30 transition-all duration-700 ease-out"
              >
                <div
                  className={`rounded-3xl border-2 bg-white/95 backdrop-blur-md p-3.5 shadow-2xl transition-all duration-700 ${activeTheme.ringColor} ring-4 ring-offset-2 ring-offset-white/80`}
                >
                  <div className="relative h-56 sm:h-64 rounded-2xl overflow-hidden bg-stone-100 group">
                    <img
                      key={activeDish.id}
                      src={activeDish.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85'}
                      alt={activeDish.name}
                      className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-black/30" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-xl bg-white/95 backdrop-blur-sm px-3 py-1 text-xs font-bold text-stone-900 shadow-sm border border-stone-200">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span>{activeDish.categoryName || 'Món Tiệc Đặc Sắc'}</span>
                    </div>

                    <div className="absolute top-3 right-3 rounded-xl bg-amber-950/80 backdrop-blur-sm border border-amber-500/30 px-3 py-1 text-xs font-extrabold text-amber-300 shadow-sm font-mono">
                      {formatVnd(activeDish.price)}
                    </div>

                    {/* Navigation Buttons inside spotlight card */}
                    <button
                      type="button"
                      onClick={prevSlide}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-800 shadow-md hover:bg-white hover:scale-110 transition-all cursor-pointer opacity-85 hover:opacity-100"
                      aria-label="Món trước"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={nextSlide}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-800 shadow-md hover:bg-white hover:scale-110 transition-all cursor-pointer opacity-85 hover:opacity-100"
                      aria-label="Món kế tiếp"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    {/* Bottom Info inside Spotlight */}
                    <div className="absolute bottom-3 inset-x-3 rounded-xl border border-white/20 bg-stone-900/90 backdrop-blur-md p-3.5 text-white space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <Link
                          to={`/dishes/${activeDish.id}`}
                          className="font-bold text-sm sm:text-base text-white hover:text-amber-300 transition-colors line-clamp-1"
                        >
                          {activeDish.name}
                        </Link>
                        <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 shrink-0 font-medium">
                          10 khách / bàn
                        </span>
                      </div>
                      <p className="text-xs text-stone-300 line-clamp-1">
                        {(activeDish as any).highlight || activeDish.description || 'Chế biến tươi mới theo từng bàn tiệc chuẩn 5 sao.'}
                      </p>
                    </div>
                  </div>

                  {/* Active Card Bottom Bar with CTA & Play/Pause Control */}
                  <div className="pt-3 px-1 flex items-center justify-between">
                    <Link
                      to={`/dishes/${activeDish.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 transition-colors group"
                    >
                      <span>Xem công thức & định lượng</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPaused((prev) => !prev)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                          isPaused
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                        title={isPaused ? 'Tiếp tục tự động quay' : 'Tạm dừng tự động quay'}
                      >
                        {isPaused ? <Play className="h-3 w-3 text-amber-700" /> : <Pause className="h-3 w-3" />}
                        <span className="hidden sm:inline">{isPaused ? 'Đã dừng' : 'Đang quay'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. BOTTOM CARD: Orbit Item (Next in rotation) */}
              <div
                onClick={nextSlide}
                className="absolute bottom-2 sm:bottom-4 right-0 sm:right-3 w-[72%] sm:w-[75%] max-w-[340px] z-20 cursor-pointer transform transition-all duration-700 ease-out hover:scale-95 hover:opacity-100 opacity-75 -rotate-3 hover:rotate-0"
                title="Bấm để chuyển sang món này"
              >
                <div className="rounded-2xl border border-stone-200/90 bg-white/90 backdrop-blur-md p-2.5 shadow-lg hover:shadow-xl transition-all">
                  <div className="relative h-22 sm:h-26 rounded-xl overflow-hidden bg-stone-100">
                    <img
                      src={nextDish.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'}
                      alt={nextDish.name}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-transparent to-transparent" />
                    <span className="absolute top-2 left-2 rounded-md bg-stone-900/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                      <span>Món kế tiếp</span>
                    </span>
                    <span className="absolute bottom-2 right-2 text-[11px] font-bold text-white bg-stone-900/70 px-2 py-0.5 rounded-md font-mono">
                      {formatVnd(nextDish.price)}
                    </span>
                  </div>
                  <div className="pt-2 px-1">
                    <p className="text-xs font-bold text-stone-800 truncate">{nextDish.name}</p>
                    <p className="text-[10px] text-stone-500 truncate">{nextDish.categoryName}</p>
                  </div>
                </div>
              </div>

              {/* Rotary Dots Indicator below cards */}
              <div className="absolute -bottom-6 sm:-bottom-8 inset-x-0 flex items-center justify-between px-3 text-xs">
                <span className="text-[11px] font-medium text-stone-500">
                  Tuyển tập món tiệc ({currentSlide + 1}/{carouselItems.length})
                </span>
                <div className="flex items-center gap-1.5">
                  {carouselItems.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        currentSlide === idx
                          ? 'w-6 bg-amber-700'
                          : 'w-2 bg-stone-300 hover:bg-stone-400'
                      }`}
                      aria-label={`Chuyển đến món ${idx + 1}`}
                    />
                  ))}
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

      {/* Culinary Categories Section (NO TECHNICAL CODES!) */}
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
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/dishes?categoryId=${cat.id}`}
                className="group rounded-xl border border-stone-200 bg-white p-4 shadow-xs hover:border-amber-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 border border-amber-200 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-600" />
                    <span>Thực đơn tiệc</span>
                  </span>
                  <ChefHat className="h-4 w-4 text-stone-400 group-hover:text-amber-700 transition-colors" />
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

      {/* Featured Signature Dishes Showcase (NO TECHNICAL CODES!) */}
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
