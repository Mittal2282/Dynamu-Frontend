import { apiCaller } from '../api/apiCaller';
import { ENDPOINTS } from '../utils/endpoints';

import type { MenuItem } from '../types/menu';
import type { CartEntry, SyncCartItem } from '../types/cart';
import type { Order } from '../types/order';

type Resp<T> = { data: T };

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

export interface ServerCartItem {
  menu_item: {
    _id: string;
    name: string;
    price: number;
    discount_percentage?: number;
    is_veg?: boolean | null;
    description?: string;
    image_url?: string;
  };
  quantity: number;
  variant_name?: string;
  variant_group?: string;
  variant_price?: number;
  variant_is_veg?: boolean | null;
}

export interface CartResponse {
  items: ServerCartItem[];
}

export async function startSession(
  qrCodeId: string,
  _tableNumber: string | number,
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
  const data = await apiCaller<Resp<SessionData>>({
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
  const data = await apiCaller<Resp<Record<string, unknown>>>({
    method:   'POST',
    endpoint: ENDPOINTS.SESSION_CHECK,
    payload:  { qr_code_id: qrCodeId, session_token: existingToken || "" },
  });
  return data.data;
}

export async function requestJoinSession(
  qrCodeId: string,
  joinerName: string
): Promise<Record<string, unknown>> {
  const data = await apiCaller<Resp<Record<string, unknown>>>({
    method:   'POST',
    endpoint: ENDPOINTS.SESSION_REQUEST_JOIN,
    payload:  { qr_code_id: qrCodeId, joiner_name: joinerName },
  });
  return data.data;
}

export async function getJoinStatus(requestId: string): Promise<Record<string, unknown>> {
  const data = await apiCaller<Resp<Record<string, unknown>>>({
    method:   'GET',
    endpoint: ENDPOINTS.SESSION_JOIN_STATUS(requestId),
  });
  return data.data;
}

export async function respondToJoin(
  requestId: string,
  approved: boolean
): Promise<Record<string, unknown>> {
  const data = await apiCaller<Resp<Record<string, unknown>>>({
    method:   'POST',
    endpoint: ENDPOINTS.SESSION_RESPOND_JOIN,
    payload:  { request_id: requestId, approved },
  });
  return data.data;
}

export async function getCart(): Promise<CartResponse> {
  const data = await apiCaller<Resp<CartResponse>>({
    method:   'GET',
    endpoint: ENDPOINTS.CART,
  });
  return data.data;
}

export async function syncCart(items: CartEntry[]): Promise<unknown> {
  const formattedItems: SyncCartItem[] = items.map((item) => ({
    _id: item._id,
    quantity: item.qty,
    instruction: item.instruction,
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

export async function placeOrder(
  payload: { notes?: string; payment_method?: string } = {}
): Promise<Order> {
  const data = await apiCaller<Resp<Order>>({
    method:   'POST',
    endpoint: ENDPOINTS.PLACE_ORDER,
    payload,
  });
  return data.data;
}

export async function getCustomerOrders(): Promise<Order[]> {
  const data = await apiCaller<Resp<Order[]>>({
    method:   'GET',
    endpoint: ENDPOINTS.CUSTOMER_ORDERS,
  });
  return data.data ?? [];
}

export async function endCustomerSession(
  payload: { reason?: string } = {}
): Promise<{ success?: boolean; message?: string }> {
  const data = await apiCaller<Resp<{ success?: boolean; message?: string }>>({
    method:   'POST',
    endpoint: ENDPOINTS.SESSION_END,
    payload:  { reason: 'request_bill', ...payload },
  });
  return data.data;
}

export async function requestBill(): Promise<unknown> {
  return apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.REQUEST_BILL,
  });
}

export async function getCartSuggestions(cartItemIds: string[]): Promise<MenuItem[]> {
  const data = await apiCaller<Resp<MenuItem[]>>({
    method:   'POST',
    endpoint: ENDPOINTS.CART_SUGGESTIONS,
    payload:  { cart_item_ids: cartItemIds },
  });
  return data.data ?? [];
}

export async function getTrendingItems(): Promise<MenuItem[]> {
  const data = await apiCaller<Resp<MenuItem[]>>({
    method:   'GET',
    endpoint: ENDPOINTS.MENU_TRENDING,
  });
  return data.data ?? [];
}

export async function getChefsSpecials(): Promise<MenuItem[]> {
  const data = await apiCaller<Resp<MenuItem[]>>({
    method:   'GET',
    endpoint: ENDPOINTS.MENU_CHEFS_SPECIAL,
  });
  return data.data ?? [];
}

export async function getFeaturedItems(): Promise<MenuItem[]> {
  const data = await apiCaller<Resp<MenuItem[]>>({
    method:   'GET',
    endpoint: ENDPOINTS.MENU_FEATURED,
  });
  return data.data ?? [];
}

export async function getTimeBasedMenu(): Promise<{ items: MenuItem[]; meal_time: string }> {
  const data = await apiCaller<{ data: MenuItem[]; meal_time: string }>({
    method:   'GET',
    endpoint: ENDPOINTS.MENU_TIME_BASED,
    params:   { hour: new Date().getHours() },
  });
  return { items: data.data ?? [], meal_time: data.meal_time ?? '' };
}
