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
  ChefHat,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Star,
  Award,
  Quote,
  Building2,
  HeartHandshake,
} from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { extractErrorMessage } from '../services/apiClient';
import type { CategoryDto, DishSummaryDto } from '../services/types';
import { formatVnd } from '../hooks/useFormatters';
import { motion, AnimatePresence } from 'motion/react';

// Data giải pháp yến tiệc & sự kiện
const banquetSolutions = [
  {
    title: 'Tiệc cưới & hỷ sự truyền thống',
    description: 'Mâm cỗ cưới tròn vị với phong vị ẩm thực ba miền, định lượng chuẩn 10 khách/bàn và cách bài trí trang trọng.',
    tag: 'Phổ biến nhất',
    highlights: ['Thực đơn 6 - 8 món cao cấp', 'Trang trí bàn tiệc thanh lịch', 'Tự do thử món trước ngày cưới'],
    link: '/dishes',
  },
  {
    title: 'Hội nghị & Gala Dinner doanh nghiệp',
    description: 'Giải pháp tiệc bàn và tiệc đứng chuyên nghiệp dành cho đại hội cổ đông, ra mắt sản phẩm hoặc tiệc tất niên.',
    tag: 'Chuẩn sự kiện VIP',
    highlights: ['Hóa đơn VAT điện tử hợp lệ', 'Kịch bản phục vụ bài bản', 'Năng lực cung ứng tới 1.000 khách'],
    link: '/dishes',
  },
  {
    title: 'Tiệc gia đình, sinh nhật & mừng thọ',
    description: 'Không gian sum vầy ấm cúng cùng những món ăn thanh tao, bổ dưỡng phù hợp cho mọi lứa tuổi trong gia đình.',
    tag: 'Ấm cúng & tinh tế',
    highlights: ['Khẩu vị thanh đạm, ít dầu mỡ', 'Linh hoạt quy mô từ 3 - 10 bàn', 'Thời gian chuẩn bị nhanh chóng'],
    link: '/dishes',
  },
  {
    title: 'Dịch vụ đầu bếp & tiệc tận nơi',
    description: 'Đội ngũ bếp trưởng mang trọn vẹn hương vị 5 sao và dụng cụ chuyên dụng đến phục vụ trực tiếp tại tư gia.',
    tag: 'Phục vụ tận nơi',
    highlights: ['Nấu nóng sốt tại chỗ', 'Trọn gói nhân sự & bàn ghế', 'Dọn dẹp chu đáo sau sự kiện'],
    link: '/dishes',
  },
];

// Data cam kết chất lượng chuẩn 5 sao
const qualityCommitments = [
  {
    icon: Award,
    title: 'Chứng nhận An toàn Thực phẩm',
    description: 'Quy trình tiếp nhận, bảo quản và chế biến tuân thủ nghiêm ngặt quy định vệ sinh an toàn thực phẩm.',
  },
  {
    icon: Sparkles,
    title: 'Nguyên liệu tươi nhập mới mỗi ngày',
    description: 'Hải sản tươi sống, thịt sạch tươi ngon và rau củ canh tác VietGAP từ các nhà cung cấp uy tín đã kiểm định.',
  },
  {
    icon: Scale,
    title: 'Định lượng số hóa chính xác từng gram',
    description: 'Công thức tiêu hao được tính toán tự động qua hệ thống, không cắt giảm khẩu phần hay thay thế nguyên liệu.',
  },
  {
    icon: ShieldCheck,
    title: 'Cam kết bảo lưu đơn giá hợp đồng',
    description: 'Giá niêm yết tại thời điểm giữ chỗ là giá thanh toán cuối cùng. Hoàn toàn không có phụ phí phát sinh ngầm.',
  },
];

