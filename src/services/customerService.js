import { apiCaller } from '../api/apiCaller';
import { ENDPOINTS } from '../utils/endpoints';

/**
 * Customer-facing API services.
 * All functions return response.data (already unwrapped by apiCaller).
 */

/**
 * Start a customer session by scanning a QR code.
 * @param {string} restaurantId
 * @param {string|number} tableNumber
 * @returns {Promise<{ session_token, restaurant, table, menu }>}
 */
export async function startSession(restaurantId, tableNumber) {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.SESSION_START,
    payload:  { qr_code_id: restaurantId },
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
    menu_item: item._id,
    quantity: item.qty,
  }));
  return apiCaller({
    method:   'PUT',
    endpoint: ENDPOINTS.CART,
    payload:  { items: formattedItems },
  });
}

/**
 * Place an order.
 * @param {{ tableNumber: number, items: Array, totalPrice: number }} payload
 */
export async function placeOrder({ tableNumber, items, totalPrice }) {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.PLACE_ORDER,
    payload:  { table_number: tableNumber, items, total_price: totalPrice },
  });
  return data.data;
}
