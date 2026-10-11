import React from 'react';
import { AlertCircle, Inbox, RefreshCw, Loader2 } from 'lucide-react';
import type { DishStatus } from '../services/types';

export const LoadingState: React.FC<{ label?: string; message?: string }> = ({
  label,
  message,
}) => {
  const text = label || message || 'Đang tải dữ liệu từ hệ thống...';
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200/80 bg-white py-16 px-6 text-center shadow-xs">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 mb-3.5">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
      <h4 className="text-sm font-semibold text-stone-900">{text}</h4>
      <p className="mt-1 text-xs text-stone-500">Vui lòng chờ trong giây lát</p>
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = 'Không thể tải dữ liệu', message, onRetry }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 py-12 px-6 text-center">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600 mb-3">
      <AlertCircle className="h-5 w-5" />
    </div>
    <h3 className="text-sm font-bold text-rose-950">{title}</h3>
    <p className="mt-1 max-w-md text-xs text-rose-700 leading-relaxed">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-800 transition-colors cursor-pointer shadow-xs"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        <span>Thử lại</span>
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
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-500 mb-3">
      <Inbox className="h-5 w-5" />
    </div>
    <h3 className="text-sm font-bold text-stone-900">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-xs text-stone-500 leading-relaxed">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const DishStatusBadge: React.FC<{ status: DishStatus }> = ({ status }) => {
  const isActive = status === 'ACTIVE';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        isActive
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-stone-100 text-stone-600 border border-stone-200'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-stone-400'}`}
      />
      {isActive ? 'Đang phục vụ' : 'Đang ẩn'}
    </span>
  );
};
