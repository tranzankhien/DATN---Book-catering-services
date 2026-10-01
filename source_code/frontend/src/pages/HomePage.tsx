import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Scale,
  Utensils,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { extractErrorMessage } from '../services/apiClient';
import type { CategoryDto, DishSummaryDto } from '../services/types';
import { formatVnd } from '../hooks/useFormatters';
import { motion, AnimatePresence } from 'motion/react';

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [featuredDishes, setFeaturedDishes] = useState<DishSummaryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Carousel State: Xoay món nhẹ nhàng, êm ái
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<'down' | 'up'>('down');

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

  const carouselItems = featuredDishes;

  const rotateNext = () => {
    if (carouselItems.length <= 1) return;
    setSlideDirection('down');
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  };

  const rotatePrev = () => {
    if (carouselItems.length <= 1) return;
    setSlideDirection('up');
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  // Tự động xoay sau 5s nhịp nhàng, thư thái
  useEffect(() => {
    if (carouselItems.length <= 1) return;
    const timer = setInterval(() => {
      rotateNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselItems.length]);

  // Kéo chuột nhẹ nhàng để chuyển món
  const dragStartY = useRef<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartY.current = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStartY.current === null) return;
    const deltaY = e.clientY - dragStartY.current;
    if (deltaY > 40) {
      rotateNext();
      dragStartY.current = e.clientY;
    } else if (deltaY < -40) {
      rotatePrev();
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
    if (deltaY > 40) {
      rotateNext();
      dragStartY.current = e.touches[0].clientY;
    } else if (deltaY < -40) {
      rotatePrev();
      dragStartY.current = e.touches[0].clientY;
    }
  };

  const activeDish = carouselItems[currentSlide] || carouselItems[0] || null;

  return (
    <div className="space-y-28 sm:space-y-36 pb-24">
      {/* =========================================================================
          HERO SECTION - THIẾT KẾ ĐẬM CHẤT CON NGƯỜI: CHỮ TO NỔI BẬT, THOÁNG ĐÃNG
         ========================================================================= */}
      <section className="relative pt-10 pb-12 sm:pt-16 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Cột trái: Headline to, sắc sảo, tự tin, không rối mắt */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <span className="inline-block text-xs font-semibold tracking-wider uppercase text-amber-800">
                Nền tảng ẩm thực yến tiệc & hội nghị
              </span>

              <h1 className="text-4xl sm:text-6xl lg:text-6xl xl:text-7xl font-extrabold text-stone-900 tracking-tight leading-[1.08]">
                Tinh hoa yến tiệc,<br />
                <span className="text-amber-800">minh bạch định lượng.</span>
              </h1>

              <p className="text-base sm:text-lg text-stone-600 max-w-xl leading-relaxed mx-auto lg:mx-0 font-normal">
                Chuẩn hóa công thức và định mức nguyên liệu cho từng bàn 10 khách. Chủ động tính đúng chi phí, kiểm soát chất lượng tươi ngon và giữ chỗ an toàn.
              </p>

              {/* Nút bấm tinh gọn, kích thước hào phóng, không màu mè */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  to="/dishes"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white px-7 py-4 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <span>Khám phá thực đơn</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/dishes"
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 px-6 py-4 text-sm font-semibold transition-all duration-200"
                >
                  <span>Bảng tính giá bàn tiệc</span>
                </Link>
              </div>
            </div>

            {/* Cột phải: Thẻ Showcase sạch sẽ, không có bất kỳ note nhỏ nào ở 4 góc */}
            <div
              className="lg:col-span-6 relative w-full flex flex-col items-center justify-center select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
            >
              {loading ? (
                <div className="relative w-full max-w-[580px] flex flex-row items-center gap-4">
                  <div className="flex-1 w-[62%] h-[360px] rounded-2xl bg-stone-100 animate-pulse" />
                  <div className="w-[38%] h-[360px] flex flex-col justify-between gap-3.5">
                    <div className="h-[48%] rounded-2xl bg-stone-100 animate-pulse" />
                    <div className="h-[48%] rounded-2xl bg-stone-100 animate-pulse" />
                  </div>
                </div>
              ) : carouselItems.length > 0 && activeDish ? (
                <>
                  <div className="relative w-full max-w-[580px] flex flex-row items-center gap-4">
                    {/* Thẻ chính: Ảnh lớn trọn vẹn, không dán note con con ở các góc */}
                    <div className="flex-1 w-[62%] h-[360px] sm:h-[390px] relative">
                      <AnimatePresence mode="popLayout" custom={slideDirection}>
                        <motion.div
                          key={`main-${activeDish.id}`}
                          custom={slideDirection}
                          variants={{
                            enter: (dir: 'down' | 'up') => ({
                              y: dir === 'down' ? -28 : 28,
                              opacity: 0,
                            }),
                            center: {
                              y: 0,
                              opacity: 1,
                            },
                            exit: (dir: 'down' | 'up') => ({
                              y: dir === 'down' ? 28 : -28,
                              opacity: 0,
                            }),
                          }}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{
                            duration: 0.45,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="h-full w-full cursor-grab active:cursor-grabbing"
                        >
                          <Link
                            to={`/dishes/${activeDish.id}`}
                            className="block h-full w-full rounded-2xl overflow-hidden bg-stone-100 shadow-xl border border-stone-200/80 group transition-all duration-300"
                          >
                            <div className="relative h-full w-full">
                              <img
                                src={activeDish.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85'}
                                alt={activeDish.name}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-103"
                              />
                              {/* Lớp phủ gradient nhẹ tự nhiên ở đáy để hiện chữ êm mắt */}
                              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-transparent pointer-events-none" />

                              <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 text-white space-y-1">
                                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                                  {activeDish.name}
                                </h3>
                                <p className="text-sm font-medium text-stone-200">
                                  {formatVnd(activeDish.price)} <span className="text-stone-300 text-xs font-normal">/ bàn 10 khách</span>
                                </p>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* 2 Thẻ phụ bên phải: Xếp gọn gàng, sạch sẽ */}
                    <div className="w-[38%] h-[360px] sm:h-[390px] flex flex-col justify-between gap-3.5">
                      {(() => {
                        const topIdx = (currentSlide + 1) % carouselItems.length;
                        const topDish = carouselItems[topIdx];
                        if (!topDish) return null;
                        return (
                          <div
                            onClick={() => {
                              setSlideDirection('down');
                              setCurrentSlide(topIdx);
                            }}
                            className="relative h-[48%] w-full cursor-pointer rounded-2xl overflow-hidden bg-stone-100 shadow-md border border-stone-200/70 opacity-80 hover:opacity-100 transition-all duration-300 group"
                          >
                            <img
                              src={topDish.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'}
                              alt={topDish.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute bottom-0 inset-x-0 p-3 text-white">
                              <p className="text-xs font-bold truncate group-hover:text-amber-300 transition-colors">
                                {topDish.name}
                              </p>
                              <p className="text-[11px] text-stone-300">
                                {formatVnd(topDish.price)}
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      {(() => {
                        const btmIdx = (currentSlide + 2) % carouselItems.length;
                        const btmDish = carouselItems[btmIdx];
                        if (!btmDish) return null;
                        return (
                          <div
                            onClick={() => {
                              setSlideDirection('down');
                              setCurrentSlide(btmIdx);
                            }}
                            className="relative h-[48%] w-full cursor-pointer rounded-2xl overflow-hidden bg-stone-100 shadow-md border border-stone-200/70 opacity-80 hover:opacity-100 transition-all duration-300 group"
                          >
                            <img
                              src={btmDish.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'}
                              alt={btmDish.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute bottom-0 inset-x-0 p-3 text-white">
                              <p className="text-xs font-bold truncate group-hover:text-amber-300 transition-colors">
                                {btmDish.name}
                              </p>
                              <p className="text-[11px] text-stone-300">
                                {formatVnd(btmDish.price)}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Rotary Dot Indicators nhỏ nhắn, thanh lịch */}
                  {carouselItems.length > 1 && (
                    <div className="flex items-center gap-2 pt-4">
                      {carouselItems.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSlideDirection(idx > currentSlide ? 'down' : 'up');
                            setCurrentSlide(idx);
                          }}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            currentSlide === idx ? 'w-6 bg-amber-800' : 'w-1.5 bg-stone-300 hover:bg-stone-400'
                          }`}
                          aria-label={`Chuyển món ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>

          {/* =========================================================================
              MINIMALIST STAT BAR - KHÔNG ĐÓNG KHUNG MÀU MÈ, SỐ TO SẮC NÉT KIỂU PITO
             ========================================================================= */}
          <div className="mt-16 sm:mt-20 pt-10 border-t border-stone-200/70 grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">100%</p>
              <p className="text-sm font-semibold text-stone-800 mt-1">Nguyên liệu tươi sạch</p>
              <p className="text-xs text-stone-500 mt-0.5">Nhập mới theo từng sự kiện</p>
            </div>

            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">10 khách</p>
              <p className="text-sm font-semibold text-stone-800 mt-1">Chuẩn mực 01 bàn tiệc</p>
              <p className="text-xs text-stone-500 mt-0.5">Định mức công thức chính xác</p>
            </div>

            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">15 phút</p>
              <p className="text-sm font-semibold text-stone-800 mt-1">Giữ chỗ tự động</p>
              <p className="text-xs text-stone-500 mt-0.5">Bảo lưu tồn kho khi đặt tiệc</p>
            </div>

            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">0đ</p>
              <p className="text-sm font-semibold text-stone-800 mt-1">Không phụ phí phát sinh</p>
              <p className="text-xs text-stone-500 mt-0.5">Cam kết theo hợp đồng</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          VÌ SAO CHỌN BANQUETHUB - BỎ HẾT CÁC NOTE THỪA THÃI, THOÁNG ĐÃNG
         ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12 sm:mb-16 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Tiêu chuẩn vận hành
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Vì sao khách hàng tin chọn BanquetHub?
          </h2>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
            Kết hợp nghệ thuật ẩm thực truyền thống với giải pháp quản trị kho định lượng minh bạch.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-7 shadow-xs hover:border-amber-400 hover:shadow-md transition-all duration-300">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-5">
              <Scale className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-2">
              Định lượng minh bạch
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Mỗi món ăn đi kèm công thức tiêu hao chuẩn xác cho 10 khách, tính đúng chi phí thực tế và chống thất thoát.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200/90 bg-white p-7 shadow-xs hover:border-amber-400 hover:shadow-md transition-all duration-300">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-5">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-2">
              Giữ chỗ 15 phút
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Tự động giữ tồn kho khả dụng theo thời gian thực khi khách chọn món, không lo trùng lặp đơn tiệc.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200/90 bg-white p-7 shadow-xs hover:border-amber-400 hover:shadow-md transition-all duration-300">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-5">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-2">
              Tối ưu thực đơn
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Gợi ý phương án thực đơn hài hòa hương vị theo ngân sách và tính chất của tiệc cưới hay hội nghị.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200/90 bg-white p-7 shadow-xs hover:border-amber-400 hover:shadow-md transition-all duration-300">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-5">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-2">
              Giá niêm yết cố định
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Chốt bản sao giá và định lượng tại thời điểm tạo đơn, đảm bảo an tâm trọn vẹn cho khách hàng.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          DANH MỤC MÓN TIỆC - GỌN GÀNG, KHÔNG DÁN BADGE CON CON
         ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Tuyển tập ẩm thực
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mt-1">
              Danh mục món tiệc
            </h2>
          </div>
          <Link
            to="/dishes"
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900 transition-colors"
          >
            <span>Xem toàn bộ thực đơn</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/dishes?categoryId=${cat.id}`}
              className="group rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all duration-300"
            >
              <h3 className="text-sm font-bold text-stone-900 group-hover:text-amber-800 transition-colors mb-1">
                {cat.name}
              </h3>
              <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed font-normal">
                {cat.description || 'Các món ăn tiêu chuẩn tiệc cưới & hội nghị.'}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-800 group-hover:text-amber-900">
                <span>Xem danh sách món</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* =========================================================================
          THỰC ĐƠN TIỆC ĐẶC SẮC - CARD MÓN ĂN SẠCH BÓNG, KHÔNG CÓ NOTE GÓC
         ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Món ăn nổi bật
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mt-1">
              Thực đơn tiệc đặc sắc
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-500">
              Quy chuẩn phục vụ cho 01 bàn tiệc tiêu chuẩn 10 khách
            </p>
          </div>
          <Link
            to="/dishes"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-all shadow-xs"
          >
            <span>Tất cả món ăn</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredDishes.map((dish) => (
            <article
              key={dish.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white hover:border-amber-300 hover:shadow-lg transition-all duration-300 shadow-xs"
            >
              {/* Ảnh món ăn sạch sẽ, không dán bất kỳ badge hay status dot nào */}
              <div className="relative h-56 bg-stone-100 overflow-hidden">
                {dish.imageUrl ? (
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-stone-400">
                    <Utensils className="h-10 w-10" />
                  </div>
                )}
              </div>

              {/* Thông tin cốt lõi: Tên món, mô tả, giá */}
              <div className="flex flex-1 flex-col p-6 space-y-3">
                <div className="flex-1">
                  <span className="text-[11px] font-medium text-amber-800 uppercase tracking-wider">
                    {dish.categoryName}
                  </span>
                  <Link
                    to={`/dishes/${dish.id}`}
                    className="block mt-1 text-base sm:text-lg font-bold text-stone-900 hover:text-amber-800 transition-colors line-clamp-1"
                  >
                    {dish.name}
                  </Link>
                  <p className="mt-1.5 text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {dish.description || 'Món ăn tiệc truyền thống phục vụ theo quy chuẩn 10 khách.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] text-stone-400">Giá / 01 bàn (10 khách)</span>
                    <span className="text-lg font-bold text-stone-900">
                      {formatVnd(dish.price)}
                    </span>
                  </div>

                  <Link
                    to={`/dishes/${dish.id}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-stone-100 hover:bg-stone-200 px-3.5 py-2 text-xs font-semibold text-stone-800 transition-colors"
                  >
                    <span>Xem chi tiết</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* =========================================================================
          BANNER TƯ VẤN CUỐI TRANG - ĐƠN GIẢN, BỀ THẾ, ẤN TƯỢNG
         ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-stone-900 text-white p-8 sm:p-14 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Tổ chức tiệc hoàn hảo
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Tự thiết kế thực đơn & nhận báo giá ngay
              </h2>
              <p className="text-sm text-stone-300 leading-relaxed max-w-2xl font-normal">
                Thử nghiệm bảng tính giá bàn tiệc theo thời gian thực, xem định lượng nguyên liệu xuất kho chi tiết và trải nghiệm quy trình đặt tiệc trực tuyến tiện lợi.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <Link
                to="/dishes"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white px-6 py-4 text-xs sm:text-sm font-semibold shadow-sm transition-all"
              >
                <span>Mở bảng tính thực đơn</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-white px-6 py-4 text-xs sm:text-sm font-semibold transition-all"
              >
                <span>Đăng ký thành viên</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
