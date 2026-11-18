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
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Boxes,
  Receipt,
  History,
  Truck,
  Package,
  CalendarDays,
  Utensils,
  LayoutDashboard,
  CreditCard,
  PackageCheck,
  CalendarRange,
  Banknote,
  UserCheck,
  TrendingUp,
  PieChart,
  Activity,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Logo } from '../components/ui/Logo';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // isPinned: Nếu true -> Sidebar luôn mở cố định (w-64).
  // Nếu false -> Sidebar ở chế độ Rail (w-20) và tự động bung mở (w-64) khi người dùng rê chuột vào.
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('banquethub_admin_sidebar_pinned');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  // isHovered: Đang rê chuột vào sidebar khi ở chế độ unpinned
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Sidebar mở nếu đang được Ghim HOẶC đang được rê chuột vào
  const isOpen = isPinned || isHovered;

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('banquethub_admin_sidebar_pinned', String(next));
      } catch {
        // ignore
      }
      showToast(
        next
          ? 'Đã ghim mở rộng thanh điều hướng cố định.'
          : 'Đã bật chế độ tự động mở rộng khi rê chuột (Hover to expand).',
        'info'
      );
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    showToast('Đã đăng xuất khỏi phiên Quản trị viên an toàn.', 'info');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-stone-50 text-stone-900 font-sans">
      {/* Executive Floating/Docked Sidebar with Auto/Pinned Expand */}
      <aside
        onMouseEnter={() => !isPinned && setIsHovered(true)}
        onMouseLeave={() => !isPinned && setIsHovered(false)}
        className={`sticky top-0 h-screen shrink-0 bg-stone-900 text-stone-200 border-r border-stone-800 flex flex-col justify-between z-30 transition-all duration-300 ease-in-out select-none overflow-y-auto overflow-x-hidden ${
          isOpen
            ? 'w-64 shadow-xl'
            : 'w-20 shadow-sm'
        }`}
      >
          <div>
            {/* Brand Header */}
            <div
              className={`h-16 border-b border-stone-800 flex items-center px-3.5 transition-all ${
                isOpen ? 'justify-between' : 'justify-center'
              }`}
            >
              {isOpen ? (
                <Logo size="sm" variant="light" />
              ) : (
                <Link to="/" title="Về trang chủ BanquetHub">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-amber-900/20 bg-stone-800 shadow-sm">
                    <img
                      src="/logo-icon.jpg"
                      alt="BanquetHub"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </Link>
              )}

              {/* Pin / Unpin Button (Shown when expanded or hovered) */}
              {isOpen && (
                <button
                  type="button"
                  onClick={togglePin}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                    isPinned
                      ? 'text-amber-400 hover:text-amber-300 hover:bg-stone-800'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800'
                  }`}
                  title={
                    isPinned
                      ? 'Đang ghim cố định (Bấm để chuyển sang chế độ tự động mở khi rê chuột)'
                      : 'Bấm để ghim thanh điều hướng mở rộng cố định'
                  }
                >
                  {isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                </button>
              )}
            </div>

            {/* Quick Status Pill */}
            <div className="px-3 pt-3">
              <div
                className={`rounded-xl border border-stone-800 bg-stone-950/70 p-2 flex items-center transition-all ${
                  isOpen ? 'justify-between px-3' : 'justify-center px-0'
                }`}
                title="Hệ thống vận hành máy chủ PostgreSQL"
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  {isOpen && (
                    <span className="text-[11px] font-semibold text-stone-300 whitespace-nowrap">
                      Hệ thống sẵn sàng
                    </span>
                  )}
                </div>
                {isOpen && (
                  <span className="text-[10px] font-bold text-amber-400 whitespace-nowrap">
                    Trực tuyến
                  </span>
                )}
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="px-2.5 py-3 space-y-4">
              <div>
                {isOpen && (
                  <p className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 whitespace-nowrap">
                    Phân hệ vận hành
                  </p>
                )}
                <nav className="space-y-1">
                  <NavLink
                    to="/admin/inventory/overview"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Tổng Quan Kho & Giá Vốn' : undefined}
                  >
                    <Warehouse className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Tổng quan kho & giá vốn</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Tổng quan kho & giá vốn
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/catalog"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Thực đơn & công thức' : undefined}
                  >
                    <ChefHat className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Thực đơn & công thức</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Thực đơn & công thức
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/inventory/ingredients"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Nguyên liệu & tồn kho' : undefined}
                  >
                    <Boxes className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Nguyên liệu & tồn kho</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Nguyên liệu & tồn kho
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/inventory/receipts"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Nhập hàng (phiếu nhập)' : undefined}
                  >
                    <Receipt className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Nhập hàng (phiếu nhập)</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Nhập hàng (phiếu nhập)
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/inventory/movements"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Sổ biến động kho' : undefined}
                  >
                    <History className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Sổ biến động kho</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Sổ biến động kho
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/suppliers"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Nhà cung cấp' : undefined}
                  >
                    <Truck className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Nhà cung cấp</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Nhà cung cấp
                      </div>
                    )}
                  </NavLink>
                </nav>
              </div>

              {/* Phase 3 & 4: Quản lý tiệc & đơn hàng */}
              <div>
                {isOpen && (
                  <p className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 whitespace-nowrap">
                    Quản lý đặt tiệc
                  </p>
                )}
                <nav className="space-y-1">
                  <NavLink
                    to="/admin"
                    end
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Tổng quan vận hành' : undefined}
                  >
                    <LayoutDashboard className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Tổng quan vận hành</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Tổng quan vận hành
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/menus"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Thực đơn mẫu' : undefined}
                  >
                    <Utensils className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Thực đơn mẫu</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Thực đơn mẫu
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/orders"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Đơn đặt tiệc' : undefined}
                  >
                    <CalendarDays className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Đơn đặt tiệc</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Đơn đặt tiệc
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/payments"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Thanh toán & đối soát' : undefined}
                  >
                    <CreditCard className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Thanh toán & đối soát</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Thanh toán & đối soát
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/inventory/reservations"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Theo dõi giữ kho' : undefined}
                  >
                    <PackageCheck className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Theo dõi giữ kho</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Theo dõi giữ kho
                      </div>
                    )}
                  </NavLink>
                </nav>
              </div>

              {/* Phase 6: Quản lý nhân sự & tiền lương */}
              <div>
                {isOpen && (
                  <p className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 whitespace-nowrap">
                    Nhân sự & Tiền lương
                  </p>
                )}
                <nav className="space-y-1">
                  <NavLink
                    to="/admin/employees"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Hồ sơ nhân viên' : undefined}
                  >
                    <Users className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Hồ sơ nhân viên</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Hồ sơ nhân viên
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/attendance"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Bảng chấm công' : undefined}
                  >
                    <CalendarDays className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Bảng chấm công</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Bảng chấm công
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/payroll-periods"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Kỳ tính lương & chốt sổ' : undefined}
                  >
                    <CalendarRange className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Kỳ tính lương & chốt sổ</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Kỳ tính lương & chốt sổ
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/payrolls"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Bảng lương nhân viên' : undefined}
                  >
                    <Receipt className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Bảng lương nhân viên</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Bảng lương nhân viên
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/salary-payments"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Nhật ký chi trả lương' : undefined}
                  >
                    <Banknote className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Nhật ký chi trả lương</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Nhật ký chi trả lương
                      </div>
                    )}
                  </NavLink>
                </nav>
              </div>

              {/* Phase 7: Báo cáo & Phân tích kinh doanh */}
              <div>
                {isOpen && (
                  <p className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 whitespace-nowrap">
                    Báo cáo & Phân tích
                  </p>
                )}
                <nav className="space-y-1">
                  <NavLink
                    to="/admin/dashboard"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Bảng điều khiển kinh doanh' : undefined}
                  >
                    <TrendingUp className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Dashboard kinh doanh</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Dashboard kinh doanh
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/reports/revenue"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Báo cáo doanh thu' : undefined}
                  >
                    <BarChart3 className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Báo cáo doanh thu</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Báo cáo doanh thu
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/reports/inventory"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Báo cáo kho & giá vốn' : undefined}
                  >
                    <Warehouse className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Báo cáo kho & giá vốn</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Báo cáo kho & giá vốn
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/expenses"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Chi phí vận hành khác' : undefined}
                  >
                    <Receipt className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Chi phí vận hành khác</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Chi phí vận hành khác
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/reports/payroll"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Báo cáo chi phí lương' : undefined}
                  >
                    <Users className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Báo cáo chi phí lương</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Báo cáo chi phí lương
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/reports/profit"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Báo cáo lợi nhuận ước tính' : undefined}
                  >
                    <PieChart className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Báo cáo lợi nhuận</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Báo cáo lợi nhuận
                      </div>
                    )}
                  </NavLink>

                  <NavLink
                    to="/admin/reports/cashflow"
                    className={({ isActive }) =>
                      `relative flex items-center rounded-lg py-2.5 text-xs font-semibold transition-all group ${
                        isOpen ? 'gap-2.5 px-3' : 'justify-center px-0'
                      } ${
                        isActive
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`
                    }
                    title={!isOpen ? 'Dòng tiền mô phỏng' : undefined}
                  >
                    <Activity className="h-4 w-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                    {isOpen && (
                      <span className="whitespace-nowrap truncate">Dòng tiền mô phỏng</span>
                    )}
                    {!isOpen && (
                      <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-lg bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:block">
                        Dòng tiền mô phỏng
                      </div>
                    )}
                  </NavLink>
                </nav>
              </div>
            </div>
          </div>

          {/* User Footer Panel */}
          <div className="p-2.5 border-t border-stone-800 bg-stone-950/50 m-2 rounded-xl space-y-2">
            {isOpen ? (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">{user?.fullName}</p>
                    <p className="truncate text-[10px] text-stone-400">{user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <Link
                    to="/dishes"
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-stone-800 bg-stone-900 px-2 py-1.5 text-[11px] font-semibold text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
                    title="Xem thực đơn bên phía khách hàng"
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
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-help"
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

      {/* Main Content Viewport: Adaptive width that expands and contracts smoothly with aside */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
        {/* Executive Header Bar */}
        <header className="h-16 border-b border-stone-200 bg-white px-5 sm:px-8 flex items-center justify-between shadow-xs sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Pin Toggle Button on Header Bar */}
            <button
              type="button"
              onClick={togglePin}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors cursor-pointer shadow-xs"
              title={
                isPinned
                  ? 'Bấm để chuyển sang chế độ tự động mở khi rê chuột'
                  : 'Bấm để ghim thanh điều hướng mở rộng cố định'
              }
            >
              {isPinned ? (
                <>
                  <PanelLeftClose className="h-4 w-4 text-stone-500" />
                  <span className="hidden sm:inline">Thu gọn</span>
                </>
              ) : (
                <>
                  <PanelLeftOpen className="h-4 w-4 text-amber-700" />
                  <span className="hidden sm:inline text-amber-800">Mở rộng</span>
                </>
              )}
            </button>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span>Quản trị tiệc</span>
                <span>/</span>
                <span className="font-semibold text-stone-900">Vận hành thực đơn & kho</span>
              </div>
              <p className="text-[11px] text-stone-500 hidden md:block">
                Cơ sở tiệc & kho trung tâm • Tiền tệ VND (UTC+7)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
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
