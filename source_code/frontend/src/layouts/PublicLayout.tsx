import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  ShieldCheck,
  LogOut,
  UserCircle2,
  Sparkles,
  Phone,
  Clock,
  MapPin,
  ChevronRight,
  Menu,
  X,
  Layers,
  ChefHat,
  Award,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getRoleLabel } from '../hooks/useFormatters';

export const PublicLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    showToast('Đã đăng xuất khỏi hệ thống an toàn.', 'info');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-950 text-stone-100 selection:bg-amber-500 selection:text-stone-950">
      {/* Top Luxury Announcement Bar */}
      <div className="border-b border-amber-900/30 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 py-2 px-4 sm:px-8 text-[11px] text-stone-400">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-amber-400 font-medium">
              <Award className="h-3.5 w-3.5" />
              Nền tảng Yến Tiệc & Hội Nghị Tiêu Chuẩn 5 Sao
            </span>
            <span className="inline-flex items-center gap-1 text-stone-400">
              <MapPin className="h-3 w-3 text-amber-500" />
              01 Cơ sở Tiệc Độc Bản • 01 Kho Trung Tâm
            </span>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden md:inline-flex items-center gap-1.5 text-stone-400">
              <Clock className="h-3 w-3 text-amber-500" />
              Giờ phục vụ: 08:00 – 22:00 (Hằng ngày)
            </span>
            <a
              href="tel:19008899"
              className="inline-flex items-center gap-1 font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <Phone className="h-3 w-3" />
              Hotline: 1900 8899
            </a>
          </div>
        </div>
      </div>

      {/* Main Glassmorphism Header */}
      <header className="sticky top-0 z-40 border-b border-stone-800/80 bg-stone-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-transform duration-300 group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-stone-950">
                <UtensilsCrossed className="h-5 w-5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight font-serif-luxury text-white">
                  BANQUET<span className="gold-gradient-text">HUB</span>
                </span>
                <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-black uppercase text-amber-400 tracking-wider">
                  LUXURY
                </span>
              </div>
              <p className="text-[10px] font-medium tracking-wider uppercase text-stone-400 -mt-0.5">
                Nền tảng Quản trị & Đặt tiệc
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 bg-stone-900/60 p-1.5 rounded-2xl border border-stone-800/60 shadow-inner">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-500/20'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                }`
              }
            >
              Trang Chủ
            </NavLink>
            <NavLink
              to="/dishes"
              className={({ isActive }) =>
                `rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-500/20'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                }`
              }
            >
              Danh Mục Món Tiệc
            </NavLink>
            {user?.role === 'ROLE_ADMIN' && (
              <NavLink
                to="/admin/catalog"
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30 shadow-md'
                      : 'text-amber-400 hover:bg-amber-400/10'
                  }`
                }
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Khu Vực Quản Trị</span>
              </NavLink>
            )}
          </nav>

          {/* Right User Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 rounded-2xl border border-stone-800 bg-stone-900/80 px-3.5 py-1.5 shadow-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 text-amber-400 border border-amber-500/30">
                    <UserCircle2 className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-stone-100 leading-tight">
                      {user.fullName}
                    </p>
                    <p className="text-[10px] font-semibold text-amber-400 leading-tight">
                      {getRoleLabel(user.role)}
                    </p>
                  </div>
                </div>

                {user.role === 'ROLE_ADMIN' && (
                  <Link
                    to="/admin/catalog"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-2 text-xs font-bold text-stone-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-500/20"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-900/60 px-3 py-2 text-xs font-semibold text-stone-400 hover:text-rose-400 hover:border-rose-900/40 transition-colors cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-2.5 text-xs font-bold text-stone-200 hover:bg-stone-800 hover:text-white transition-colors"
                >
                  Đăng Nhập
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 px-4 py-2.5 text-xs font-black text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:scale-102 transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Đăng Ký Khách</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-stone-800 bg-stone-900 p-2 text-stone-300"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-stone-800 bg-stone-950/95 px-4 py-4 space-y-3">
            <NavLink
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm font-semibold text-stone-300 hover:bg-stone-900"
            >
              Trang Chủ
            </NavLink>
            <NavLink
              to="/dishes"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm font-semibold text-stone-300 hover:bg-stone-900"
            >
              Danh Mục Món Tiệc
            </NavLink>
            {user?.role === 'ROLE_ADMIN' && (
              <NavLink
                to="/admin/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-3 py-2 text-sm font-semibold text-amber-400 hover:bg-stone-900"
              >
                Quản Trị Admin Panel
              </NavLink>
            )}

            <div className="border-t border-stone-800 pt-3 flex gap-2">
              {isAuthenticated && user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full rounded-xl bg-stone-900 border border-stone-800 py-2.5 text-xs font-bold text-rose-400"
                >
                  Đăng Xuất ({user.fullName})
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center rounded-xl border border-stone-800 py-2.5 text-xs font-bold text-stone-200"
                  >
                    Đăng Nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-stone-950"
                  >
                    Đăng Ký
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Render */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* High-end Luxury Footer */}
      <footer className="border-t border-stone-800/80 bg-stone-950 mt-24 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
            {/* Col 1: Brand Info */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 font-black">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <span className="text-2xl font-black font-serif-luxury tracking-tight text-white">
                  BANQUET<span className="gold-gradient-text">HUB</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-md">
                Nền tảng đặt tiệc tích hợp quản lý cơ sở kinh doanh độc bản. Tối ưu hóa định lượng
                nguyên liệu, kết nối thời gian thực giữa thực đơn bàn tiệc và tồn kho trung tâm
                theo đặc tả <strong>SRS-PARTY-001</strong>.
              </p>
              <div className="flex items-center gap-3 pt-2 text-xs text-stone-400">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 border border-stone-800 px-3 py-1.5">
                  <ChefHat className="h-3.5 w-3.5 text-amber-400" />
                  Định Lượng Chuẩn Cho 01 Phần Món
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 border border-stone-800 px-3 py-1.5">
                  <Layers className="h-3.5 w-3.5 text-amber-400" />
                  Đồng Bộ Tồn Khả Dụng
                </span>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Hệ Thống Tiệc
              </h4>
              <ul className="space-y-2 text-xs text-stone-400">
                <li>
                  <Link to="/" className="hover:text-amber-400 transition-colors">
                    Trang chủ BanquetHub
                  </Link>
                </li>
                <li>
                  <Link to="/dishes" className="hover:text-amber-400 transition-colors">
                    Danh mục món ăn & Định lượng
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-amber-400 transition-colors">
                    Đăng nhập khách hàng / Quản trị
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-amber-400 transition-colors">
                    Đăng ký tài khoản tiệc mới
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Tech & Standards */}
            <div className="lg:col-span-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Tiêu Chuẩn Vận Hành
              </h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Đơn vị tiền tệ: <strong>VND</strong> • Múi giờ hệ thống: <strong>Asia/Ho_Chi_Minh (UTC+7)</strong>
                <br />
                Áp dụng quy tắc tính giá: <code className="text-amber-300">Tổng tiền = Số bàn × Giá thực đơn 01 bàn</code>
              </p>
              <div className="pt-2">
                <a
                  href="http://localhost:8080/swagger-ui.html"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2 text-xs font-semibold text-stone-300 hover:text-amber-400 hover:border-amber-500/40 transition-all"
                >
                  <span>Cổng API Swagger / OpenAPI</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-stone-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-400">
            <p>© 2026 BanquetHub Luxury Catering & Convention. Bản quyền phần mềm đồ án tốt nghiệp CNTT.</p>
            <p className="font-mono text-stone-400">
              Modular Monolith • Spring Boot 3.5.16 • PostgreSQL 17 • React 19
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
