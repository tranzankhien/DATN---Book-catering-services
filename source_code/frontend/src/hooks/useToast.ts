import { useContext } from 'react';
import { ToastContext } from '../app/ToastContext';

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast phải được sử dụng bên trong ToastProvider');
  }
  return ctx;
}
