import { apiCaller } from '../api/apiCaller';
import adminApi from '../api/adminAxios';
import { ENDPOINTS } from '../utils/endpoints';

import type { Order } from '../types/order';
import type { MenuItem } from '../types/menu';
import type { TableData } from '../types/restaurant';

type Resp<T> = { data: T };

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function adminLogin(payload: {
  email: string;
  password: string;
}): Promise<{ accessToken: string; refreshToken: string; user: { role: string; name: string } }> {
  const data = await apiCaller<Resp<{ accessToken: string; refreshToken: string; user: { role: string; name: string } }>>({
    method:   'POST',
    endpoint: ENDPOINTS.ADMIN_LOGIN,
    payload,
    useAdmin: true,
  });
  return data.data;
}

export async function adminLogout(refreshToken: string): Promise<unknown> {
  return apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.ADMIN_LOGOUT,
    payload:  { refresh_token: refreshToken },
    useAdmin: true,
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashProfile {
  name?: string;
  [key: string]: unknown;
}

export async function getDashProfile(): Promise<DashProfile> {
  const data = await apiCaller<Resp<DashProfile>>({
    method:   'GET',
    endpoint: ENDPOINTS.DASH_PROFILE,
    useAdmin: true,
  });
  return data.data;
}

export async function getDashOrders(): Promise<Order[]> {
  const data = await apiCaller<Resp<Order[]>>({
    method:   'GET',
    endpoint: ENDPOINTS.DASH_ORDERS,
    useAdmin: true,
  });
  return data.data ?? [];
}

export async function getDashStats(): Promise<Record<string, unknown>> {
  const data = await apiCaller<Resp<Record<string, unknown>>>({
    method:   'GET',
    endpoint: ENDPOINTS.DASH_STATS,
    useAdmin: true,
  });
  return data.data;
}

export async function getCompletedOrders(
  { dateFrom, dateTo }: { dateFrom?: string; dateTo?: string } = {}
): Promise<Order[]> {
  const params = new URLSearchParams({ statuses: 'completed,served' });
  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setDate(toDate.getDate() + 1);
    params.append('date_to', toDate.toISOString().split('T')[0]);
  }
  const data = await apiCaller<Resp<Order[]>>({
    method:   'GET',
    endpoint: `${ENDPOINTS.DASH_ORDERS}?${params.toString()}`,
    useAdmin: true,
  });
  return data.data ?? [];
}

export async function createManualOrder(payload: {
  items: unknown[];
  customer_name?: string;
  notes?: string;
  order_date?: string;
  table_id?: string;
}): Promise<Order> {
  const data = await apiCaller<Resp<Order>>({
    method:   'POST',
    endpoint: ENDPOINTS.DASH_ORDERS_MANUAL,
    payload,
    useAdmin: true,
  });
  return data.data;
}

export async function createBulkOrders(
  rows: unknown[],
  orderDate: string,
  source = 'bulk'
): Promise<{ created: number; failed: unknown[] }> {
  const data = await apiCaller<Resp<{ created: number; failed: unknown[] }>>({
    method:   'POST',
    endpoint: ENDPOINTS.DASH_ORDERS_BULK_MANUAL,
    payload:  { rows, order_date: orderDate, source },
    useAdmin: true,
  });
  return data.data;
}

// ─── Menu Management ──────────────────────────────────────────────────────────

export interface PaginatedMenuResult {
  items: MenuItem[];
  total: number;
  hasMore: boolean;
}

