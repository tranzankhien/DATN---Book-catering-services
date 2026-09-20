import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  ChefHat,
  Warehouse,
  ClipboardList,
  Users,
  BarChart3,
  LogOut,
  ShieldCheck,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Trạng thái thu gọn/mở rộng sidebar (lưu trong localStorage)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('banquethub_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('banquethub_admin_sidebar_collapsed', String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    showToast('Đã đăng xuất khỏi phiên Quản trị viên an toàn.', 'info');
    navigate('/login');
  };

  const upcomingModules = [
    { label: 'Kho & Phiếu Nhập NCC', phase: 'Phase 2', icon: Warehouse },
    { label: 'Đơn Tiệc & Giữ Tồn 15p', phase: 'Phase 3–4', icon: ClipboardList },
    { label: 'Nhân Sự & Bảng Lương', phase: 'Phase 6', icon: Users },
    { label: 'Dashboard Dòng Tiền', phase: 'Phase 7', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex bg-stone-50 text-stone-900">
      {/* Executive Collapsible Sidebar */}
      <aside
        className={`shrink-0 bg-stone-900 text-stone-200 border-r border-stone-800 flex flex-col justify-between transition-all duration-300 ease-in-out relative z-30 select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Brand Header & Toggle Button */}
          <div
            className={`h-16 border-b border-stone-800 flex items-center px-4 ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <Link
              to="/"
              className={`flex items-center gap-2.5 overflow-hidden transition-all duration-300 ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title="Về trang chủ BanquetHub"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm font-bold">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden whitespace-nowrap transition-opacity duration-200">
                  <span className="text-base font-extrabold text-white tracking-tight">
                    BANQUET<span className="text-amber-400">HUB</span>
                  </span>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 -mt-0.5">
                    Quản Trị Nhà Hàng
                  </span>
                </div>
              )}
            </Link>

            {/* In-sidebar Toggle Button when expanded */}
            {!isCollapsed && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                title="Thu gọn thanh điều hướng (Sidebar)"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* System Status Pill */}
          <div className="px-3 pt-3">
            <div
              className={`rounded-xl border border-stone-800 bg-stone-950/60 p-2.5 flex items-center transition-all ${
                isCollapsed ? 'justify-center' : 'justify-between'
              }`}
              title="Hệ thống cơ sở: Phase 1 Live (PostgreSQL 17)"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                {!isCollapsed && (
                  <span className="text-[11px] font-semibold text-stone-300 whitespace-nowrap">
                    Trực tuyến
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <span className="text-[10px] font-mono text-amber-400 whitespace-nowrap">
                  v1.0 Ready
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-3 space-y-4">
            <div>
              {!isCollapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 whitespace-nowrap">
                  Phân hệ quản trị
                </p>
              )}
              <nav className="space-y-1">
                <NavLink
                  to="/admin/catalog"
                  className={({ isActive }) =>
                    `flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                      isCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3'
                    } ${
                      isActive
                        ? 'bg-amber-700 text-white shadow-sm'
                        : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                    }`
                  }
                  title="Danh Mục Món Ăn & Định Lượng Công Thức"
                >
                  <ChefHat className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                  {!isCollapsed && (
                    <span className="whitespace-nowrap truncate">Danh Mục Món & Công Thức</span>
                  )}
                </NavLink>
              </nav>
            </div>

            <div>
              {!isCollapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 whitespace-nowrap">
                  Kế hoạch mở rộng
                </p>
              )}
              <div className="space-y-1">
                {upcomingModules.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <div
                      key={mod.label}
                      className={`flex items-center rounded-lg py-2 text-xs text-stone-400 select-none hover:bg-stone-800/40 transition-colors ${
                        isCollapsed ? 'justify-center px-0' : 'justify-between px-3'
                      }`}
                      title={`${mod.label} (${mod.phase})`}
                    >
                      <span className="flex items-center gap-2.5 overflow-hidden">
                        <Icon className="h-4 w-4 text-stone-500 shrink-0" />
                        {!isCollapsed && (
                          <span className="font-medium text-stone-300 whitespace-nowrap truncate">
                            {mod.label}
                          </span>
                        )}
                      </span>
                      {!isCollapsed && (
                        <span className="rounded bg-stone-800 px-1.5 py-0.5 text-[9px] font-mono text-stone-400 shrink-0">
                          {mod.phase}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* User Footer Card */}
        <div className="p-3 border-t border-stone-800 bg-stone-950/40 m-2.5 rounded-xl space-y-2">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white">{user?.fullName}</p>
                  <p className="truncate text-[10px] text-stone-400 font-mono">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <Link
                  to="/dishes"
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-stone-800 bg-stone-900 px-2 py-1.5 text-[11px] font-semibold text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
                  title="Xem giao diện khách hàng"
                >
                  <span>Trang Khách</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-900/40 bg-rose-950/30 px-2 py-1.5 text-[11px] font-semibold text-rose-300 hover:bg-rose-900/50 transition-colors cursor-pointer"
                  title="Đăng xuất khỏi hệ thống"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Đăng Xuất</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20"
                title={`${user?.fullName} (${user?.email})`}
              >
                <ShieldCheck className="h-4 w-4" />
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Executive Header Bar */}
        <header className="h-16 border-b border-stone-200 bg-white px-6 sm:px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            {/* Toggle Button on Header (Special convenience when collapsed) */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors cursor-pointer shadow-xs"
              title={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
              aria-label="Toggle Sidebar"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4 text-amber-700" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span>Quản Trị Nhà Hàng</span>
                <span>/</span>
                <span className="font-semibold text-stone-900">Danh Mục Món Ăn, Nguyên Liệu & Công Thức</span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                01 Cơ sở tiệc độc bản • 01 Kho nguyên liệu • Tiền tệ VND • Giờ Việt Nam (UTC+7)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dishes"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <span>Xem trang khách</span>
              <ExternalLink className="h-3 w-3" />
            </Link>

            <a
              href="http://localhost:8080/swagger-ui.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-400 transition-colors shadow-xs"
            >
              <span>Tài liệu API</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </header>

        {/* Viewport content */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
