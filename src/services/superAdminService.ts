import { apiCaller } from '../api/apiCaller';
import { ENDPOINTS } from '../utils/endpoints';

import type { Order } from '../types/order';

/**
 * Superadmin API services (all requests use the admin axios instance).
 */

/**
 * Fetch all restaurants (superadmin).
 */
export async function getRestaurants(): Promise<Record<string, unknown>[]> {
  const data = await apiCaller({
    method:   'GET',
    endpoint: ENDPOINTS.SA_RESTAURANTS,
    useAdmin: true,
  });
  return data.data ?? [];
}

/**
 * Create a new restaurant (superadmin).
 */
export async function createRestaurant(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
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
 */
export async function createTables(
  restaurantId: string,
  payload: { count: number; start_number: number }
): Promise<unknown> {
  return apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.SA_TABLES(restaurantId),
    payload,
    useAdmin: true,
  });
}

/**
 * Import menu from CSV (superadmin).
 */
export async function importMenu(
  restaurantId: string,
  csvText: string,
  menuRows?: unknown[],
  variantRows?: unknown[]
): Promise<unknown> {
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
 */
export async function getRestaurantOrders(restaurantId: string): Promise<Order[]> {
  const data = await apiCaller({
    method:   'GET',
    endpoint: ENDPOINTS.SA_REST_ORDERS(restaurantId),
    useAdmin: true,
  });
  return data.data ?? [];
}
