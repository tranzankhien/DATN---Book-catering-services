import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  ChefHat,
  Warehouse,
  ClipboardList,
  Users,
  BarChart3,
  ArrowUpRight,
  LogOut,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Circle,
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
    <div className="min-h-screen flex bg-stone-950 text-stone-100">
      {/* Executive Sidebar */}
      <aside className="w-72 shrink-0 bg-stone-900/90 border-r border-stone-800/80 flex flex-col justify-between backdrop-blur-xl">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-stone-800/80 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 shadow-md">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <span className="text-base font-black font-serif-luxury text-white tracking-tight">
                  BANQUET<span className="gold-gradient-text">HUB</span>
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Admin Console
                </span>
              </div>
            </Link>
          </div>

          {/* System Status Pill */}
          <div className="mx-4 my-4 rounded-2xl border border-stone-800 bg-stone-950/70 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold text-stone-300">Phase 1 • Live</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400">PostgreSQL 17</span>
          </div>

          {/* Nav Links */}
          <div className="px-4 py-2 space-y-6">
            <div>
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                Phân hệ đã hoạt động
              </p>
              <nav className="space-y-1">
                <NavLink
                  to="/admin/catalog"
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-lg shadow-amber-500/20'
                        : 'text-stone-300 hover:bg-stone-800/60 hover:text-white'
                    }`
                  }
                >
                  <ChefHat className="h-4 w-4 shrink-0" />
                  <span>Danh Mục Món & Công Thức</span>
                </NavLink>
              </nav>
            </div>

            <div>
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                Lộ trình tiếp theo (Phase 2–7)
              </p>
              <div className="space-y-1">
                {upcomingModules.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <div
                      key={mod.label}
                      className="flex items-center justify-between rounded-2xl px-4 py-2.5 text-xs text-stone-500 select-none border border-transparent"
                      title={`Kế hoạch triển khai tại ${mod.phase} theo SRS-PARTY-001`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-stone-600" />
                        <span className="font-medium text-stone-400">{mod.label}</span>
                      </span>
                      <span className="rounded-md bg-stone-800/80 px-2 py-0.5 text-[9px] font-mono text-stone-400">
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
        <div className="p-4 border-t border-stone-800/80 bg-stone-950/80 space-y-3 m-3 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{user?.fullName}</p>
              <p className="truncate text-[10px] text-amber-400 font-mono">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              to="/dishes"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-800 bg-stone-900 px-3 py-2 text-[11px] font-bold text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <span>Trang Khách</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-900/40 bg-rose-950/30 px-3 py-2 text-[11px] font-bold text-rose-400 hover:bg-rose-950/60 transition-colors cursor-pointer"
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
        <header className="h-20 border-b border-stone-800/80 bg-stone-950/90 backdrop-blur-xl px-8 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <span>Admin Console</span>
              <span>/</span>
              <span className="font-bold text-amber-400">Danh Mục Món Ăn, Nguyên Liệu & Công Thức</span>
            </div>
            <p className="text-[11px] text-stone-400">
              01 Cơ sở tiệc độc bản • 01 Kho nguyên liệu • Tiền tệ VND • Giờ Việt Nam (UTC+7)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="http://localhost:8080/swagger-ui.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-stone-800 bg-stone-900/80 px-4 py-2 text-xs font-bold text-stone-300 hover:text-amber-400 hover:border-amber-500/40 transition-all shadow-sm"
            >
              <span>Tài liệu Swagger API</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </header>

        {/* Viewport content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
