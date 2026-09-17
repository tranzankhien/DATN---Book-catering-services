import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ShieldCheck, LogOut, UserCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getRoleLabel } from '../hooks/useFormatters';

export const PublicLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('Đã đăng xuất khỏi hệ thống.', 'info');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs group-hover:bg-amber-700 transition-colors">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-stone-900">
                  Banquet<span className="text-amber-600">Hub</span>
                </span>
                <span className="block text-[11px] font-medium text-stone-500 -mt-1">
                  Đặt tiệc & Quản trị nhà hàng
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-50 text-amber-800'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`
                }
              >
                Trang chủ
              </NavLink>
              <NavLink
                to="/dishes"
                className={({ isActive }) =>
                  `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-50 text-amber-800'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`
                }
              >
                Danh mục món tiệc
              </NavLink>
              {user?.role === 'ROLE_ADMIN' && (
                <NavLink
                  to="/admin/catalog"
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-stone-900 text-amber-400'
                        : 'text-amber-700 hover:bg-amber-50'
                    }`
                  }
                >
                  <ShieldCheck className="h-4 w-4" />
                  Quản trị hệ thống
                </NavLink>
              )}
            </nav>
          </div>

          {/* Right Auth Area */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5">
                  <UserCircle2 className="h-5 w-5 text-amber-600" />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-stone-900 leading-tight">
                      {user.fullName}
                    </p>
                    <p className="text-[11px] text-stone-500 leading-tight">
                      {getRoleLabel(user.role)}
                    </p>
                  </div>
                </div>
                {user.role === 'ROLE_ADMIN' && (
                  <Link
                    to="/admin/catalog"
                    className="md:hidden inline-flex items-center gap-1 rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-amber-400"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 hover:text-rose-700 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-amber-700 transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile sub-nav */}
        <div className="flex md:hidden border-t border-stone-100 px-4 py-2 gap-3 bg-stone-50/70">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-xs font-semibold px-2.5 py-1 rounded-md ${
                isActive ? 'bg-amber-600 text-white' : 'text-stone-600'
              }`
            }
          >
            Trang chủ
          </NavLink>
          <NavLink
            to="/dishes"
            className={({ isActive }) =>
              `text-xs font-semibold px-2.5 py-1 rounded-md ${
                isActive ? 'bg-amber-600 text-white' : 'text-stone-600'
              }`
            }
          >
            Danh mục món ăn
          </NavLink>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-amber-600" />
            <span className="font-semibold text-stone-800">BanquetHub MVP (SRS-PARTY-001)</span>
            <span>— Nền tảng đặt tiệc tích hợp quản lý cơ sở kinh doanh (01 cơ sở • VND • UTC+7)</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dishes" className="hover:text-amber-700">
              Thực đơn món tiệc
            </Link>
            <a
              href="http://localhost:8080/swagger-ui.html"
              target="_blank"
              rel="noreferrer"
              className="hover:text-amber-700"
            >
              OpenAPI Swagger
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
