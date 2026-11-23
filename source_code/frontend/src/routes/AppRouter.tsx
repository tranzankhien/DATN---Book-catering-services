import { PaymentResultPage } from '../pages/PaymentResultPage';
import { AiMenuPage } from '../pages/AiMenuPage';
import { AdminPaymentsPage } from '../pages/admin/AdminPaymentsPage';
import { AdminOverviewPage } from '../pages/admin/AdminOverviewPage';
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
import { AdminVouchersPage } from '../pages/admin/AdminVouchersPage';

// Employee Phase 3 Pages
import { EmployeeOrdersPage } from '../pages/employee/EmployeeOrdersPage';
import { EmployeeOrderDetailPage } from '../pages/employee/EmployeeOrderDetailPage';

// Phase 6 Admin HR & Payroll Pages
import { AdminEmployeesPage } from '../pages/admin/AdminEmployeesPage';
import { AdminAttendancePage } from '../pages/admin/AdminAttendancePage';
import { AdminPayrollPeriodsPage } from '../pages/admin/AdminPayrollPeriodsPage';
import { AdminPayrollsPage } from '../pages/admin/AdminPayrollsPage';
import { AdminSalaryPaymentsPage } from '../pages/admin/AdminSalaryPaymentsPage';

// Phase 6 Employee Self-Service Pages
import { EmployeeMyAttendancePage } from '../pages/employee/EmployeeMyAttendancePage';
import { EmployeeMyPayrollsPage } from '../pages/employee/EmployeeMyPayrollsPage';

// Phase 7 Business Dashboard & Reports
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminRevenueReportPage } from '../pages/admin/AdminRevenueReportPage';
import { AdminInventoryReportPage } from '../pages/admin/AdminInventoryReportPage';
import { AdminExpensesPage } from '../pages/admin/AdminExpensesPage';
import { AdminPayrollReportPage } from '../pages/admin/AdminPayrollReportPage';
import { AdminProfitReportPage } from '../pages/admin/AdminProfitReportPage';
import { AdminCashFlowReportPage } from '../pages/admin/AdminCashFlowReportPage';

// User & Account Management Pages
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { UserProfilePage } from '../pages/UserProfilePage';

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
          <Route path="/ai-menu" element={<AiMenuPage />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={['ROLE_USER']}>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/confirmation/:id"
            element={
              <ProtectedRoute allowedRoles={['ROLE_USER']}>
                <BookingConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route path="/payment/result" element={<PaymentResultPage />} />
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
          <Route
            path="/employee/attendance"
            element={
              <ProtectedRoute allowedRoles={['ROLE_EMPLOYEE', 'ROLE_ADMIN']}>
                <EmployeeMyAttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/payrolls"
            element={
              <ProtectedRoute allowedRoles={['ROLE_EMPLOYEE', 'ROLE_ADMIN']}>
                <EmployeeMyPayrollsPage />
              </ProtectedRoute>
            }
          />

          {/* User Profile & Security */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['ROLE_USER', 'ROLE_EMPLOYEE', 'ROLE_ADMIN']}>
                <UserProfilePage />
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
          <Route index element={<AdminOverviewPage />} />
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
          <Route path="vouchers" element={<AdminVouchersPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="employees" element={<AdminEmployeesPage />} />
          <Route path="attendance" element={<AdminAttendancePage />} />
          <Route path="payroll-periods" element={<AdminPayrollPeriodsPage />} />
          <Route path="payrolls" element={<AdminPayrollsPage />} />
          <Route path="salary-payments" element={<AdminSalaryPaymentsPage />} />

          {/* Phase 7 Business Dashboard & Reports */}
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="expenses" element={<AdminExpensesPage />} />
          <Route path="reports/revenue" element={<AdminRevenueReportPage />} />
          <Route path="reports/inventory" element={<AdminInventoryReportPage />} />
          <Route path="reports/payroll" element={<AdminPayrollReportPage />} />
          <Route path="reports/profit" element={<AdminProfitReportPage />} />
          <Route path="reports/cashflow" element={<AdminCashFlowReportPage />} />

          {/* Account Management & Profile */}
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="profile" element={<UserProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