export interface DashMenuParams {
  search?: string;
  category?: string;
  availability?: string;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export async function getDashMenu(params: DashMenuParams = {}): Promise<PaginatedMenuResult> {
  const data = await apiCaller<PaginatedMenuResult>({
    method:   'GET',
    endpoint: ENDPOINTS.DASH_MENU,
    params,
    useAdmin: true,
  });
  return { items: data.items ?? [], total: data.total ?? 0, hasMore: data.hasMore ?? false };
}

export async function updateDashMenuItem(
  id: string,
  payload: { name?: string; price?: number; [key: string]: unknown }
): Promise<MenuItem> {
  const data = await apiCaller<Resp<MenuItem>>({
    method:   'PUT',
    endpoint: ENDPOINTS.DASH_MENU_ITEM(id),
    payload,
    useAdmin: true,
  });
  return data.data;
}

export async function getDashTables(): Promise<TableData[]> {
  const data = await apiCaller<Resp<TableData[]>>({
    method:   'GET',
    endpoint: ENDPOINTS.DASH_TABLES,
    useAdmin: true,
  });
  return data.data ?? [];
}

export async function freeTable(tableId: string): Promise<unknown> {
  return apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.DASH_TABLE_FREE(tableId),
    useAdmin: true,
  });
}

export async function toggleTableActive(tableId: string): Promise<unknown> {
  return apiCaller({
    method:   'PATCH',
    endpoint: ENDPOINTS.DASH_TABLE_TOGGLE_ACTIVE(tableId),
    useAdmin: true,
  });
}

export async function addTablesToFloor(floorData: Record<string, unknown>): Promise<unknown> {
  return apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.DASH_TABLES_BULK,
    payload:  floorData,
    useAdmin: true,
  });
}

export async function closeTableSession(sessionId: string): Promise<Record<string, unknown>> {
  const data = await apiCaller<Resp<Record<string, unknown>>>({
    method:   'POST',
    endpoint: ENDPOINTS.DASH_CLOSE_SESSION(sessionId),
    useAdmin: true,
  });
  return data.data;
}

export async function toggleDashMenuItem(id: string): Promise<MenuItem> {
  const data = await apiCaller<Resp<MenuItem>>({
    method:   'PATCH',
    endpoint: ENDPOINTS.DASH_MENU_TOGGLE(id),
    useAdmin: true,
  });
  return data.data;
}

export async function toggleChefsSpecial(id: string): Promise<MenuItem> {
  const data = await apiCaller<Resp<MenuItem>>({
    method:   'PATCH',
    endpoint: ENDPOINTS.DASH_MENU_CHEFS_SPECIAL(id),
    useAdmin: true,
  });
  return data.data;
}

export async function deleteDashMenuItem(id: string): Promise<unknown> {
  return apiCaller({
    method:   'DELETE',
    endpoint: ENDPOINTS.DASH_MENU_ITEM_DELETE(id),
    useAdmin: true,
  });
}

export async function toggleFeatured(id: string): Promise<MenuItem> {
  const data = await apiCaller<Resp<MenuItem>>({
    method:   'PATCH',
    endpoint: ENDPOINTS.DASH_MENU_FEATURED(id),
    useAdmin: true,
  });
  return data.data;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getDashCategories(): Promise<string[]> {
  const data = await apiCaller<Resp<string[]>>({
    method:   'GET',
    endpoint: ENDPOINTS.DASH_CATEGORIES,
    useAdmin: true,
  });
  return data.data ?? [];
}

export async function createDashCategory(name: string): Promise<string> {
  const data = await apiCaller<Resp<string>>({
    method:   'POST',
    endpoint: ENDPOINTS.DASH_CATEGORIES,
    payload:  { name },
    useAdmin: true,
  });
  return data.data;
}

// ─── Menu Items ───────────────────────────────────────────────────────────────

export async function createDashMenuItem(payload: Record<string, unknown>): Promise<MenuItem> {
  const data = await apiCaller<Resp<MenuItem>>({
    method:   'POST',
    endpoint: ENDPOINTS.DASH_MENU,
    payload,
    useAdmin: true,
  });
  return data.data;
}

export async function bulkImportMenuItems(
  csvText: string | null,
  menuRows?: unknown[],
  variantRows?: unknown[]
): Promise<{ imported: number; errors: string[] }> {
  const payload = (menuRows && menuRows.length)
    ? { menuRows, variantRows: variantRows ?? [] }
    : { csvText };
  const data = await apiCaller<Resp<{ imported: number; errors: string[] }>>({
    method:   'POST',
    endpoint: ENDPOINTS.DASH_MENU_BULK,
    payload,
    useAdmin: true,
  });
  return data.data;
}

export async function uploadMenuItemImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await adminApi.post(ENDPOINTS.DASH_MENU_IMAGE_UPLOAD, formData);
  return res.data.data.url;
}

