import React, { useEffect, useState, useRef } from 'react';
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
  RotateCcw,
  GripVertical,
  ChevronDown,
} from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { extractErrorMessage } from '../services/apiClient';
import type { CategoryDto, DishSummaryDto } from '../services/types';
import { formatVnd } from '../hooks/useFormatters';
import { ErrorState, LoadingState } from '../components/StatusStates';
import { TextRotate } from '@/components/ui/text-rotate';
import { motion, AnimatePresence } from 'motion/react';

// Cấu hình theme màu và ánh sáng background rực rỡ, ấn tượng linh hoạt theo từng món ăn
export type ThemeKey = 'emerald' | 'rose' | 'amber' | 'sky' | 'champagne';

interface DishTheme {
  key: ThemeKey;
  categoryLabel: string;
  badgeStyle: string;
  bgSection: string;
  glowGradient: string;
  secondaryGlow: string;
  ringColor: string;
  accentText: string;
}

const THEME_PRESETS: Record<ThemeKey, DishTheme> = {
  emerald: {
    key: 'emerald',
    categoryLabel: 'Khai Vị Hoàng Gia',
    badgeStyle: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    bgSection: 'from-emerald-200/85 via-teal-100/75 to-amber-100/80',
    glowGradient: 'from-emerald-500/60 via-teal-400/50 to-lime-300/40',
    secondaryGlow: 'from-emerald-400/50 to-teal-200/40',
    ringColor: 'ring-emerald-500/70 border-emerald-300',
    accentText: 'text-emerald-950',
  },
  rose: {
    key: 'rose',
    categoryLabel: 'Lẩu Thảo Mộc & Tiềm',
    badgeStyle: 'bg-rose-100 text-rose-950 border-rose-300',
    bgSection: 'from-rose-200/90 via-orange-100/75 to-amber-100/80',
    glowGradient: 'from-rose-500/60 via-orange-500/50 to-amber-400/40',
    secondaryGlow: 'from-red-400/50 to-orange-300/40',
    ringColor: 'ring-rose-500/70 border-rose-300',
    accentText: 'text-rose-950',
  },
  amber: {
    key: 'amber',
    categoryLabel: 'Món Thịt & Bò Thượng Hạng',
    badgeStyle: 'bg-amber-200 text-amber-950 border-amber-400',
    bgSection: 'from-amber-300/80 via-orange-200/70 to-stone-200/80',
    glowGradient: 'from-amber-600/60 via-orange-500/50 to-yellow-500/40',
    secondaryGlow: 'from-amber-500/50 to-orange-400/40',
    ringColor: 'ring-amber-600/70 border-amber-300',
    accentText: 'text-amber-950',
  },
  sky: {
    key: 'sky',
    categoryLabel: 'Hải Sản Tươi Sống',
    badgeStyle: 'bg-sky-100 text-sky-950 border-sky-300',
    bgSection: 'from-sky-200/85 via-cyan-100/70 to-amber-100/70',
    glowGradient: 'from-sky-500/60 via-cyan-400/50 to-blue-300/40',
    secondaryGlow: 'from-cyan-400/50 to-teal-300/40',
    ringColor: 'ring-sky-500/70 border-sky-300',
    accentText: 'text-sky-950',
  },
  champagne: {
    key: 'champagne',
    categoryLabel: 'Mỹ Vị Yến Tiệc',
    badgeStyle: 'bg-amber-200 text-amber-950 border-amber-400',
    bgSection: 'from-amber-200/85 via-yellow-100/80 to-amber-100/80',
    glowGradient: 'from-amber-500/60 via-yellow-400/50 to-orange-400/40',
    secondaryGlow: 'from-yellow-400/50 to-amber-300/40',
    ringColor: 'ring-amber-500/70 border-amber-300',
    accentText: 'text-amber-900',
  },
};