// Data đánh giá thực tế từ khách hàng
const customerStories = [
  {
    quote: 'Điều tôi ấn tượng nhất ở BanquetHub là sự minh bạch. Khi xem từng món, mình biết chính xác 1 bàn 10 người có bao nhiêu gram tôm sú, bao nhiêu gram thịt bò. Đồ ăn ra nóng hổi, khách dự tiệc khen nức nở.',
    author: 'Anh Hoàng Minh Quân',
    role: 'Chú rể tiệc cưới 45 bàn tại TP.HCM',
    event: 'Tiệc cưới 45 bàn',
  },
  {
    quote: 'Công ty chúng tôi tổ chức Gala Dinner 30 bàn cho 300 nhân sự. Đặt tiệc qua hệ thống rất nhanh, hợp đồng và hóa đơn VAT điện tử minh bạch. Đội ngũ phục vụ chuyên nghiệp đúng tác phong khách sạn.',
    author: 'Chị Nguyễn Thu Hằng',
    role: 'Trưởng ban Đối ngoại & Nhân sự VNP Group',
    event: 'Gala Dinner 30 bàn',
  },
  {
    quote: 'Tính năng khóa giữ chỗ 15 phút rất yên tâm khi lên kế hoạch tiệc mừng thọ cho ông bà. Nguyên liệu tươi rói, nước lẩu ngọt thanh tự nhiên từ xương và hải sản chứ không dùng bột ngọt.',
    author: 'Bác Lê Văn Đức',
    role: 'Đại diện gia đình tiệc mừng thọ 8 bàn',
    event: 'Tiệc mừng thọ 8 bàn',
  },
];

// Data thương hiệu đối tác
const partnerBrands = [
  'TẬP ĐOÀN VINGROUP',
  'FPT SOFTWARE',
  'TECHCOMBANK',
  'VIETTEL GROUP',
  'SHOPEE VIETNAM',
];

