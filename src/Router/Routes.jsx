import React from 'react';
import { Route, Routes as RouterRoutes, Navigate } from 'react-router-dom';

// Customer-facing
import MainLayout from '../layout/MainLayout';
import MenuPage from '../consoles/menu';
import ChatPage from '../consoles/chat';
import CartPage from '../consoles/cart';
import AdminPage from '../consoles/admin';
import QRLandingPage from '../pages/QRLandingPage';

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

export default function Routes() {
  return (
    <RouterRoutes>
      {/* QR scan entry point — /:restaurantId/:tableNumber */}
      <Route path="/:restaurantId/:tableNumber" element={<QRLandingPage />} />

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
      </Route>

      {/* Original customer-facing app */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<MenuPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </RouterRoutes>
  );
}
