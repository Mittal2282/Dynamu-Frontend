import {
  Navigate,
  Route,
  Routes as RouterRoutes,
  useParams,
} from "react-router-dom";

// Customer-facing
import CustomerLayout from "../layouts/CustomerLayout";
import CustomerCartPage from "../pages/customer/CustomerCartPage";
import CustomerHomePage from "../pages/customer/CustomerHomePage";
import CustomerMenuPage from "../pages/customer/CustomerMenuPage";
import CustomerOrdersPage from "../pages/customer/CustomerOrdersPage";

// Auth
import ProtectedRoute from "../components/ProtectedRoute";
import LoginPage from "../pages/auth/LoginPage";
import LandingPage from "../pages/LandingPage";

// Admin layouts
import DashLayout from "../layouts/DashLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";

// Superadmin pages
import OnboardPage from "../pages/superadmin/OnboardPage";
import RestaurantOrdersPage from "../pages/superadmin/RestaurantOrdersPage";
import RestaurantsPage from "../pages/superadmin/RestaurantsPage";

// Restaurant dashboard pages
import CompletedOrdersPage from "../pages/dashboard/CompletedOrdersPage";
import IngredientsPage from "../pages/dashboard/IngredientsPage";
import MenuManagePage from "../pages/dashboard/MenuManagePage";
import OrdersPage from "../pages/dashboard/OrdersPage";
import StatsPage from "../pages/dashboard/StatsPage";
import TableStatusPage from "../pages/dashboard/TableStatusPage";

function RedirectMyOrdersToOrders() {
  const { qrCodeId, tableNumber } = useParams();
  return <Navigate to={`/${qrCodeId}/${tableNumber}/orders`} replace />;
}

export default function Routes() {
  return (
    <RouterRoutes>
      {/* QR scan entry point — /:qrCodeId/:tableNumber */}
      <Route path="/:qrCodeId/:tableNumber" element={<CustomerLayout />}>
        <Route index element={<CustomerHomePage />} />
        <Route path="menu" element={<CustomerMenuPage />} />
        <Route path="cart" element={<CustomerCartPage />} />
        <Route path="orders" element={<CustomerOrdersPage />} />
        <Route path="my-orders" element={<RedirectMyOrdersToOrders />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />

      {/* Superadmin dashboard */}
      <Route
        path="/superadmin"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RestaurantsPage />} />
        <Route path="onboard" element={<OnboardPage />} />
        <Route
          path="restaurants/:id/orders"
          element={<RestaurantOrdersPage />}
        />
      </Route>

      {/* Restaurant owner/staff dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            allowedRoles={["restaurant_owner", "restaurant_staff"]}
          >
            <DashLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OrdersPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="tables" element={<TableStatusPage />} />
        <Route path="menu" element={<MenuManagePage />} />
        <Route path="ingredients" element={<IngredientsPage />} />
        <Route path="completed-orders" element={<CompletedOrdersPage />} />
      </Route>

      {/* Root → Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </RouterRoutes>
  );
}
