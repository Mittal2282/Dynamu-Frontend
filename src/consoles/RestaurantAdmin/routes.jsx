import { Route } from "react-router-dom";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import DashLayout from "./DashLayout";
import OrdersPage from "./pages/OrdersPage";
import StatsPage from "./pages/StatsPage/StatsPage";
import TableStatusPage from "./pages/TableStatusPage/TableStatusPage";
import MenuManagePage from "./pages/MenuManagePage/MenuManagePage";
import IngredientsPage from "./pages/IngredientsPage";
import CompletedOrdersPage from "./pages/CompletedOrdersPage/CompletedOrdersPage";

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
    <Route path="ingredients" element={<IngredientsPage />} />
    <Route path="completed-orders" element={<CompletedOrdersPage />} />
  </Route>
);