// Data câu hỏi thường gặp (FAQ)
const faqs = [
  {
    question: 'Tiêu chuẩn 01 bàn tiệc tại BanquetHub phục vụ cho bao nhiêu khách?',
    answer: 'Tất cả các món ăn và bảng định lượng tại BanquetHub được chuẩn hóa chính xác cho 01 bàn tiêu chuẩn 10 khách người lớn. Khẩu phần đầy đặn, đủ để mọi thực khách đều thưởng thức trọn vẹn hương vị mà không bị thiếu hụt.',
  },
  {
    question: 'Tôi có thể tùy chỉnh hoặc đổi món trong thực đơn không?',
    answer: 'Hoàn toàn được. Bạn có thể tự do lựa chọn từng món từ danh mục (Khai vị, Món chính, Canh lẩu, Tráng miệng) để tạo nên thực đơn theo ý muốn. Hệ thống sẽ tự động tổng hợp chi phí và danh sách nguyên liệu xuất kho tương ứng trong tích tắc.',
  },
  {
    question: 'Cơ chế khóa giữ chỗ 15 phút hoạt động như thế nào?',
    answer: 'Khi bạn hoàn tất lựa chọn món và tiến hành đặt bàn, hệ thống tự động khóa tạm thời lượng nguyên liệu khả dụng tương ứng trong kho trung tâm trong vòng 15 phút. Điều này đảm bảo nguyên liệu cho sự kiện của bạn không bị trùng lặp hoặc cạn kiệt trong lúc bạn xác nhận thông tin thanh toán.',
  },
  {
    question: 'Tôi cần đặt tiệc trước ngày tổ chức bao lâu?',
    answer: 'Đối với tiệc gia đình quy mô từ 3 - 10 bàn, chúng tôi khuyến nghị đặt trước tối thiểu 48 tiếng. Đối với tiệc cưới hoặc sự kiện doanh nghiệp trên 15 bàn, quý khách nên chốt thực đơn trước 5 - 7 ngày để chúng tôi chuẩn bị chu đáo nhất khâu nguyên liệu tươi sống và nhân sự phục vụ.',
  },
  {
    question: 'BanquetHub có hỗ trợ xuất hóa đơn VAT điện tử cho doanh nghiệp không?',
    answer: 'Có. Tất cả các đơn tiệc doanh nghiệp đều được hỗ trợ xuất hóa đơn Giá trị gia tăng (VAT) điện tử hợp pháp kèm bảng kê chi tiết nguyên vật liệu và biên bản nghiệm thu dịch vụ đầy đủ.',
  },
];

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [featuredDishes, setFeaturedDishes] = useState<DishSummaryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

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
    <div className="space-y-24 sm:space-y-32 pb-20">
      {/* =========================================================================
          HERO SECTION - THIẾT KẾ ĐẬM CHẤT CON NGƯỜI: CÂN ĐỐI, ẤM ÁP, THOÁNG ĐÃNG
         ========================================================================= */}
      <section className="relative -mt-4 pt-10 pb-16 sm:pt-14 sm:pb-20 bg-gradient-to-b from-[#fbf8f4] via-[#faf7f3]/70 to-transparent border-b border-stone-200/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Cột trái: Headline to, sắc sảo, tự tin, không rối mắt */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <span className="inline-block text-xs font-semibold tracking-wider uppercase text-amber-800">
                Nền tảng ẩm thực yến tiệc & hội nghị
              </span>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[42px] xl:text-[48px] font-extrabold text-stone-900 tracking-tight leading-[1.2] max-w-xl mx-auto lg:mx-0">
                Tinh hoa yến tiệc, <br className="hidden sm:inline" />
                <span className="text-amber-800">minh bạch định lượng</span>
              </h1>

              <p className="text-base sm:text-lg text-stone-600 max-w-xl leading-relaxed mx-auto lg:mx-0 font-normal">
                Chuẩn hóa công thức và định mức nguyên liệu cho từng bàn 10 khách. Chủ động tính đúng chi phí, kiểm soát chất lượng tươi ngon và giữ chỗ an toàn.
              </p>

              {/* Nút bấm tinh gọn, kích thước hào phóng, không màu mè */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  to="/dishes"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-6 py-3.5 text-sm font-semibold shadow-xs hover:shadow-md transition-all duration-200"
                >
                  <span>Khám phá thực đơn</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/ai-menu"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 px-5 py-3.5 text-sm font-semibold transition-all duration-200"
                >
                  <Sparkles className="h-4 w-4 text-amber-700" />
                  <span>Gợi ý thực đơn AI</span>
                </Link>

                <Link
                  to="/menu-builder"
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 px-5 py-3.5 text-sm font-semibold transition-all duration-200"
                >
                  <span>Tự phối thực đơn</span>
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
          CÁC LOẠI HÌNH YẾN TIỆC & GIẢI PHÁP SỰ KIỆN - SANG TRỌNG THEO PHONG CÁCH PITO
         ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Giải pháp toàn diện
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              Các loại hình yến tiệc & sự kiện
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
              Từ mâm cỗ cưới truyền thống đến đại tiệc doanh nghiệp, BanquetHub đồng hành cùng mọi dấu mốc đáng nhớ.
            </p>
          </div>
          <Link
            to="/dishes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 transition-colors"
          >
            <span>Khám phá menu theo sự kiện</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {banquetSolutions.map((item, idx) => (
            <div
              key={idx}
              className="group rounded-2xl border border-stone-200/90 bg-white p-7 shadow-xs hover:border-amber-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/70 rounded-md px-2.5 py-0.5">
                    {item.tag}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs text-stone-600 leading-relaxed font-normal">
                  {item.description}
                </p>

                <ul className="space-y-2 pt-2 border-t border-stone-100">
                  {item.highlights.map((hl, hlIdx) => (
                    <li key={hlIdx} className="flex items-center gap-2 text-xs text-stone-600">
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100">
                <Link
                  to={item.link}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-800 group-hover:text-amber-800 transition-colors"
                >
                  <span>Chọn thực đơn phù hợp</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
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
          QUY TRÌNH 4 BƯỚC ĐẶT TIỆC CHUẨN MỰC & MINH BẠCH (THE 4-STEP WORKFLOW)
         ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-stone-200/80 bg-gradient-to-b from-[#fbf8f4] via-[#faf7f3]/60 to-white p-8 sm:p-14 shadow-xs">
          <div className="max-w-2xl mb-12 sm:mb-14 space-y-2 text-center sm:text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Quy trình thông minh
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              Đặt tiệc dễ dàng qua 4 bước chuẩn mực
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
              Trải nghiệm xây dựng thực đơn và quản trị chi phí bàn tiệc khép kín, minh bạch và hoàn toàn chủ động.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs relative flex flex-col justify-between hover:border-amber-300 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                    <Utensils className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-black text-amber-900/20 tabular-nums">01</span>
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  Khám phá & chọn món
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Xem thực đơn phong phú kèm bảng định lượng nguyên liệu công khai cho từng bàn 10 khách.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] font-semibold text-amber-800">
                100% minh bạch định mức
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs relative flex flex-col justify-between hover:border-amber-300 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                    <Scale className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-black text-amber-900/20 tabular-nums">02</span>
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  Tự tính giá thời gian thực
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Tùy chỉnh số lượng bàn (5 - 50 bàn), hệ thống tự động nhân cấp chi phí và xuất danh sách nguyên liệu.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] font-semibold text-amber-800">
                Không phát sinh phụ phí
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs relative flex flex-col justify-between hover:border-amber-300 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-black text-amber-900/20 tabular-nums">03</span>
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  Khóa giữ chỗ 15 phút
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Bảo lưu tự động nguyên liệu trong kho trung tâm để đảm bảo không bị thiếu hụt khi tổ chức tiệc.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] font-semibold text-amber-800">
                An toàn tuyệt đối
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs relative flex flex-col justify-between hover:border-amber-300 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                    <ChefHat className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-black text-amber-900/20 tabular-nums">04</span>
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  Chế biến & phục vụ tiệc
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Đội ngũ bếp trưởng chuẩn bị tươi mới, giao tiệc nóng sốt đúng giờ hoặc phục vụ trọn gói tại chỗ.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] font-semibold text-amber-800">
                Tiêu chuẩn khách sạn 5 sao
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CAM KẾT CHẤT LƯỢNG 5 SAO - XÂY DỰNG NIỀM TIN VỮNG CHẮC
         ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-stone-200/90 bg-white p-8 sm:p-14 shadow-xs">
          <div className="max-w-2xl mb-10 sm:mb-12 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Tiêu chuẩn khắt khe
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              Cam kết chất lượng chuẩn yến tiệc 5 sao
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
              Mỗi bàn tiệc là tâm huyết của đội ngũ bếp trưởng và quy trình kiểm soát nguyên liệu nghiêm ngặt.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {qualityCommitments.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div key={idx} className="space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                    <IconComp className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-stone-900">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
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
                    className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span>Xem chi tiết</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* =========================================================================
          TRẢI NGHIỆM KHÁCH HÀNG THỰC TẾ & ĐỐI TÁC DOANH NGHIỆP
         ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Khách hàng tin chọn
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Trải nghiệm thực tế từ các bàn tiệc
          </h2>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
            Hàng trăm sự kiện cưới hỏi, hội nghị doanh nghiệp và tiệc gia đình đã được phục vụ trọn vẹn.
          </p>
        </div>

        {/* Testimonials 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {customerStories.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-stone-200/90 bg-white p-7 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all duration-300"
            >
              <div className="space-y-4">
                {/* 5 Stars */}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal italic">
                  "{item.quote}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                    {item.author}
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    {item.role}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 rounded-md px-2 py-0.5 border border-amber-200/60">
                  {item.event}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Partner Strip */}
        <div className="mt-14 pt-10 border-t border-stone-200/70 text-center space-y-6">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
            Đồng hành và cung cấp dịch vụ ẩm thực cho các đối tác uy tín
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70">
            {partnerBrands.map((brand, bIdx) => (
              <span
                key={bIdx}
                className="font-bold text-sm tracking-wider text-stone-500 hover:text-stone-900 transition-colors"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          CÂU HỎI THƯỜNG GẶP (FAQ ACCORDION) - GIẢI TỎA MỌI BĂN KHOĂN KHI ĐẶT TIỆC
         ========================================================================= */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Hỗ trợ & giải đáp
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Câu hỏi thường gặp khi đặt tiệc
          </h2>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
            Những thắc mắc phổ biến nhất về khẩu phần bàn tiệc, cơ chế giữ chỗ và hóa đơn VAT.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-stone-200/90 bg-white overflow-hidden shadow-xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/60 transition-colors"
                >
                  <span className="text-sm sm:text-base font-bold text-stone-900">
                    {faq.question}
                  </span>
                  <div className={`h-7 w-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 bg-amber-100 text-amber-800' : ''}`}>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 font-normal">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 via-white to-amber-100/40 p-8 sm:p-14 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Tổ chức tiệc hoàn hảo
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-stone-900">
                Tự thiết kế thực đơn & nhận báo giá ngay
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed max-w-2xl font-normal">
                Trải nghiệm bảng tính chi phí bàn tiệc theo thời gian thực, xem định lượng nguyên liệu xuất kho chi tiết và đặt tiệc trực tuyến minh bạch cùng chuyên gia BanquetHub.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <Link
                to="/dishes"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-6 py-4 text-xs sm:text-sm font-semibold shadow-xs transition-all"
              >
                <span>Mở bảng tính thực đơn</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 px-6 py-4 text-xs sm:text-sm font-semibold transition-all shadow-xs"
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
