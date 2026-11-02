import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Phone,
  LogOut,
  UserCircle2,
  Menu,
  X,
  ShieldCheck,
  ChevronDown,
  Mail,
  Award,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Logo } from '../components/ui/Logo';

export const PublicLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setUserDropdownOpen(false);
    logout();
    showToast('Đã đăng xuất khỏi tài khoản an toàn.', 'info');
    navigate('/login');
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'Quản trị viên';
      case 'ROLE_EMPLOYEE':
        return 'Nhân viên';
      case 'ROLE_USER':
        return 'Khách hàng';
      default:
        return 'Khách';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfa] text-stone-900 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/95 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-20">
          {/* Logo Brand với biểu tượng riêng biệt, chỉn chu */}
          <Logo size="md" />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-50 text-amber-900 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                }`
              }
            >
              Trang chủ
            </NavLink>
            <NavLink
              to="/menus"
              className={({ isActive }) =>
                `rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-50 text-amber-900 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                }`
              }
            >
              Thực đơn mẫu
            </NavLink>
            <NavLink
              to="/menu-builder"
              className={({ isActive }) =>
                `rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-50 text-amber-900 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                }`
              }
            >
              Tự phối thực đơn
            </NavLink>
            <NavLink
              to="/dishes"
              className={({ isActive }) =>
                `rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-50 text-amber-900 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                }`
              }
            >
              Món tiệc
            </NavLink>
          </nav>

          {/* User Auth Section */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50/80 px-3.5 py-2 transition-all cursor-pointer shadow-xs hover:border-stone-300"
                >
                  <UserCircle2 className="h-5 w-5 text-amber-800" />
                  <span className="text-xs font-semibold text-stone-900 max-w-36 truncate">
                    {user.fullName}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-stone-200 bg-white py-2 shadow-xl shadow-stone-900/10 z-50 animate-fade-up-1">
                    <div className="px-4 py-2.5 border-b border-stone-100">
                      <p className="text-xs font-bold text-stone-900 truncate">{user.fullName}</p>
                      <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 text-[10px] font-semibold">
                        {getRoleLabel(user.role)}
                      </span>
                    </div>

                    <Link
                      to="/my-orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-stone-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                    >
                      <Award className="h-4 w-4 text-amber-800" />
                      <span>Đơn đặt tiệc của tôi</span>
                    </Link>

                    {user.role === 'ROLE_EMPLOYEE' && (
                      <Link
                        to="/employee/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-stone-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                      >
                        <ShieldCheck className="h-4 w-4 text-amber-800" />
                        <span>Lịch điều phối bếp</span>
                      </Link>
                    )}

                    {user.role === 'ROLE_ADMIN' && (
                      <Link
                        to="/admin/catalog"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-stone-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                      >
                        <ShieldCheck className="h-4 w-4 text-amber-800" />
                        <span>Bảng quản trị hệ thống</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="rounded-xl border border-stone-300 bg-white px-4.5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-all shadow-xs"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-amber-800 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-900 transition-all"
                >
                  Đăng ký thành viên
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-stone-200 p-2 text-stone-600 hover:bg-stone-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-stone-200 bg-white px-4 py-3 space-y-2">
            <NavLink
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              Trang chủ
            </NavLink>
            <NavLink
              to="/menus"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              Thực đơn mẫu
            </NavLink>
            <NavLink
              to="/menu-builder"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              Tự phối thực đơn
            </NavLink>
            <NavLink
              to="/dishes"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              Món tiệc
            </NavLink>

            <div className="border-t border-stone-100 pt-2 flex flex-col gap-2">
              {isAuthenticated && user ? (
                <>
                  {user.role === 'ROLE_ADMIN' && (
                    <Link
                      to="/admin/catalog"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-2 text-xs font-medium text-stone-800"
                    >
                      <ShieldCheck className="h-4 w-4 text-amber-800" />
                      <span>Bảng quản trị hệ thống</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600"
                  >
                    Đăng xuất ({user.fullName})
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-1">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center rounded-lg border border-stone-200 py-2 text-xs font-semibold text-stone-700"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center rounded-lg bg-amber-800 py-2 text-xs font-semibold text-white"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* =========================================================================
          LIGHT CORPORATE FOOTER - ĐỒNG ĐIỆU MÀU SẮC, SANG TRỌNG, KHÔNG BỊ LỆCH TONE
         ========================================================================= */}
      <footer className="mt-24 border-t border-stone-200/90 bg-[#faf8f5] text-stone-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            {/* Cột 1: Logo mới & Pháp lý doanh nghiệp */}
            <div className="lg:col-span-4 space-y-4">
              <Logo size="md" variant="dark" />

              <p className="text-xs text-stone-500 leading-relaxed pt-1">
                Nền tảng chuẩn hóa công thức định lượng nguyên liệu và tự động tính toán chi phí bàn tiệc theo thời gian thực tại Việt Nam.
              </p>

              {/* Thông tin pháp lý & Giấy phép */}
              <div className="pt-2 space-y-1.5 text-[11px] text-stone-500 border-t border-stone-200/70">
                <p><strong>Công ty Cổ phần Công nghệ Yến tiệc BanquetHub</strong></p>
                <p>Mã số doanh nghiệp: <span className="font-semibold text-stone-700 tabular-nums">0318999888</span> do Sở KH&ĐT TP.HCM cấp</p>
                <p>Giấy phép ATTP: <span className="font-semibold text-stone-700 tabular-nums">2468/2026/ATTP-HCM</span></p>
              </div>

              {/* Huy hiệu bảo đảm & tin cậy (Light Elegant Badges) */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-stone-200/80 px-2.5 py-1 text-[10px] font-medium text-stone-700 shadow-2xs">
                  <Award className="h-3.5 w-3.5 text-amber-800" />
                  <span>Tiêu chuẩn HACCP & ISO 22000</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-stone-200/80 px-2.5 py-1 text-[10px] font-medium text-emerald-700 shadow-2xs">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Bảo mật giao dịch SSL</span>
                </span>
              </div>
            </div>

            {/* Cột 2: Giải pháp & Dịch vụ yến tiệc */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Dịch vụ & Loại hình tiệc
              </h4>
              <ul className="space-y-2.5 text-xs text-stone-600">
                <li>
                  <Link to="/dishes" className="hover:text-amber-800 transition-colors">
                    Tiệc bàn Set Menu truyền thống (10 khách/bàn)
                  </Link>
                </li>
                <li>
                  <Link to="/dishes" className="hover:text-amber-800 transition-colors">
                    Tiệc cưới yến tiệc cao cấp
                  </Link>
                </li>
                <li>
                  <Link to="/dishes" className="hover:text-amber-800 transition-colors">
                    Tiệc hội nghị & Gala Dinner doanh nghiệp
                  </Link>
                </li>
                <li>
                  <Link to="/dishes" className="hover:text-amber-800 transition-colors">
                    Tiệc thôi nôi, sinh nhật & mừng thọ
                  </Link>
                </li>
                <li>
                  <Link to="/dishes" className="hover:text-amber-800 transition-colors">
                    Dịch vụ đầu bếp & phục vụ tiệc tận nơi
                  </Link>
                </li>
              </ul>
            </div>

            {/* Cột 3: Khách hàng & Chính sách minh bạch */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Chính sách & Hỗ trợ
              </h4>
              <ul className="space-y-2.5 text-xs text-stone-600">
                <li>
                  <Link to="/dishes" className="hover:text-amber-800 transition-colors">
                    Quy trình đặt tiệc & giữ chỗ 15 phút
                  </Link>
                </li>
                <li>
                  <Link to="/dishes" className="hover:text-amber-800 transition-colors">
                    Bảng tính giá & minh bạch định lượng
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-amber-800 transition-colors">
                    Chính sách đặt cọc & thanh toán trực tuyến
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-amber-800 transition-colors">
                    Xuất hóa đơn VAT điện tử
                  </Link>
                </li>
                <li>
                  <span className="hover:text-amber-800 transition-colors cursor-pointer">
                    Cam kết chất lượng & bồi hoàn
                  </span>
                </li>
              </ul>
            </div>

            {/* Cột 4: Hệ thống liên hệ & Chi nhánh */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Liên hệ & Chi nhánh
              </h4>
              <div className="space-y-2.5 text-xs text-stone-600 leading-relaxed">
                <div>
                  <p className="font-semibold text-stone-800">Trụ sở chính (TP.HCM):</p>
                  <p className="text-[11px] text-stone-500">Tòa nhà BanquetHub, 120 Nguyễn Thị Minh Khai, Phường Võ Thị Sáu, Quận 3, TP.HCM</p>
                </div>
                <div>
                  <p className="font-semibold text-stone-800">Chi nhánh Hà Nội:</p>
                  <p className="text-[11px] text-stone-500">Tầng 6, Tháp Doanh Nhân, Số 1 Thái Hà, Quận Đống Đa, Hà Nội</p>
                </div>
                <div className="pt-1 space-y-1 text-[11px]">
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-amber-800" />
                    <span>Hotline: <strong className="text-stone-800 font-semibold">1900 8899</strong> (08:00 – 21:00)</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-amber-800" />
                    <span>Email: <strong className="text-stone-800 font-semibold">cskh@banquethub.vn</strong></span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="mt-12 pt-8 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-400">
            <p>© 2026 BanquetHub Corporation. All rights reserved. Tiên phong giải pháp công nghệ yến tiệc & catering minh bạch tại Việt Nam.</p>
            <div className="flex items-center gap-4 text-stone-500">
              <span className="hover:text-stone-800 cursor-pointer transition-colors">Điều khoản dịch vụ</span>
              <span>•</span>
              <span className="hover:text-stone-800 cursor-pointer transition-colors">Chính sách bảo mật</span>
              <span>•</span>
              <span className="hover:text-stone-800 cursor-pointer transition-colors">Tiêu chuẩn VSATTP</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