const getDishTheme = (dish: { name?: string; categoryName?: string }): DishTheme => {
  const cat = (dish.categoryName || '').toLowerCase();
  const name = (dish.name || '').toLowerCase();

  // Khai Vị & Gỏi: Ngọc Lục Bảo & Vàng Chanh Hoàng Gia tươi sáng
  if (cat.includes('khai vị') || cat.includes('gỏi') || name.includes('gỏi')) {
    return THEME_PRESETS.emerald;
  }
  // Lẩu & Canh: Đỏ San Hô Ruby & Ánh Lửa Yến Tiệc Nồng Ấm
  if (cat.includes('lẩu') || cat.includes('canh') || name.includes('lẩu')) {
    return THEME_PRESETS.rose;
  }
  // Bò & Món Nướng: Nâu Hổ Phách Nướng & Vàng Gold Thượng Hạng
  if (name.includes('bò') || cat.includes('thịt')) {
    return THEME_PRESETS.amber;
  }
  // Hải Sản Tươi Sống: Xanh Biển Ngọc & Bích Ngọc Biển Đông
  if (cat.includes('hải sản') || name.includes('tôm') || name.includes('mực') || name.includes('cá')) {
    return THEME_PRESETS.sky;
  }
  // Gà Ta Xôi Sen & Món Đặc Biệt: Hoàng Kim & Lụa Champagne
  return THEME_PRESETS.champagne;
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

  // Carousel State cho Hero Section (Luôn xoay tự động liên tục không ngừng)
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<'down' | 'up'>('down');
  const [bgThemeKey, setBgThemeKey] = useState<ThemeKey>('emerald');

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

  // Cập nhật màu nền theo độ trễ có chủ đích (Deliberate latency):
  // Thẻ chuyển động chạy trước, sau 220ms không gian nền mới bắt đầu chuyển màu lan tỏa theo
  useEffect(() => {
    const dish = carouselItems[currentSlide] || carouselItems[0];
    if (!dish) return;
    const theme = getDishTheme(dish);
    const timer = setTimeout(() => {
      setBgThemeKey(theme.key);
    }, 220);
    return () => clearTimeout(timer);
  }, [currentSlide, carouselItems]);

  // Xoay tiến: Món kế tiếp bước lên
  const rotateNext = () => {
    setSlideDirection('down');
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  };

  // Xoay lùi: Món trước đó quay lại
  const rotatePrev = () => {
    setSlideDirection('up');
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const rotateDown = rotateNext;
  const rotateUp = rotatePrev;

  // Hiệu ứng mặc định: Tự động xoay sau 4.5s (đủ độ trễ để mắt thường cảm nhận trọn vẹn)
  useEffect(() => {
    if (carouselItems.length <= 1) return;
    const timer = setInterval(() => {
      rotateNext();
    }, 4500);
    return () => clearInterval(timer);
  }, [carouselItems.length]);

  // Xử lý giữ chuột & kéo để xoay tự nhiên (Mouse Drag / Touch Drag)
  const dragStartY = useRef<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartY.current = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStartY.current === null) return;
    const deltaY = e.clientY - dragStartY.current;
    if (deltaY > 35) {
      rotateDown();
      dragStartY.current = e.clientY;
    } else if (deltaY < -35) {
      rotateUp();
      dragStartY.current = e.clientY;
    }
  };

  const handleMouseUp = () => {
    dragStartY.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      dragStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null || e.touches.length === 0) return;
    const deltaY = e.touches[0].clientY - dragStartY.current;
    if (deltaY > 35) {
      rotateDown();
      dragStartY.current = e.touches[0].clientY;
    } else if (deltaY < -35) {
      rotateUp();
      dragStartY.current = e.touches[0].clientY;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 30) {
      if (e.deltaY > 0) {
        rotateDown();
      } else {
        rotateUp();
      }
    }
  };

  const activeDish = carouselItems[currentSlide] || carouselItems[0];
  const activeTheme = getDishTheme(activeDish);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Luxury Hero Section with Rotary Orbit Showcase & Dynamic Atmospheric Background */}
      <section className="relative overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-22">
        {/* Dynamic Atmospheric Background with Layered Cross-fade and Deliberate Stagger Delay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {(Object.keys(THEME_PRESETS) as ThemeKey[]).map((key) => {
            const t = THEME_PRESETS[key];
            const isActive = bgThemeKey === key;
            return (
              <div
                key={key}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out pointer-events-none ${
                  isActive ? 'opacity-100 z-1' : 'opacity-0 z-0'
                }`}
              >
                {/* Full-width gradient layer */}
                <div className={`absolute inset-0 bg-gradient-to-br ${t.bgSection}`} />

                {/* Main Ambient Glow Orb (morphs with theme) */}
                <div
                  className={`absolute -top-24 -right-24 w-[680px] h-[680px] rounded-full blur-3xl opacity-75 bg-gradient-to-br ${t.glowGradient} animate-pulse-glow`}
                />

                {/* Secondary Ambient Accent Orb */}
                <div
                  className={`absolute top-1/3 right-1/4 w-[460px] h-[460px] rounded-full blur-2xl opacity-60 bg-gradient-to-tr ${t.secondaryGlow}`}
                />
              </div>
            );
          })}

          {/* Diffused ambient photo of active dish */}
          {activeDish.imageUrl && (
            <img
              key={`ambient-${activeDish.id}`}
              src={activeDish.imageUrl}
              alt=""
              className="absolute right-0 top-1/3 -translate-y-1/2 w-[560px] h-[560px] object-cover rounded-full blur-[90px] opacity-35 pointer-events-none select-none transition-opacity duration-1000"
            />
          )}

          {/* Subtle Radial Dot Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(#a8a29e_1px,transparent_1px)] [background-size:24px_24px] opacity-25 z-2 pointer-events-none" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Content (Staggered Animation Entrance) */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="animate-fade-up-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/90 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-amber-900 shadow-xs">
                  <Sparkles className="h-3.5 w-3.5 text-amber-700 animate-spin" style={{ animationDuration: '8s' }} />
                  <span>Nghệ Thuật Ẩm Thực Yến Tiệc & Hội Nghị Cao Cấp</span>
                </div>
              </div>

              {/* Headline with Structured 3-Tier Dynamic TextRotate (No overlap, crystal clear typography) */}
              <h1 className="animate-fade-up-2 text-3xl sm:text-5xl lg:text-5xl font-extrabold text-stone-900 tracking-tight leading-[1.2]">
                <span>Tinh Hoa Yến Tiệc,</span>
                <span className="block mt-1 sm:mt-1.5 text-amber-700 min-h-[44px] sm:min-h-[58px] flex items-center">
                  <TextRotate
                    texts={[
                      "Minh Bạch Định Lượng",
                      "Đẳng Cấp 5 Sao",
                      "Tinh Túy Mỹ Vị",
                      "Chuẩn Vị Hoàng Gia",
                      "Tối Ưu Chi Phí",
                    ]}
                    mainClassName="py-0.5 underline decoration-amber-300 decoration-wavy decoration-from-font inline-flex"
                    splitBy="words"
                    staggerDuration={0.03}
                    staggerFrom="first"
                    rotationInterval={3600}
                    animatePresenceMode="popLayout"
                    exit={{ y: "-80%", opacity: 0, transition: { duration: 0.2 } }}
                    animate={{ y: 0, opacity: 1 }}
                    initial={{ y: "80%", opacity: 0 }}
                    transition={{ type: "spring", damping: 24, stiffness: 280 }}
                  />
                </span>
                <span className="block text-2xl sm:text-4xl text-stone-800 font-bold mt-1 tracking-normal">
                  Quy Chuẩn Từng Bàn Tiệc
                </span>
              </h1>

              {/* Subtitle */}
              <p className="animate-fade-up-3 text-sm sm:text-base text-stone-600 max-w-xl leading-relaxed mx-auto lg:mx-0 pt-1">
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
            </div>

            {/* Right Hero: Luxury 3D Stacked Card Slideshow (Slide show thẻ bài xếp chồng đa tầng) */}
            <div className="lg:col-span-6 relative w-full flex flex-col items-center justify-between select-none animate-hero-showcase">
              {/* Top Framing Badges for Balance (Matches left badge py-1.5, height = 30px) */}
              <div className="flex items-center justify-between w-full max-w-[490px] sm:max-w-[530px] mb-5 sm:mb-6 px-1 z-30">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-white/95 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-amber-950 shadow-xs">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                  <span>Bếp Trưởng 5★ Chuẩn Vị</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/80 bg-white/95 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-emerald-950 shadow-xs">
                  <Utensils className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Quy Chuẩn 10 Khách / Bàn</span>
                </div>
              </div>

              {/* The 3D Stack Frame (Landscape Rectangle proportions with deliberate right margin for stack depth) */}
              <div className="relative w-full max-w-[490px] sm:max-w-[530px] h-[300px] sm:h-[325px] mr-6 sm:mr-10">
                {/* Card 2 (Bottom layer / 3rd in stack) */}
                {(() => {
                  const total = carouselItems.length;
                  const card2Idx = (currentSlide + 2) % total;
                  const card2 = carouselItems[card2Idx];
                  if (!card2) return null;
                  return (
                    <motion.div
                      key={`stack-2-${card2.id}`}
                      onClick={() => setCurrentSlide(card2Idx)}
                      className="absolute inset-0 z-10 cursor-pointer pointer-events-auto rounded-3xl border border-stone-200/80 bg-white/85 backdrop-blur-xs p-2.5 sm:p-3 shadow-lg transition-all"
                      animate={{
                        x: 62,
                        y: -26,
                        rotate: 6.8,
                        scale: 0.88,
                        opacity: 0.78,
                      }}
                      whileHover={{
                        x: 70,
                        y: -30,
                        rotate: 8.5,
                        scale: 0.91,
                        opacity: 0.95,
                      }}
                      transition={{ type: "spring", stiffness: 260, damping: 25 }}
                      title={`Món tiếp theo: ${card2.name} (Bấm để xem)`}
                    >
                      <div className="relative h-[255px] sm:h-[278px] rounded-2xl overflow-hidden bg-stone-100">
                        <img
                          src={card2.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'}
                          alt={card2.name}
                          className="h-full w-full object-cover filter brightness-90"
                        />
                        <div className="absolute inset-0 bg-stone-950/30" />
                        <div className="absolute top-3 right-3 rounded-lg bg-stone-900/90 backdrop-blur-xs px-2.5 py-1 text-xs font-bold text-amber-300 font-mono shadow-xs">
                          {formatVnd(card2.price)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}

                {/* Card 1 (Middle layer / 2nd in stack) */}
                {(() => {
                  const total = carouselItems.length;
                  const card1Idx = (currentSlide + 1) % total;
                  const card1 = carouselItems[card1Idx];
                  if (!card1) return null;
                  return (
                    <motion.div
                      key={`stack-1-${card1.id}`}
                      onClick={() => rotateNext()}
                      className="absolute inset-0 z-20 cursor-pointer pointer-events-auto rounded-3xl border border-stone-200/90 bg-white/95 backdrop-blur-sm p-2.5 sm:p-3 shadow-xl transition-all"
                      animate={{
                        x: 32,
                        y: -14,
                        rotate: 3.4,
                        scale: 0.94,
                        opacity: 0.94,
                      }}
                      whileHover={{
                        x: 38,
                        y: -18,
                        rotate: 4.8,
                        scale: 0.97,
                        opacity: 1,
                      }}
                      transition={{ type: "spring", stiffness: 260, damping: 25 }}
                      title={`Món kế tiếp: ${card1.name} (Bấm để đưa lên trước)`}
                    >
                      <div className="relative h-[255px] sm:h-[278px] rounded-2xl overflow-hidden bg-stone-100">
                        <img
                          src={card1.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'}
                          alt={card1.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-transparent to-transparent" />
                        <span className="absolute top-3 left-3 rounded-lg bg-white/95 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold text-stone-900 shadow-sm border border-stone-200">
                          {card1.categoryName || 'Món Tiệc'}
                        </span>
                        <span className="absolute top-3 right-3 rounded-lg bg-stone-900/85 backdrop-blur-xs px-2.5 py-1 text-xs font-bold text-amber-300 font-mono shadow-xs">
                          {formatVnd(card1.price)}
                        </span>
                        <div className="absolute bottom-2.5 inset-x-3 px-3.5 py-2 rounded-xl bg-stone-900/85 backdrop-blur-xs text-white">
                          <p className="text-xs font-bold truncate">{card1.name}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}

                {/* Card 0 (Active Top Card / 1st in stack - Drag, Slide, Dynamic Theme) */}
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={`stack-0-${activeDish.id}`}
                    className="relative z-30 pointer-events-auto cursor-grab active:cursor-grabbing"
                    initial={{
                      x: slideDirection === 'down' ? 60 : -60,
                      y: -12,
                      rotate: slideDirection === 'down' ? 5 : -5,
                      opacity: 0.3,
                      scale: 0.93,
                    }}
                    animate={{
                      x: 0,
                      y: 0,
                      rotate: 0,
                      opacity: 1,
                      scale: 1,
                    }}
                    exit={{
                      x: slideDirection === 'down' ? -220 : 220,
                      y: 22,
                      rotate: slideDirection === 'down' ? -12 : 12,
                      opacity: 0,
                      scale: 0.88,
                    }}
                    transition={{ type: "spring", stiffness: 240, damping: 24, mass: 0.8 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.4}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -35 || info.velocity.x < -250) {
                        rotateNext();
                      } else if (info.offset.x > 35 || info.velocity.x > 250) {
                        rotatePrev();
                      }
                    }}
                  >
                    <Link
                      to={`/dishes/${activeDish.id}`}
                      className={`block rounded-3xl border-2 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 shadow-2xl transition-all duration-500 ${activeTheme.ringColor} ring-4 ring-offset-2 ring-offset-white/80 group hover:shadow-amber-950/25`}
                    >
                      <div className="relative h-[255px] sm:h-[278px] rounded-2xl overflow-hidden bg-stone-100">
                        <img
                          src={activeDish.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85'}
                          alt={activeDish.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-black/30" />

                        {/* Top Badges */}
                        <div className="animate-badge-left absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-white/95 backdrop-blur-sm px-3 py-1 text-xs font-bold text-stone-900 shadow-sm border border-stone-200">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                          <span className="truncate max-w-[140px] sm:max-w-none">{activeDish.categoryName || 'Món Tiệc Đặc Sắc'}</span>
                        </div>

                        <div className="animate-badge-right absolute top-3 right-3 rounded-lg bg-amber-950/90 backdrop-blur-sm border border-amber-500/40 px-3 py-1 text-xs font-extrabold text-amber-300 shadow-sm font-mono">
                          {formatVnd(activeDish.price)}
                        </div>

                        {/* Bottom Info inside Spotlight */}
                        <div className="animate-info-box absolute bottom-2.5 inset-x-2.5 rounded-2xl border border-white/20 bg-stone-900/90 backdrop-blur-md px-4 py-2.5 sm:py-3 text-white space-y-1">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <span className="font-bold text-sm sm:text-base text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                              {activeDish.name}
                            </span>
                            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-300 shrink-0">
                              10 khách / bàn
                            </span>
                          </div>
                          <p className="text-xs text-stone-300 line-clamp-1 leading-relaxed">
                            {(activeDish as any).highlight || activeDish.description || 'Chế biến tươi mới theo từng bàn tiệc chuẩn 5 sao.'}
                          </p>
                          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px] text-amber-200/90">
                            <span className="flex items-center gap-1.5">
                              <Scale className="h-3 w-3 text-amber-400" />
                              <span>Minh bạch định lượng 1 bàn</span>
                            </span>
                            <span className="font-semibold text-stone-400 flex items-center gap-0.5 group-hover:text-amber-300 transition-colors">
                              <span>Xem công thức</span>
                              <ChevronRight className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Controls & Rotary Indicators */}
              <div className="flex items-center justify-between w-full max-w-[490px] sm:max-w-[530px] pt-6 px-1">
                <button
                  type="button"
                  onClick={rotatePrev}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200/90 bg-white/90 hover:bg-white text-stone-700 hover:text-amber-800 px-4 py-2 text-xs font-semibold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  title="Món trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Trước</span>
                </button>

                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-semibold text-stone-600 flex items-center gap-1">
                    <GripVertical className="h-3.5 w-3.5 text-amber-700 animate-pulse" />
                    <span>Vuốt hoặc bấm thẻ ({currentSlide + 1}/{carouselItems.length})</span>
                  </span>
                  {/* Rotary Dots */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {carouselItems.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          currentSlide === idx ? 'w-5 bg-amber-700' : 'w-1.5 bg-stone-300 hover:bg-stone-400'
                        }`}
                        aria-label={`Chuyển đến món ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={rotateNext}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200/90 bg-white/90 hover:bg-white text-stone-700 hover:text-amber-800 px-4 py-2 text-xs font-semibold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  title="Món kế tiếp"
                >
                  <span>Tiếp</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Key Hospitality Trust Bar (Anchors both columns with 100% horizontal equilibrium) */}
          <div className="animate-fade-up-4 mt-10 sm:mt-14 pt-8 border-t border-stone-200/70 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-center gap-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight leading-none">100%</p>
                <p className="text-xs font-semibold text-stone-700 mt-1">Nguyên liệu chuẩn tươi</p>
                <p className="text-[11px] text-stone-500 hidden sm:block">Nhập mới mỗi ngày</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                <Utensils className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight leading-none">01 Bàn</p>
                <p className="text-xs font-semibold text-stone-700 mt-1">Quy chuẩn 10 khách</p>
                <p className="text-[11px] text-stone-500 hidden sm:block">Định mức công thức chuẩn</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-800 font-bold">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight leading-none">15 Phút</p>
                <p className="text-xs font-semibold text-stone-700 mt-1">Giữ chỗ an toàn</p>
                <p className="text-[11px] text-stone-500 hidden sm:block">Bảo lưu thực đơn khi đặt</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-800 font-bold">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight leading-none">Minh Bạch</p>
                <p className="text-xs font-semibold text-stone-700 mt-1">Đúng giá niêm yết</p>
                <p className="text-[11px] text-stone-500 hidden sm:block">Không phụ phí ẩn phát sinh</p>
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
