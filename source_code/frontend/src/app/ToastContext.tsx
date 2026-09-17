import React, { createContext, useCallback, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

export interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      window.setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3.5 shadow-lg transition-all ${
                isSuccess
                  ? 'bg-emerald-950/95 border-emerald-700 text-emerald-50'
                  : isError
                  ? 'bg-rose-950/95 border-rose-700 text-rose-50'
                  : 'bg-stone-900/95 border-stone-700 text-stone-100'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : isError ? (
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-stone-400 hover:text-white transition-colors"
                aria-label="Đóng thông báo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
