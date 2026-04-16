import { apiCaller } from '../api/apiCaller';
import { ENDPOINTS } from '../utils/endpoints';

/**
 * Superadmin API services (all requests use the admin axios instance).
 */

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
export async function importMenu(restaurantId, csvText, menuRows, variantRows) {
  const payload = (menuRows && menuRows.length)
    ? { menuRows, variantRows: variantRows ?? [] }
    : { csvText };
  return apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.SA_MENU(restaurantId),
    payload,
    useAdmin: true,
  });
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
