import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { LoadingState } from '../components/StatusStates';
import type { Role } from '../services/types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4">
        <LoadingState label="Đang xác thực quyền hạn tài khoản..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: `${location.pathname}${location.search}` }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full rounded-3xl border border-rose-900/60 bg-stone-900/80 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-900/30 text-rose-400 border border-rose-800/40 shadow-inner">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black font-serif-luxury text-white">Truy Cập Bị Từ Chối (403)</h2>
          <p className="mt-2 text-xs sm:text-sm text-stone-300 leading-relaxed">
            Tài khoản <span className="font-bold text-amber-400">{user.email}</span> không có quyền
            truy cập phân hệ quản trị này theo ma trận phân quyền.
          </p>
          <div className="mt-7 flex justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-black text-stone-950 shadow-md shadow-amber-500/20 hover:scale-102 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay Lại Trang Chủ</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
