import React from 'react';
import { AlertCircle, Inbox, RefreshCw, ChefHat, Sparkles } from 'lucide-react';
import type { DishStatus } from '../services/types';

export const LoadingState: React.FC<{ label?: string }> = ({
  label = 'Đang đồng bộ dữ liệu với máy chủ...',
}) => (
  <div className="flex flex-col items-center justify-center rounded-3xl border border-stone-800 bg-stone-900/60 backdrop-blur-md py-20 px-6 text-center shadow-2xl">
    <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
      <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping" />
      <div className="absolute inset-0 rounded-full border-2 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
        <ChefHat className="h-6 w-6 animate-pulse" />
      </div>
    </div>
    <h4 className="text-base font-semibold text-stone-200">{label}</h4>
    <p className="mt-1 text-xs text-stone-500">Hệ thống xử lý định lượng & thực đơn thời gian thực</p>
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = 'Không thể tải dữ liệu', message, onRetry }) => (
  <div className="flex flex-col items-center justify-center rounded-3xl border border-rose-900/50 bg-rose-950/20 backdrop-blur-md py-16 px-6 text-center shadow-xl">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-900/30 text-rose-400 border border-rose-800/40 mb-4 shadow-inner">
      <AlertCircle className="h-7 w-7" />
    </div>
    <h3 className="text-lg font-bold text-rose-200">{title}</h3>
    <p className="mt-1.5 max-w-md text-xs sm:text-sm text-rose-300/80 leading-relaxed">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:from-rose-600 hover:to-rose-500 transition-all cursor-pointer"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        <span>Thử kết nối lại</span>
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-800 bg-stone-900/40 backdrop-blur-sm py-18 px-6 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-800/60 text-stone-400 border border-stone-700/50 mb-4 shadow-inner">
      <Inbox className="h-7 w-7" />
    </div>
    <h3 className="text-base font-bold text-stone-200">{title}</h3>
    {description && <p className="mt-1.5 max-w-md text-xs text-stone-400 leading-relaxed">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const DishStatusBadge: React.FC<{ status: DishStatus }> = ({ status }) => {
  const isActive = status === 'ACTIVE';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase ${
        isActive
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
          : 'bg-stone-800 text-stone-400 border border-stone-700'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`}
      />
      {isActive ? 'Đang phục vụ' : 'Tạm ngừng'}
    </span>
  );
};
