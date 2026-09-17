import React from 'react';
import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import type { DishStatus } from '../services/types';

export const LoadingState: React.FC<{ label?: string }> = ({
  label = 'Đang tải dữ liệu từ hệ thống...',
}) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white py-16 px-6 text-center shadow-xs">
    <Loader2 className="h-9 w-9 animate-spin text-amber-600 mb-3" />
    <p className="text-sm font-medium text-stone-600">{label}</p>
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = 'Không thể tải dữ liệu', message, onRetry }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/70 py-12 px-6 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3">
      <AlertTriangle className="h-6 w-6" />
    </div>
    <h3 className="text-base font-semibold text-rose-950">{title}</h3>
    <p className="mt-1 max-w-md text-sm text-rose-800">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 transition-colors cursor-pointer"
      >
        <RefreshCw className="h-4 w-4" />
        Thử lại
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white py-14 px-6 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500 mb-3">
      <Inbox className="h-6 w-6" />
    </div>
    <h3 className="text-base font-semibold text-stone-900">{title}</h3>
    {description && <p className="mt-1 max-w-md text-sm text-stone-600">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const DishStatusBadge: React.FC<{ status: DishStatus }> = ({ status }) => {
  const isActive = status === 'ACTIVE';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          : 'bg-stone-200 text-stone-700 border border-stone-300'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-stone-500'}`}
      />
      {isActive ? 'Đang phục vụ' : 'Đang ẩn'}
    </span>
  );
};
