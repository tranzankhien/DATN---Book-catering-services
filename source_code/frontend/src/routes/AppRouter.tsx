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
import { AdminInventoryOverviewPage } from '../pages/admin/AdminInventoryOverviewPage';
import { AdminIngredientsInventoryPage } from '../pages/admin/AdminIngredientsInventoryPage';
import { AdminSuppliersPage } from '../pages/admin/AdminSuppliersPage';
import { AdminStockReceiptsPage } from '../pages/admin/AdminStockReceiptsPage';
import { AdminStockReceiptCreatePage } from '../pages/admin/AdminStockReceiptCreatePage';
import { AdminStockReceiptDetailPage } from '../pages/admin/AdminStockReceiptDetailPage';
import { AdminStockMovementsPage } from '../pages/admin/AdminStockMovementsPage';

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
          <Route path="inventory/overview" element={<AdminInventoryOverviewPage />} />
          <Route path="inventory/ingredients" element={<AdminIngredientsInventoryPage />} />
          <Route path="inventory/receipts" element={<AdminStockReceiptsPage />} />
          <Route path="inventory/receipts/new" element={<AdminStockReceiptCreatePage />} />
          <Route path="inventory/receipts/:id" element={<AdminStockReceiptDetailPage />} />
          <Route path="inventory/movements" element={<AdminStockMovementsPage />} />
          <Route path="suppliers" element={<AdminSuppliersPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
