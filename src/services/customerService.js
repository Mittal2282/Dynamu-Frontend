import { apiCaller } from '../api/apiCaller';
import { ENDPOINTS } from '../utils/endpoints';

/**
 * Customer-facing API services.
 * All functions return response.data (already unwrapped by apiCaller).
 */

/**
 * Start a customer session by scanning a QR code.
 * @param {string} qrCodeId
 * @param {string|number} tableNumber
 * @returns {Promise<{ session_token, restaurant, table, menu }>}
 */
export async function startSession(qrCodeId, tableNumber) {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.SESSION_START,
    payload:  { qr_code_id: qrCodeId },
  });
  return data.data;
}

/**
 * Fetch the current session cart from the server.
 * @returns {Promise<{ items: Array }>}
 */
export async function getCart() {
  const data = await apiCaller({ method: 'GET', endpoint: ENDPOINTS.CART });
  return data.data;
}

/**
 * Sync cart to the server (fire-and-forget friendly).
 * @param {Array} items
 */
export async function syncCart(items) {
  const formattedItems = items.map(item => ({
    _id: item._id,       // sessionService reads item._id
    quantity: item.qty,
    instruction: item.instruction,
  }));
  return apiCaller({
    method:   'PUT',
    endpoint: ENDPOINTS.CART,
    payload:  { items: formattedItems },
  });
}

/**
 * Place an order from the current session cart.
 * @param {{ notes?: string, payment_method?: string }} [payload]
 */
export async function placeOrder(payload = {}) {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.PLACE_ORDER,
    payload,
  });
  return data.data;
}

/**
 * Get all orders for the current session.
 * @returns {Promise<Array>}
 */
export async function getCustomerOrders() {
  const data = await apiCaller({ method: 'GET', endpoint: ENDPOINTS.CUSTOMER_ORDERS });
  return data.data ?? [];
}