// ─── Ingredients ──────────────────────────────────────────────────────────────

export interface Ingredient {
  name: string;
  is_available: boolean;
  affected_count: number;
  items_using?: { _id: string; name: string; is_veg?: boolean; image_url?: string; price?: number }[];
}

export interface PaginatedIngredientsResult {
  items: Ingredient[];
  total: number;
  hasMore: boolean;
}

export interface IngredientsParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export async function getIngredients(params: IngredientsParams = {}): Promise<PaginatedIngredientsResult> {
  const data = await apiCaller<PaginatedIngredientsResult>({
    method:   'GET',
    endpoint: ENDPOINTS.DASH_INGREDIENTS,
    params,
    useAdmin: true,
  });
  return { items: data.items ?? [], total: data.total ?? 0, hasMore: data.hasMore ?? false };
}

export async function toggleIngredient(
  name: string,
  isAvailable: boolean
): Promise<Record<string, unknown>> {
  const data = await apiCaller<Resp<Record<string, unknown>>>({
    method:   'PATCH',
    endpoint: ENDPOINTS.DASH_INGREDIENTS_TOGGLE,
    payload:  { name, is_available: isAvailable },
    useAdmin: true,
  });
  return data.data;
}

// ─── Location / Proximity ─────────────────────────────────────────────────────

export interface RestaurantLocation {
  location: { latitude: number; longitude: number; label?: string } | null;
  proximity_radius_m: number;
  enforce_proximity: boolean;
}

export async function getRestaurantLocation(): Promise<RestaurantLocation> {
  const data = await apiCaller<Resp<RestaurantLocation>>({
    method:   'GET',
    endpoint: ENDPOINTS.DASH_LOCATION,
    useAdmin: true,
  });
  return data.data;
}

export async function updateRestaurantLocation(payload: {
  latitude: number;
  longitude: number;
  accuracy_m?: number;
  label?: string;
  radius_m: number;
  enforce_proximity?: boolean;
}): Promise<RestaurantLocation> {
  const data = await apiCaller<Resp<RestaurantLocation>>({
    method:   'PUT',
    endpoint: ENDPOINTS.DASH_LOCATION,
    payload,
    useAdmin: true,
  });
  return data.data;
}

// ─── Petpooja ─────────────────────────────────────────────────────────────────

export interface PetpoojaConfig {
  enabled: boolean;
  app_key: string;
  has_secret: boolean;
  has_token: boolean;
  rest_id: string;
  menu_synced_at: string | null;
  callback_url: string | null;
  menu_push_url: string | null;
}

export async function getPetpoojaConfig(): Promise<PetpoojaConfig> {
  const data = await apiCaller<Resp<PetpoojaConfig>>({
    method:   'GET',
    endpoint: ENDPOINTS.DASH_PETPOOJA_CONFIG,
    useAdmin: true,
  });
  return data.data;
}

export async function updatePetpoojaConfig(payload: {
  enabled: boolean;
  app_key?: string;
  app_secret?: string;
  access_token?: string;
  rest_id?: string;
}): Promise<{ message: string; callback_url: string; menu_push_url: string }> {
  const data = await apiCaller<Resp<{ message: string; callback_url: string; menu_push_url: string }>>({
    method:   'PUT',
    endpoint: ENDPOINTS.DASH_PETPOOJA_CONFIG,
    payload,
    useAdmin: true,
  });
  return data.data;
}
