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

// Phase 3 Customer Pages
import { MenusPage } from '../pages/MenusPage';
import { MenuDetailPage } from '../pages/MenuDetailPage';
import { MenuBuilderPage } from '../pages/MenuBuilderPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { BookingConfirmationPage } from '../pages/BookingConfirmationPage';
import { MyOrdersPage } from '../pages/MyOrdersPage';
import { OrderDetailPage } from '../pages/OrderDetailPage';

// Admin Phase 1 & 2 Pages
import { AdminCatalogPage } from '../pages/AdminCatalogPage';
import { AdminInventoryOverviewPage } from '../pages/admin/AdminInventoryOverviewPage';
import { AdminIngredientsInventoryPage } from '../pages/admin/AdminIngredientsInventoryPage';
import { AdminSuppliersPage } from '../pages/admin/AdminSuppliersPage';
import { AdminStockReceiptsPage } from '../pages/admin/AdminStockReceiptsPage';
import { AdminStockReceiptCreatePage } from '../pages/admin/AdminStockReceiptCreatePage';
import { AdminStockReceiptDetailPage } from '../pages/admin/AdminStockReceiptDetailPage';
import { AdminStockMovementsPage } from '../pages/admin/AdminStockMovementsPage';

// Admin Phase 3 Pages
import { AdminMenusPage } from '../pages/admin/AdminMenusPage';
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage';
import { AdminOrderDetailPage } from '../pages/admin/AdminOrderDetailPage';
import { AdminReservationsPage } from '../pages/admin/AdminReservationsPage';

// Employee Phase 3 Pages
import { EmployeeOrdersPage } from '../pages/employee/EmployeeOrdersPage';
import { EmployeeOrderDetailPage } from '../pages/employee/EmployeeOrderDetailPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public & Customer Portal */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/dishes" element={<CatalogPage />} />
          <Route path="/catalog" element={<Navigate to="/dishes" replace />} />
          <Route path="/dishes/:id" element={<DishDetailPage />} />
          <Route path="/menus" element={<MenusPage />} />
          <Route path="/menus/:id" element={<MenuDetailPage />} />
          <Route path="/menu-builder" element={<MenuBuilderPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders/confirmation/:id" element={<BookingConfirmationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated Customer Orders */}
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute allowedRoles={['ROLE_USER', 'ROLE_EMPLOYEE', 'ROLE_ADMIN']}>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders/:id"
            element={
              <ProtectedRoute allowedRoles={['ROLE_USER', 'ROLE_EMPLOYEE', 'ROLE_ADMIN']}>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Employee Kitchen & Coordination Area */}
          <Route
            path="/employee/orders"
            element={
              <ProtectedRoute allowedRoles={['ROLE_EMPLOYEE', 'ROLE_ADMIN']}>
                <EmployeeOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/orders/:id"
            element={
              <ProtectedRoute allowedRoles={['ROLE_EMPLOYEE', 'ROLE_ADMIN']}>
                <EmployeeOrderDetailPage />
              </ProtectedRoute>
            }
          />
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
          <Route path="inventory/reservations" element={<AdminReservationsPage />} />
          <Route path="suppliers" element={<AdminSuppliersPage />} />
          <Route path="menus" element={<AdminMenusPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
