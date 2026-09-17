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
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('Đã đăng xuất khỏi phiên Quản trị viên.', 'info');
    navigate('/login');
  };

  const upcomingModules = [
    { label: 'Kho & Phiếu nhập NCC', phase: 'Phase 2', icon: Warehouse },
    { label: 'Đơn đặt tiệc & Giữ tồn', phase: 'Phase 3–4', icon: ClipboardList },
    { label: 'Nhân sự & Bảng lương', phase: 'Phase 6', icon: Users },
    { label: 'Dashboard & Dòng tiền', phase: 'Phase 7', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex bg-stone-100 text-stone-900">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 bg-stone-900 text-stone-200 flex flex-col border-r border-stone-800">
        {/* Brand */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">
                Banquet<span className="text-amber-500">Hub</span>
              </span>
              <span className="block text-[11px] font-medium text-stone-400">
                Admin Control Center
              </span>
            </div>
          </Link>
          <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/30">
            Phase 1
          </span>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Phân hệ đã triển khai (Phase 1)
            </p>
            <nav className="space-y-1">
              <NavLink
                to="/admin/catalog"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`
                }
              >
                <ChefHat className="h-4 w-4 shrink-0" />
                <span>Danh mục món & Công thức</span>
              </NavLink>
            </nav>
          </div>

          <div>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Lộ trình các Phase tiếp theo
            </p>
            <div className="space-y-1">
              {upcomingModules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <div
                    key={mod.label}
                    className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs text-stone-500 border border-transparent select-none"
                    title={`Sẽ triển khai ở ${mod.phase} theo lộ trình ROADMAP.md`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-stone-600" />
                      <span>{mod.label}</span>
                    </span>
                    <span className="rounded-md bg-stone-800 px-1.5 py-0.5 text-[10px] font-medium text-stone-400">
                      {mod.phase}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/60 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{user?.fullName}</p>
              <p className="truncate text-[11px] text-stone-400">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/dishes"
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-1.5 text-xs font-medium text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
            >
              <span>Trang khách</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-900/60 bg-rose-950/50 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-900/60 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-stone-200 px-6 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-stone-900">
              Quản trị Danh mục Món ăn, Nguyên liệu & Công thức Định lượng
            </h1>
            <p className="text-xs text-stone-500">
              Cơ sở kinh doanh duy nhất • Đơn vị tiền tệ VND • Múi giờ Asia/Ho_Chi_Minh
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="http://localhost:8080/swagger-ui.html"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <span>Swagger API</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
