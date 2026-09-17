import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { LoadingState } from '../components/StatusStates';
import type { Role } from '../services/types';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <LoadingState label="Đang xác thực phiên đăng nhập..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-stone-900">Truy cập bị từ chối (403)</h2>
          <p className="mt-2 text-sm text-stone-600">
            Tài khoản <span className="font-semibold text-stone-900">{user.email}</span> không có quyền truy cập khu vực quản trị này.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
