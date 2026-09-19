import React from 'react';
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
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('Đã đăng xuất khỏi phiên Quản trị viên an toàn.', 'info');
    navigate('/login');
  };

  const upcomingModules = [
    { label: 'Kho & Phiếu Nhập NCC', phase: 'Phase 2', icon: Warehouse },
    { label: 'Đơn Đặt Tiệc & Giữ Tồn 15p', phase: 'Phase 3–4', icon: ClipboardList },
    { label: 'Nhân Sự & Bảng Lương', phase: 'Phase 6', icon: Users },
    { label: 'Dashboard Lợi Nhuận & Dòng Tiền', phase: 'Phase 7', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex bg-stone-50 text-stone-900">
      {/* Executive Sidebar */}
      <aside className="w-64 shrink-0 bg-stone-900 text-stone-200 border-r border-stone-800 flex flex-col justify-between">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-stone-800 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm font-bold">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <span className="text-base font-extrabold text-white tracking-tight">
                  BANQUET<span className="text-amber-400">HUB</span>
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Admin Console
                </span>
              </div>
            </Link>
          </div>

          {/* System Status Pill */}
          <div className="mx-3.5 my-3.5 rounded-xl border border-stone-800 bg-stone-950/60 p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold text-stone-300">Phase 1 • Live</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400">PostgreSQL 17</span>
          </div>

          {/* Nav Links */}
          <div className="px-3 py-2 space-y-5">
            <div>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Phân hệ đã hoạt động
              </p>
              <nav className="space-y-1">
                <NavLink
                  to="/admin/catalog"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-amber-700 text-white shadow-sm'
                        : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                    }`
                  }
                >
                  <ChefHat className="h-4 w-4 shrink-0" />
                  <span>Danh Mục Món & Công Thức</span>
                </NavLink>
              </nav>
            </div>

            <div>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Lộ trình tiếp theo (Phase 2–7)
              </p>
              <div className="space-y-1">
                {upcomingModules.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <div
                      key={mod.label}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-stone-400 select-none hover:bg-stone-800/40"
                      title={`Kế hoạch triển khai tại ${mod.phase} theo SRS-PARTY-001`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-stone-500" />
                        <span className="font-medium text-stone-300">{mod.label}</span>
                      </span>
                      <span className="rounded bg-stone-800 px-1.5 py-0.5 text-[9px] font-mono text-stone-400">
                        {mod.phase}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* User Footer Card */}
        <div className="p-3.5 border-t border-stone-800 bg-stone-950/40 space-y-2.5 m-3 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{user?.fullName}</p>
              <p className="truncate text-[10px] text-stone-400 font-mono">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <Link
              to="/dishes"
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-stone-800 bg-stone-900 px-2.5 py-1.5 text-[11px] font-semibold text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <span>Trang Khách</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-900/40 bg-rose-950/30 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300 hover:bg-rose-900/50 transition-colors cursor-pointer"
            >
              <LogOut className="h-3 w-3" />
              <span>Đăng Xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Executive Header Bar */}
        <header className="h-16 border-b border-stone-200 bg-white px-8 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span>Admin Console</span>
              <span>/</span>
              <span className="font-semibold text-stone-900">Danh Mục Món Ăn, Nguyên Liệu & Công Thức</span>
            </div>
            <p className="text-[11px] text-stone-500">
              01 Cơ sở tiệc độc bản • 01 Kho nguyên liệu • Tiền tệ VND • Giờ Việt Nam (UTC+7)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="http://localhost:8080/swagger-ui.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-400 transition-colors shadow-xs"
            >
              <span>Swagger API Docs</span>
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
