import { apiCaller } from "../api/apiCaller";
import { ENDPOINTS } from "../utils/endpoints";

import type { Order } from "../types/order";

type Resp<T> = { data: T };

export interface SuperAdminRestaurant {
  _id: string;
  name: string;
  slug: string;
  subscription_status: string;
  orders_today?: number;
  table_count?: number;
  createdAt?: string;
  owner?: { name?: string; email?: string };
}

export async function getRestaurants(): Promise<SuperAdminRestaurant[]> {
  const data = await apiCaller<Resp<SuperAdminRestaurant[]>>({
    method: "GET",
    endpoint: ENDPOINTS.SA_RESTAURANTS,
    useAdmin: true,
  });
  return data.data ?? [];
}

/**
 * Create a new restaurant (superadmin).
 */
export async function createRestaurant(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const data = await apiCaller<Resp<Record<string, unknown>>>({
    method: "POST",
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
  payload: { count: number; start_number: number },
): Promise<unknown> {
  return apiCaller({
    method: "POST",
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
  csvText: string | null,
  menuRows?: unknown[],
  variantRows?: unknown[],
): Promise<unknown> {
  const payload =
    menuRows && menuRows.length ? { menuRows, variantRows: variantRows ?? [] } : { csvText };
  return apiCaller({
    method: "POST",
    endpoint: ENDPOINTS.SA_MENU(restaurantId),
    payload,
    useAdmin: true,
  });
}

/**
 * Fetch orders for a specific restaurant (superadmin).
 */
export async function getRestaurantOrders(restaurantId: string): Promise<Order[]> {
  const data = await apiCaller<Resp<Order[]>>({
    method: "GET",
    endpoint: ENDPOINTS.SA_REST_ORDERS(restaurantId),
    useAdmin: true,
  });
  return data.data ?? [];
}

export async function getSAPetpoojaConfig(restaurantId: string): Promise<Record<string, unknown>> {
  const data = await apiCaller<Resp<Record<string, unknown>>>({
    method: "GET",
    endpoint: ENDPOINTS.SA_PETPOOJA(restaurantId),
    useAdmin: true,
  });
  return data.data;
}

export async function updateSAPetpoojaConfig(
  restaurantId: string,
  payload: {
    enabled: boolean;
    app_key?: string;
    app_secret?: string;
    access_token?: string;
    rest_id?: string;
  },
): Promise<{ message: string; callback_url: string; menu_push_url: string }> {
  const data = await apiCaller<
    Resp<{ message: string; callback_url: string; menu_push_url: string }>
  >({
    method: "PUT",
    endpoint: ENDPOINTS.SA_PETPOOJA(restaurantId),
    payload,
    useAdmin: true,
  });
  return data.data;
}
