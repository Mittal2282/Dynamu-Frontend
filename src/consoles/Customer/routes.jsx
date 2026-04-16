import { Route } from "react-router-dom";
import CustomerLayout from "./CustomerLayout/CustomerLayout";
import CustomerHomePage from "./pages/CustomerHomePage";
import CustomerMenuPage from "./pages/CustomerMenuPage";
import CustomerCartPage from "./pages/CustomerCartPage";
import CustomerOrdersPage from "./pages/CustomerOrdersPage";
import RedirectMyOrdersToOrders from "./RedirectMyOrdersToOrders";

export const customerRoutes = (
  <Route path="/:qrCodeId/:tableNumber" element={<CustomerLayout />}>
    <Route index element={<CustomerHomePage />} />
    <Route path="menu" element={<CustomerMenuPage />} />
    <Route path="cart" element={<CustomerCartPage />} />
    <Route path="orders" element={<CustomerOrdersPage />} />
    <Route path="my-orders" element={<RedirectMyOrdersToOrders />} />
  </Route>
);
