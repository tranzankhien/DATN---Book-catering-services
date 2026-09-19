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
      }, 4200);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3.5 shadow-lg shadow-stone-900/5 transition-all duration-200 ${
                isSuccess
                  ? 'border-emerald-200 text-stone-800'
                  : isError
                  ? 'border-rose-200 text-stone-800'
                  : 'border-amber-200 text-stone-800'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isSuccess ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : isError ? (
                  <AlertCircle className="h-5 w-5 text-rose-600" />
                ) : (
                  <Info className="h-5 w-5 text-amber-600" />
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium leading-snug flex-1 text-stone-800">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer p-0.5 -mr-1"
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
