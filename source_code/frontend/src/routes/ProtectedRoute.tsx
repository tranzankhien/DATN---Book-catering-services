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
        <div className="max-w-md w-full rounded-2xl border border-stone-200/90 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Truy Cập Bị Từ Chối (403)</h2>
          <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">
            Tài khoản <span className="font-semibold text-stone-900">{user.email}</span> không có quyền
            truy cập phân hệ quản trị này theo ma trận phân quyền.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-5 py-2.5 text-xs font-semibold shadow-xs transition-colors"
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
