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
export async function startSession(qrCodeId, tableNumber, name = '', forceNew = false) {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.SESSION_START,
    payload:  { qr_code_id: qrCodeId, name, force_new: forceNew },
  });
  return data.data;
}

export async function checkSession(qrCodeId, existingToken = null) {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.SESSION_CHECK,
    payload:  { qr_code_id: qrCodeId, session_token: existingToken },
  });
  return data.data;
}

export async function requestJoinSession(qrCodeId, joinerName) {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.SESSION_REQUEST_JOIN,
    payload:  { qr_code_id: qrCodeId, joiner_name: joinerName },
  });
  return data.data;
}

export async function getJoinStatus(requestId) {
  const data = await apiCaller({
    method:   'GET',
    endpoint: ENDPOINTS.SESSION_JOIN_STATUS(requestId),
  });
  return data.data;
}

export async function respondToJoin(requestId, approved) {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.SESSION_RESPOND_JOIN,
    payload:  { request_id: requestId, approved },
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
    _id: item._id,
    quantity: item.qty,
    instruction: item.instruction,
    // Variant fields — server stores and returns these so variant info survives page refresh
    variant_name:   item.selectedVariant?.name      || undefined,
    variant_group:  item.selectedVariant?.groupName || undefined,
    variant_price:  item.selectedVariant?.price     ?? undefined,
    variant_is_veg: item.selectedVariant != null ? (item.selectedVariant.isVeg ?? undefined) : undefined,
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

/**
 * Request final bill / end the customer table session.
 * @param {{ reason?: string }} [payload]
 * @returns {Promise<{ success?: boolean, message?: string }>}
 */
export async function endCustomerSession(payload = {}) {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.SESSION_END,
    payload:  { reason: 'request_bill', ...payload },
  });
  return data.data ?? data;
}

/**
 * Request final bill (customer). Prefer this for QR flow; backend may alias SESSION_END.
 * @returns {Promise<*>}
 */
export async function requestBill() {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.REQUEST_BILL,
  });
  return data.data ?? data;
}

/**
 * Get AI-powered cart suggestions (3 complementary items).
 * @param {string[]} cartItemIds
 * @returns {Promise<Array>}
 */
export async function getCartSuggestions(cartItemIds) {
  const data = await apiCaller({
    method: 'POST',
    endpoint: ENDPOINTS.CART_SUGGESTIONS,
    payload: { cart_item_ids: cartItemIds },
  });
  return data.data ?? [];
}

/**
 * Get top 10 trending items for this restaurant (past 7 days).
 * @returns {Promise<Array>}
 */
export async function getTrendingItems() {
  const data = await apiCaller({ method: 'GET', endpoint: ENDPOINTS.MENU_TRENDING });
  return data.data ?? [];
}

/**
 * Get Chef's Special items for this restaurant.
 * @returns {Promise<Array>}
 */
export async function getChefsSpecials() {
  const data = await apiCaller({ method: 'GET', endpoint: ENDPOINTS.MENU_CHEFS_SPECIAL });
  return data.data ?? [];
}

/**
 * Get featured items (restaurant-configured or 5 random fallback).
 * @returns {Promise<Array>}
 */
export async function getFeaturedItems() {
  const data = await apiCaller({ method: 'GET', endpoint: ENDPOINTS.MENU_FEATURED });
  return data.data ?? [];
}

/**
 * Get available menu items for the current time slot (breakfast / lunch / dinner).
 * Passes the client's local hour so the server uses the user's timezone.
 * @returns {Promise<{ items: Array, meal_time: string }>}
 */
export async function getTimeBasedMenu() {
  const data = await apiCaller({
    method:   'GET',
    endpoint: ENDPOINTS.MENU_TIME_BASED,
    params:   { hour: new Date().getHours() },
  });
  return { items: data.data ?? [], meal_time: data.meal_time ?? '' };
}
