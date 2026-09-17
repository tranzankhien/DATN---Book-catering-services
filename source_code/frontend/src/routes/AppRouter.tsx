import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { HomePage } from '../pages/HomePage';
import { CatalogPage } from '../pages/CatalogPage';
import { DishDetailPage } from '../pages/DishDetailPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { AdminCatalogPage } from '../pages/AdminCatalogPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public & Customer Portal */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/dishes" element={<CatalogPage />} />
          <Route path="/dishes/:id" element={<DishDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Admin Area */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/catalog" replace />} />
          <Route path="catalog" element={<AdminCatalogPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
