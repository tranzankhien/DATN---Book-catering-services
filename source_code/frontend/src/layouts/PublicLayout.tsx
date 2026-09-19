import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  ShieldCheck,
  LogOut,
  UserCircle2,
  Phone,
  Clock,
  MapPin,
  Menu,
  X,
  ExternalLink,
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
    showToast('Đã đăng xuất khỏi hệ thống.', 'info');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {/* Top utility strip */}
      <div className="border-b border-stone-200/80 bg-stone-100/90 py-1.5 px-4 sm:px-6 lg:px-8 text-xs text-stone-600">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-5">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-stone-700 font-medium">
              <MapPin className="h-3.5 w-3.5 text-amber-700" />
              Cơ sở Yến Tiệc & Hội Nghị BanquetHub
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-stone-500">
              <Clock className="h-3.5 w-3.5 text-amber-700" />
              08:00 – 21:30 (Thứ 2 – Chủ Nhật)
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a
              href="tel:19008899"
              className="inline-flex items-center gap-1 font-bold text-amber-800 hover:text-amber-900 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              Hotline tư vấn: 1900 8899
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-stone-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-18">
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-700 text-white shadow-xs group-hover:bg-amber-800 transition-colors">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-stone-900">
                  Banquet<span className="text-amber-700">Hub</span>
                </span>
                <span className="rounded-md bg-amber-100 text-amber-800 px-1.5 py-0.2 text-[10px] font-bold tracking-wide uppercase">
                  MVP
                </span>
              </div>
              <p className="text-[11px] font-medium text-stone-500 -mt-0.5">
                Nền tảng Đặt tiệc & Quản lý ẩm thực
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-amber-50 text-amber-900'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
                }`
              }
            >
              Trang chủ
            </NavLink>
            <NavLink
              to="/dishes"
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-amber-50 text-amber-900'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
                }`
              }
            >
              Thực đơn món tiệc
            </NavLink>
            {user?.role === 'ROLE_ADMIN' && (
              <NavLink
                to="/admin/catalog"
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold transition-colors ${
                    isActive
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`
                }
              >
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                <span>Quản trị Admin</span>
              </NavLink>
            )}
          </nav>

          {/* User Auth Section */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5">
                  <UserCircle2 className="h-5 w-5 text-amber-700" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-stone-900 leading-tight">
                      {user.fullName}
                    </p>
                    <p className="text-[11px] font-medium text-stone-500 leading-tight">
                      {getRoleLabel(user.role)}
                    </p>
                  </div>
                </div>

                {user.role === 'ROLE_ADMIN' && (
                  <Link
                    to="/admin/catalog"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-stone-800 transition-colors shadow-xs"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                    <span>Admin</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-800 transition-colors"
                >
                  Đăng ký tài khoản
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
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            >
              Trang chủ
            </NavLink>
            <NavLink
              to="/dishes"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            >
              Thực đơn món tiệc
            </NavLink>
            {user?.role === 'ROLE_ADMIN' && (
              <NavLink
                to="/admin/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-bold text-amber-800 hover:bg-amber-50"
              >
                Quản trị Admin
              </NavLink>
            )}

            <div className="border-t border-stone-100 pt-2 flex gap-2">
              {isAuthenticated && user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full rounded-lg bg-stone-100 py-2 text-xs font-bold text-rose-600"
                >
                  Đăng xuất ({user.fullName})
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center rounded-lg border border-stone-200 py-2 text-xs font-bold text-stone-700"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center rounded-lg bg-amber-700 py-2 text-xs font-bold text-white"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Clean Light Footer */}
      <footer className="border-t border-stone-200 bg-white mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-700 text-white">
                  <UtensilsCrossed className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold text-stone-900">
                  Banquet<span className="text-amber-700">Hub</span>
                </span>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed max-w-sm">
                Nền tảng đặt tiệc tích hợp quản lý cơ sở kinh doanh theo chuẩn MVP.
                Định lượng nguyên liệu minh bạch cho 01 phần món, liên kết trực tiếp với kho nguyên liệu trung tâm.
              </p>
            </div>

            <div className="lg:col-span-3 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Liên kết nhanh
              </h4>
              <ul className="space-y-1.5 text-xs text-stone-600">
                <li>
                  <Link to="/" className="hover:text-amber-800 transition-colors">Trang chủ</Link>
                </li>
                <li>
                  <Link to="/dishes" className="hover:text-amber-800 transition-colors">Danh mục món & Bảng tính giá</Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-amber-800 transition-colors">Đăng nhập tài khoản</Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-amber-800 transition-colors">Đăng ký khách hàng</Link>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Tiêu chuẩn kỹ thuật
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Đặc tả phần mềm: <strong>SRS-PARTY-001</strong><br />
                Đơn vị tiền tệ: <strong>VND</strong> • Múi giờ: <strong>Asia/Ho_Chi_Minh</strong>
              </p>
              <div className="pt-1">
                <a
                  href="http://localhost:8080/swagger-ui.html"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900"
                >
                  <span>Mở OpenAPI Swagger (Port 8080)</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
            <p>© 2026 BanquetHub. Đồ án tốt nghiệp ngành Công nghệ thông tin.</p>
            <p>Modular Monolith • Spring Boot 3.5 • PostgreSQL 17 • React 19</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
