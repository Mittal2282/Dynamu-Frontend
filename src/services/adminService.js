import { apiCaller } from '../api/apiCaller';
import { ENDPOINTS } from '../utils/endpoints';

/**
 * Admin API services (all requests use the admin axios instance).
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Admin login.
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<{ accessToken, refreshToken, user }>}
 */
export async function adminLogin(payload) {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.ADMIN_LOGIN,
    payload,
    useAdmin: true,
  });
  return data.data;
}

/**
 * Admin logout.
 * @param {string} refreshToken
 */
export async function adminLogout(refreshToken) {
  return apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.ADMIN_LOGOUT,
    payload:  { refresh_token: refreshToken },
    useAdmin: true,
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * Fetch the authenticated restaurant's profile.
 * @returns {Promise<{ name, slug, ... }>}
 */
export async function getDashProfile() {
  const data = await apiCaller({
    method:   'GET',
    endpoint: ENDPOINTS.DASH_PROFILE,
    useAdmin: true,
  });
  return data.data;
}

/**
 * Fetch live orders for the restaurant dashboard.
 * @returns {Promise<Array>}
 */
export async function getDashOrders() {
  const data = await apiCaller({
    method:   'GET',
    endpoint: ENDPOINTS.DASH_ORDERS,
    useAdmin: true,
  });
  return data.data ?? [];
}

/**
 * Fetch stats for the restaurant dashboard.
 * @returns {Promise<object>}
 */
export async function getDashStats() {
  const data = await apiCaller({
    method:   'GET',
    endpoint: ENDPOINTS.DASH_STATS,
    useAdmin: true,
  });
  return data.data;
}

// ─── Superadmin ───────────────────────────────────────────────────────────────

/**
 * Fetch all restaurants (superadmin).
 * @returns {Promise<Array>}
 */
export async function getRestaurants() {
  const data = await apiCaller({
    method:   'GET',
    endpoint: ENDPOINTS.SA_RESTAURANTS,
    useAdmin: true,
  });
  return data.data ?? [];
}

/**
 * Create a new restaurant (superadmin).
 * @param {object} payload
 */
export async function createRestaurant(payload) {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.SA_RESTAURANTS,
    payload,
    useAdmin: true,
  });
  return data.data;
}

/**
 * Create tables for a restaurant (superadmin).
 * @param {string} restaurantId
 * @param {{ count: number, start_number: number }} payload
 */
export async function createTables(restaurantId, payload) {
  return apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.SA_TABLES(restaurantId),
    payload,
    useAdmin: true,
  });
}

/**
 * Import menu from CSV (superadmin).
 * @param {string} restaurantId
 * @param {string} csvText
 */
export async function importMenu(restaurantId, csvText) {
  return apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.SA_MENU(restaurantId),
    payload:  { csvText },
    useAdmin: true,
  });
}

// ─── Menu Management ──────────────────────────────────────────────────────────

/**
 * Fetch all menu items for the restaurant (including unavailable).
 */
export async function getDashMenu() {
  const data = await apiCaller({
    method:   'GET',
    endpoint: ENDPOINTS.DASH_MENU,
    useAdmin: true,
  });
  return data.data ?? [];
}

/**
 * Update menu item name/price.
 * @param {string} id
 * @param {{ name?: string, price?: number }} payload
 */
export async function updateDashMenuItem(id, payload) {
  const data = await apiCaller({
    method:   'PUT',
    endpoint: ENDPOINTS.DASH_MENU_ITEM(id),
    payload,
    useAdmin: true,
  });
  return data.data;
}

/**
 * Manually close a table session (end it so next QR scan starts fresh).
 * @param {string} sessionId
 */
export async function closeTableSession(sessionId) {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.DASH_CLOSE_SESSION(sessionId),
    useAdmin: true,
  });
  return data.data;
}

/**
 * Toggle menu item availability.
 * @param {string} id
 */
export async function toggleDashMenuItem(id) {
  const data = await apiCaller({
    method:   'PATCH',
    endpoint: ENDPOINTS.DASH_MENU_TOGGLE(id),
    useAdmin: true,
  });
  return data.data;
}

/**
 * Toggle Chef's Special flag on a menu item.
 * @param {string} id
 */
export async function toggleChefsSpecial(id) {
  const data = await apiCaller({
    method:   'PATCH',
    endpoint: ENDPOINTS.DASH_MENU_CHEFS_SPECIAL(id),
    useAdmin: true,
  });
  return data.data;
}

/**
 * Toggle Featured flag on a menu item.
 * @param {string} id
 */
export async function toggleFeatured(id) {
  const data = await apiCaller({
    method:   'PATCH',
    endpoint: ENDPOINTS.DASH_MENU_FEATURED(id),
    useAdmin: true,
  });
  return data.data;
}

/**
 * Fetch orders for a specific restaurant (superadmin).
 * @param {string} restaurantId
 */
export async function getRestaurantOrders(restaurantId) {
  const data = await apiCaller({
    method:   'GET',
    endpoint: ENDPOINTS.SA_REST_ORDERS(restaurantId),
    useAdmin: true,
  });
  return data.data ?? [];
}
