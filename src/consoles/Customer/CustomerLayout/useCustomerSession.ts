import { useCallback, useEffect, useRef, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import { getCart, placeOrder, syncCart } from "../../../services/customerService";
import { connectSocket, disconnectSocket, getSocket } from "../../../services/socketService";
import { authStore } from "../../../store/authStore";
import { cartStore, loadVariantCache } from "../../../store/cartStore";
import { chatStore } from "../../../store/chatStore";
import { locationStore } from "../../../store/locationStore";
import { restaurantStore } from "../../../store/restaurantStore";

import type { CartEntry } from "../../../types/cart";
import type { MenuItem } from "../../../types/menu";

// ─── Session data shape returned by startSession ──────────────────────────────

export interface SessionRestaurant {
  name?: string;
  settings?: {
    enforce_proximity?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SessionTable {
  [key: string]: unknown;
}

export interface SessionData {
  session_token: string;
  restaurant: SessionRestaurant;
  table: SessionTable;
  menu?: Record<string, MenuItem[]>;
}

// ─── Server cart payload (from socket cart:updated event) ─────────────────────

interface ServerCartItem {
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

// ─── placeOrder call context ──────────────────────────────────────────────────

interface PlaceOrderContext {
  items: CartEntry[];
  navigate: NavigateFunction;
  basePath: string;
  setDrawerOpen: (open: boolean) => void;
}

// ─── Return type ──────────────────────────────────────────────────────────────

export interface UseCustomerSessionReturn {
  ordering: boolean;
  pendingJoinRequests: Record<string, unknown>[];
  setPendingJoinRequests: React.Dispatch<React.SetStateAction<Record<string, unknown>[]>>;
  sessionReplaced: boolean;
  isRemoteCartUpdate: React.MutableRefObject<boolean>;
  handleGateComplete: (sessionData: SessionData, guestName: string) => Promise<void>;
  handlePlaceOrder: (orderNote: string, context: PlaceOrderContext) => Promise<void>;
}

/**
 * useCustomerSession — handles session init, socket events, cart sync, and order placement.
 */
export default function useCustomerSession(
  loading: boolean,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setOrderVersion: React.Dispatch<React.SetStateAction<number>>
): UseCustomerSessionReturn {
  const { clear, setCart } = cartStore();
  const [ordering, setOrdering] = useState(false);
  const [pendingJoinRequests, setPendingJoinRequests] = useState<Record<string, unknown>[]>([]);
  const [sessionReplaced, setSessionReplaced] = useState(false);
  const isRemoteCartUpdate = useRef(false);

  // ── Socket event listeners — run once session is loaded ───────────────────
  useEffect(() => {
    if (loading) return;
    const socket = getSocket();
    if (!socket) return;

    const onCartUpdated = (serverCart: { items?: ServerCartItem[] }) => {
      isRemoteCartUpdate.current = true;
      const localCart = cartStore.getState().cart as Record<string, CartEntry>;
      const newCartMap: Record<string, CartEntry> = {};

      (serverCart.items || []).forEach(
        ({ menu_item, quantity, variant_name, variant_group, variant_price, variant_is_veg }) => {
          if (!menu_item?._id) return;
          const baseId = menu_item._id;
          const baseItem: Omit<CartEntry, 'qty'> = {
            _id: baseId,
            name: menu_item.name,
            price: menu_item.price,
            discount_percentage: menu_item.discount_percentage || 0,
            is_veg: menu_item.is_veg,
            description: menu_item.description,
            image_url: menu_item.image_url,
          };

          if (variant_name) {
            const cKey = `${baseId}__${variant_name}`;
            const selectedVariant = {
              name: variant_name,
              groupName: variant_group || undefined,
              price: variant_price ?? menu_item.price,
              isVeg: variant_is_veg != null ? variant_is_veg : (menu_item.is_veg ?? undefined),
            };
            const existing = localCart[cKey];
            newCartMap[cKey] = existing
              ? { ...existing, qty: quantity }
              : { ...baseItem, _cartKey: cKey, selectedVariant, qty: quantity };
          } else {
            const localEntries = Object.entries(localCart).filter(
              ([k]) => k === baseId || k.startsWith(`${baseId}__`),
            );
            if (localEntries.length === 0) {
              newCartMap[baseId] = { ...baseItem, _cartKey: baseId, qty: quantity };
            } else if (localEntries.length === 1) {
              const [localKey, localItem] = localEntries[0];
              newCartMap[localKey] = { ...localItem, qty: quantity };
            } else {
              localEntries.forEach(([k, v]) => {
                newCartMap[k] = v;
              });
            }
          }
        },
      );
      cartStore.getState().setCart(newCartMap);
      setTimeout(() => {
        isRemoteCartUpdate.current = false;
      }, 100);
    };

    const onOrderPlaced = () => setOrderVersion((v) => v + 1);
    const onOrderUpdated = () => setOrderVersion((v) => v + 1);

    const onChatMessage = (payload: {
      origin_socket_id?: string;
      user_text?: string;
      ai_text?: string;
      items?: MenuItem[];
    }) => {
      if (payload.origin_socket_id && payload.origin_socket_id === socket.id) return;
      chatStore.getState().addMessage({ role: "user", text: payload.user_text ?? "", items: [] });
      chatStore.getState().addMessage({
        role: "ai",
        text: payload.ai_text ?? "",
        items: payload.items || [],
      });
    };

    const onJoinRequest = (payload: Record<string, unknown>) => {
      setPendingJoinRequests((prev) => [...prev, payload]);
    };

    const onSessionReplaced = () => {
      setSessionReplaced(true);
    };

    const onSessionOutOfRange = (payload: {
      distance_m?: number;
      radius_m?: number;
      restaurant_name?: string;
    } = {}) => {
      try {
        sessionStorage.setItem("outOfRangeDetails", JSON.stringify({
          distance_m: payload.distance_m,
          radius_m:   payload.radius_m,
          restaurant_name: payload.restaurant_name || restaurantStore.getState().name || "",
          at: Date.now(),
        }));
      } catch { /* ignore */ }
      authStore.getState().resetAuth();
      locationStore.getState().stop();
      disconnectSocket();
      if (typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/customer/out-of-range")) {
        window.location.replace("/customer/out-of-range");
      }
    };

    socket.on("cart:updated" as never, onCartUpdated);
    socket.on("order:placed" as never, onOrderPlaced);
    socket.on("order:updated" as never, onOrderUpdated);
    socket.on("chat:message" as never, onChatMessage);
    socket.on("join:request" as never, onJoinRequest);
    socket.on("session:replaced" as never, onSessionReplaced);
    socket.on("session:out_of_range" as never, onSessionOutOfRange);

    return () => {
      socket.off("cart:updated" as never, onCartUpdated);
      socket.off("order:placed" as never, onOrderPlaced);
      socket.off("order:updated" as never, onOrderUpdated);
      socket.off("chat:message" as never, onChatMessage);
      socket.off("join:request" as never, onJoinRequest);
      socket.off("session:replaced" as never, onSessionReplaced);
      socket.off("session:out_of_range" as never, onSessionOutOfRange);
    };
  }, [loading, setOrderVersion]);

  // ── Handle gate complete (session init) ──────────────────────────────────
  const handleGateComplete = useCallback(async (
    sessionData: SessionData,
    guestName: string
  ): Promise<void> => {
    authStore.getState().setSessionToken(sessionData.session_token);
    authStore.getState().setGuestName(guestName || "");
    restaurantStore.getState().setRestaurant(sessionData.restaurant as import('../../../types').Restaurant);
    restaurantStore.getState().setTable(sessionData.table as import('../../../types').TableData);
    restaurantStore.getState().setMenu(sessionData.menu ?? {});

    // If geofencing is disabled for this restaurant, don't track/store customer GPS at all.
    if (sessionData.restaurant?.settings?.enforce_proximity === false) {
      locationStore.getState().stop();
      locationStore.getState().reset();
    }

    connectSocket(sessionData.session_token);

    // Restore server-side cart
    try {
      const cartData = await getCart();
      const apiItems = cartData?.items;
      if (Array.isArray(apiItems) && apiItems.length > 0) {
        const variantCache = loadVariantCache() as Record<string, CartEntry['selectedVariant']>;
        const mergedCart: Record<string, CartEntry> = {};
        (apiItems as ServerCartItem[]).forEach(
          ({ menu_item, quantity, variant_name, variant_group, variant_price, variant_is_veg }) => {
            const baseId = menu_item._id;
            const baseItem: Omit<CartEntry, 'qty'> = {
              _id: baseId,
              name: menu_item.name,
              price: menu_item.price,
              discount_percentage: menu_item.discount_percentage || 0,
              is_veg: menu_item.is_veg,
              description: menu_item.description,
              image_url: menu_item.image_url,
            };

            if (variant_name) {
              const cKey = `${baseId}__${variant_name}`;
              const selectedVariant = {
                name: variant_name,
                groupName: variant_group || undefined,
                price: variant_price ?? menu_item.price,
                isVeg: variant_is_veg != null ? variant_is_veg : (menu_item.is_veg ?? undefined),
              };
              mergedCart[cKey] = { ...baseItem, _cartKey: cKey, selectedVariant, qty: quantity };
            } else {
              const cachedKeys = Object.keys(variantCache).filter((k) =>
                k.startsWith(`${baseId}__`),
              );
              if (cachedKeys.length === 1) {
                const cKey = cachedKeys[0];
                mergedCart[cKey] = {
                  ...baseItem,
                  _cartKey: cKey,
                  selectedVariant: variantCache[cKey],
                  qty: quantity,
                };
              } else {
                mergedCart[baseId] = { ...baseItem, _cartKey: baseId, qty: quantity };
              }
            }
          },
        );
        setCart(mergedCart);
      }
    } catch {
      /* keep existing cart */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Place order ────────────────────────────────────────────────────────────
  const handlePlaceOrder = useCallback(
    async (orderNote: string, { items, navigate, basePath, setDrawerOpen }: PlaceOrderContext): Promise<void> => {
      if (ordering || items.length === 0) return;
      setOrdering(true);
      try {
        await syncCart(items);
        await placeOrder(orderNote ? { notes: orderNote } : {});
        clear();
        setDrawerOpen(false);
        navigate(`${basePath}/orders`);
      } catch (err: unknown) {
        const message =
          err != null &&
          typeof err === 'object' &&
          'response' in err &&
          err.response != null &&
          typeof err.response === 'object' &&
          'data' in err.response &&
          err.response.data != null &&
          typeof err.response.data === 'object' &&
          'message' in err.response.data
            ? String(err.response.data.message)
            : "Failed to place order. Please try again.";
        alert(message);
      } finally {
        setOrdering(false);
      }
    },
    [ordering, clear],
  );

  return {
    ordering,
    pendingJoinRequests,
    setPendingJoinRequests,
    sessionReplaced,
    isRemoteCartUpdate,
    handleGateComplete,
    handlePlaceOrder,
  };
}
