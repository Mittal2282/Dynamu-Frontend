import React from 'react';
import { Route, Routes as RouterRoutes, Navigate } from 'react-router-dom';

// Customer-facing
import CustomerLayout from '../layouts/CustomerLayout';
import CustomerHomePage from '../pages/customer/CustomerHomePage';
import CustomerMenuPage from '../pages/customer/CustomerMenuPage';
import CustomerOrdersPage from '../pages/customer/CustomerOrdersPage';

// Auth
import LoginPage from '../pages/auth/LoginPage';
import ProtectedRoute from '../components/ProtectedRoute';

// Admin layouts
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import DashLayout from '../layouts/DashLayout';

// Superadmin pages
import RestaurantsPage from '../pages/superadmin/RestaurantsPage';
import OnboardPage from '../pages/superadmin/OnboardPage';
import RestaurantOrdersPage from '../pages/superadmin/RestaurantOrdersPage';

// Restaurant dashboard pages
import OrdersPage from '../pages/dashboard/OrdersPage';
import StatsPage from '../pages/dashboard/StatsPage';
import MenuManagePage from '../pages/dashboard/MenuManagePage';

export default function Routes() {
  return (
    <RouterRoutes>
      {/* QR scan entry point — /:qrCodeId/:tableNumber */}
      <Route path="/:qrCodeId/:tableNumber" element={<CustomerLayout />}>
        <Route index element={<CustomerHomePage />} />
        <Route path="menu"   element={<CustomerMenuPage />} />
        <Route path="orders" element={<CustomerOrdersPage />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />

      {/* Superadmin dashboard */}
      <Route
        path="/superadmin"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RestaurantsPage />} />
        <Route path="onboard" element={<OnboardPage />} />
        <Route path="restaurants/:id/orders" element={<RestaurantOrdersPage />} />
      </Route>

      {/* Restaurant owner/staff dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['restaurant_owner', 'restaurant_staff']}>
            <DashLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OrdersPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="menu" element={<MenuManagePage />} />
      </Route>

      {/* Root → Login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </RouterRoutes>
  );
}
