import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import DashLayout from "./DashLayout";
import OrdersPage from "./pages/OrdersPage";
import StatsPage from "./pages/StatsPage/StatsPage";
import TableStatusPage from "./pages/TableStatusPage/TableStatusPage";
import MenuManagePage from "./pages/MenuManagePage/MenuManagePage";
import CompletedOrdersPage from "./pages/CompletedOrdersPage/CompletedOrdersPage";
import SettingsPage from "./pages/SettingsPage";
import PaymentAnalyticsPage from "./pages/PaymentAnalyticsPage";
import POSPage from "./pages/POSPage";
import InventoryPage from "./pages/InventoryPage/InventoryPage";
import IngredientDetailPage from "./pages/InventoryPage/IngredientDetailPage";

export const restaurantAdminRoutes = (
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute allowedRoles={["restaurant_owner", "restaurant_staff"]}>
        <DashLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<OrdersPage />} />
    <Route path="stats" element={<StatsPage />} />
    <Route path="tables" element={<TableStatusPage />} />
    <Route path="menu" element={<MenuManagePage />} />
    <Route path="inventory" element={<InventoryPage />} />
    <Route path="inventory/:name" element={<IngredientDetailPage />} />
    <Route path="ingredients" element={<Navigate to="/dashboard/inventory" replace />} />
    <Route path="completed-orders" element={<CompletedOrdersPage />} />
    <Route path="payments" element={<PaymentAnalyticsPage />} />
    <Route path="pos" element={<POSPage />} />
    <Route path="settings" element={<SettingsPage />} />
  </Route>
);
