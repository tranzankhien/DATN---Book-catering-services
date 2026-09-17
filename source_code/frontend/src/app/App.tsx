import React from 'react';
import { ToastProvider } from './ToastContext';
import { AuthProvider } from './AuthContext';
import { AppRouter } from '../routes/AppRouter';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ToastProvider>
  );
};
