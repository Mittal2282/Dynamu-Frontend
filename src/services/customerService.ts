import { apiCaller } from '../api/apiCaller';
import { ENDPOINTS } from '../utils/endpoints';

import type { MenuItem } from '../types/menu';
import type { CartEntry, SyncCartItem } from '../types/cart';
import type { Order } from '../types/order';

/**
 * Customer-facing API services.
 * All functions return response.data (already unwrapped by apiCaller).
 */

interface LocationPayload {
  latitude: number | null;
  longitude: number | null;
  accuracy_m?: number | null;
}

export interface SessionData {
  session_token: string;
  restaurant: Record<string, unknown>;
  table: Record<string, unknown>;
  menu: Record<string, MenuItem[]>;
}

export interface CartResponse {
  items: CartEntry[];
}

/**
 * Start a customer session by scanning a QR code.
 */
export async function startSession(
  qrCodeId: string,
  tableNumber: string | number,
  name = '',
  forceNew = false,
  location: LocationPayload | null = null
): Promise<SessionData> {
  const payload: Record<string, unknown> = {
    qr_code_id: qrCodeId,
    name,
    force_new: forceNew,
  };
  if (location && location.latitude != null && location.longitude != null) {
    payload.customer_latitude   = location.latitude;
    payload.customer_longitude  = location.longitude;
    payload.customer_accuracy_m = location.accuracy_m ?? null;
  }
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.SESSION_START,
    payload,
  });
  return data.data;
}

export async function checkSession(
  qrCodeId: string,
  existingToken: string | null = null
): Promise<Record<string, unknown>> {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.SESSION_CHECK,
    payload:  { qr_code_id: qrCodeId, session_token: existingToken },
  });
  return data.data;
}

export async function requestJoinSession(
  qrCodeId: string,
  joinerName: string
): Promise<Record<string, unknown>> {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.SESSION_REQUEST_JOIN,
    payload:  { qr_code_id: qrCodeId, joiner_name: joinerName },
  });
  return data.data;
}

export async function getJoinStatus(requestId: string): Promise<Record<string, unknown>> {
  const data = await apiCaller({
    method:   'GET',
    endpoint: ENDPOINTS.SESSION_JOIN_STATUS(requestId),
  });
  return data.data;
}

export async function respondToJoin(
  requestId: string,
  approved: boolean
): Promise<Record<string, unknown>> {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.SESSION_RESPOND_JOIN,
    payload:  { request_id: requestId, approved },
  });
  return data.data;
}

/**
 * Fetch the current session cart from the server.
 */
export async function getCart(): Promise<CartResponse> {
  const data = await apiCaller({ method: 'GET', endpoint: ENDPOINTS.CART });
  return data.data;
}

/**
 * Sync cart to the server (fire-and-forget friendly).
 */
export async function syncCart(items: CartEntry[]): Promise<unknown> {
  const formattedItems: SyncCartItem[] = items.map((item) => ({
    _id: item._id,
    quantity: item.qty,
    instruction: item.instruction,
    // Variant fields — server stores and returns these so variant info survives page refresh
    variant_name:   item.selectedVariant?.name      || undefined,
    variant_group:  item.selectedVariant?.groupName || undefined,
    variant_price:  item.selectedVariant?.price     ?? undefined,
    variant_is_veg: item.selectedVariant != null
      ? (item.selectedVariant.isVeg ?? undefined)
      : undefined,
  }));
  return apiCaller({
    method:   'PUT',
    endpoint: ENDPOINTS.CART,
    payload:  { items: formattedItems },
  });
}

/**
 * Place an order from the current session cart.
 */
export async function placeOrder(
  payload: { notes?: string; payment_method?: string } = {}
): Promise<Order> {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.PLACE_ORDER,
    payload,
  });
  return data.data;
}

/**
 * Get all orders for the current session.
 */
export async function getCustomerOrders(): Promise<Order[]> {
  const data = await apiCaller({ method: 'GET', endpoint: ENDPOINTS.CUSTOMER_ORDERS });
  return data.data ?? [];
}

/**
 * Request final bill / end the customer table session.
 */
export async function endCustomerSession(
  payload: { reason?: string } = {}
): Promise<{ success?: boolean; message?: string }> {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.SESSION_END,
    payload:  { reason: 'request_bill', ...payload },
  });
  return data.data ?? data;
}

/**
 * Request final bill (customer). Prefer this for QR flow; backend may alias SESSION_END.
 */
export async function requestBill(): Promise<unknown> {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.REQUEST_BILL,
  });
  return data.data ?? data;
}

/**
 * Get AI-powered cart suggestions (3 complementary items).
 */
export async function getCartSuggestions(cartItemIds: string[]): Promise<MenuItem[]> {
  const data = await apiCaller({
    method:  'POST',
    endpoint: ENDPOINTS.CART_SUGGESTIONS,
    payload:  { cart_item_ids: cartItemIds },
  });
  return data.data ?? [];
}

/**
 * Get top 10 trending items for this restaurant (past 7 days).
 */
export async function getTrendingItems(): Promise<MenuItem[]> {
  const data = await apiCaller({ method: 'GET', endpoint: ENDPOINTS.MENU_TRENDING });
  return data.data ?? [];
}

/**
 * Get Chef's Special items for this restaurant.
 */
export async function getChefsSpecials(): Promise<MenuItem[]> {
  const data = await apiCaller({ method: 'GET', endpoint: ENDPOINTS.MENU_CHEFS_SPECIAL });
  return data.data ?? [];
}

/**
 * Get featured items (restaurant-configured or 5 random fallback).
 */
export async function getFeaturedItems(): Promise<MenuItem[]> {
  const data = await apiCaller({ method: 'GET', endpoint: ENDPOINTS.MENU_FEATURED });
  return data.data ?? [];
}

/**
 * Get available menu items for the current time slot (breakfast / lunch / dinner).
 * Passes the client's local hour so the server uses the user's timezone.
 */
export async function getTimeBasedMenu(): Promise<{ items: MenuItem[]; meal_time: string }> {
  const data = await apiCaller({
    method:   'GET',
    endpoint: ENDPOINTS.MENU_TIME_BASED,
    params:   { hour: new Date().getHours() },
  });
  return { items: data.data ?? [], meal_time: data.meal_time ?? '' };
}
