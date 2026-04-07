import { apiCaller } from '../api/apiCaller';
import adminApi from '../api/adminAxios';
import { ENDPOINTS } from '../utils/endpoints';
import { sleep } from '../utils/helpers';

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
 * Fetch all active tables with live session info.
 * @returns {Promise<Array>}
 */
export async function getDashTables() {
  const data = await apiCaller({
    method:   'GET',
    endpoint: ENDPOINTS.DASH_TABLES,
    useAdmin: true,
  });
  return data.data ?? [];
}

/**
 * Free a table — ends its active session and notifies customers via socket.
 * @param {string} tableId
 */
export async function freeTable(tableId) {
  return apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.DASH_TABLE_FREE(tableId),
    useAdmin: true,
  });
}

/**
 * Add tables to a floor (new or existing).
 * @param {{ floor_number, floor_name, table_count, start_number }} floorData
 */
export async function toggleTableActive(tableId) {
  return apiCaller({
    method:   'PATCH',
    endpoint: ENDPOINTS.DASH_TABLE_TOGGLE_ACTIVE(tableId),
    useAdmin: true,
  });
}

export async function addTablesToFloor(floorData) {
  return apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.DASH_TABLES_BULK,
    payload:  floorData,
    useAdmin: true,
  });
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
export async function deleteDashMenuItem(id) {
  const data = await apiCaller({
    method:   'DELETE',
    endpoint: ENDPOINTS.DASH_MENU_ITEM_DELETE(id),
    useAdmin: true,
  });
  return data;
}

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

// ─── Categories ───────────────────────────────────────────────────────────────

/**
 * Fetch all menu categories for this restaurant.
 * @returns {Promise<string[]>}
 */
export async function getDashCategories() {
  const data = await apiCaller({
    method:   'GET',
    endpoint: ENDPOINTS.DASH_CATEGORIES,
    useAdmin: true,
  });
  return data.data ?? [];
}

/**
 * Create a new category.
 * @param {string} name
 * @returns {Promise<string>}
 */
export async function createDashCategory(name) {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.DASH_CATEGORIES,
    payload:  { name },
    useAdmin: true,
  });
  return data.data;
}

// ─── Menu Items ───────────────────────────────────────────────────────────────

/**
 * Create a new menu item.
 * @param {object} payload
 */
export async function createDashMenuItem(payload) {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.DASH_MENU,
    payload,
    useAdmin: true,
  });
  return data.data;
}

/**
 * Bulk import menu items from CSV text.
 * @param {string} csvText
 * @returns {Promise<{ imported: number, errors: string[] }>}
 */
export async function bulkImportMenuItems(csvText) {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.DASH_MENU_BULK,
    payload:  { csvText },
    useAdmin: true,
  });
  return data.data;
}

/**
 * Upload a menu item image to ImageKit.
 * @param {File} file
 * @returns {Promise<string>} ImageKit public URL
 */
export async function uploadMenuItemImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await adminApi.post(ENDPOINTS.DASH_MENU_IMAGE_UPLOAD, formData);
  return res.data.data.url;
}

export async function getIngredients() {
  const data = await apiCaller({
    method:   'GET',
    endpoint: ENDPOINTS.DASH_INGREDIENTS,
    useAdmin: true,
  });
  return data.data;
}

export async function toggleIngredient(name, isAvailable) {
  const data = await apiCaller({
    method:   'PATCH',
    endpoint: ENDPOINTS.DASH_INGREDIENTS_TOGGLE,
    payload:  { name, is_available: isAvailable },
    useAdmin: true,
  });
  return data.data;
}
