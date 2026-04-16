import { Route } from "react-router-dom";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import SuperAdminLayout from "./SuperAdminLayout";
import RestaurantsPage from "./pages/RestaurantsPage";
import OnboardPage from "./pages/OnboardPage";
import RestaurantOrdersPage from "./pages/RestaurantOrdersPage";

export const superAdminRoutes = (
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
    <Route path="restaurants/:id/orders" element={<RestaurantOrdersPage />} />
  </Route>
);
