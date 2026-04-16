import { Navigate, useParams } from "react-router-dom";

export default function RedirectMyOrdersToOrders() {
  const { qrCodeId, tableNumber } = useParams();
  return <Navigate to={`/${qrCodeId}/${tableNumber}/orders`} replace />;
}
