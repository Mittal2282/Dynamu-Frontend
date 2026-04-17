import { useCallback, useEffect, useRef, useState } from "react";
import { getCart, placeOrder, syncCart } from "../../../services/customerService";
import { connectSocket, disconnectSocket, getSocket } from "../../../services/socketService";
import { authStore } from "../../../store/authStore";
import { cartStore, loadVariantCache } from "../../../store/cartStore";
import { chatStore } from "../../../store/chatStore";
import { locationStore } from "../../../store/locationStore";
import { restaurantStore } from "../../../store/restaurantStore";

/**
 * useCustomerSession — handles session init, socket events, cart sync, and order placement.
 */
export default function useCustomerSession(loading, setLoading, setOrderVersion) {
  const { clear, setCart } = cartStore();
  const [ordering, setOrdering] = useState(false);
  const [pendingJoinRequests, setPendingJoinRequests] = useState([]);
  const [sessionReplaced, setSessionReplaced] = useState(false);
  const isRemoteCartUpdate = useRef(false);

  // ── Socket event listeners — run once session is loaded ───────────────────
  useEffect(() => {
    if (loading) return;
    const socket = getSocket();
    if (!socket) return;

    const onCartUpdated = (serverCart) => {
      isRemoteCartUpdate.current = true;
      const localCart = cartStore.getState().cart;
      const newCartMap = {};
      (serverCart.items || []).forEach(
        ({ menu_item, quantity, variant_name, variant_group, variant_price, variant_is_veg }) => {
          if (!menu_item?._id) return;
          const baseId = menu_item._id;
          const baseItem = {
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
              isVeg: variant_is_veg != null ? variant_is_veg : menu_item.is_veg,
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

    const onChatMessage = (payload) => {
      if (payload.origin_socket_id && payload.origin_socket_id === socket.id) return;
      chatStore.getState().addMessage({ role: "user", text: payload.user_text, items: [] });
      chatStore.getState().addMessage({
        role: "ai",
        text: payload.ai_text,
        items: payload.items || [],
      });
    };

    const onJoinRequest = (payload) => {
      setPendingJoinRequests((prev) => [...prev, payload]);
    };

    const onSessionReplaced = () => {
      setSessionReplaced(true);
    };

    const onSessionOutOfRange = (payload = {}) => {
      try {
        sessionStorage.setItem("outOfRangeDetails", JSON.stringify({
          distance_m: payload.distance_m,
          radius_m:   payload.radius_m,
          restaurant_name: payload.restaurant_name || restaurantStore.getState().restaurant?.name || "",
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

    socket.on("cart:updated", onCartUpdated);
    socket.on("order:placed", onOrderPlaced);
    socket.on("order:updated", onOrderUpdated);
    socket.on("chat:message", onChatMessage);
    socket.on("join:request", onJoinRequest);
    socket.on("session:replaced", onSessionReplaced);
    socket.on("session:out_of_range", onSessionOutOfRange);

    return () => {
      socket.off("cart:updated", onCartUpdated);
      socket.off("order:placed", onOrderPlaced);
      socket.off("order:updated", onOrderUpdated);
      socket.off("chat:message", onChatMessage);
      socket.off("join:request", onJoinRequest);
      socket.off("session:replaced", onSessionReplaced);
      socket.off("session:out_of_range", onSessionOutOfRange);
    };
  }, [loading, setOrderVersion]);

  // ── Handle gate complete (session init) ──────────────────────────────────
  const handleGateComplete = useCallback(async (sessionData, guestName) => {
    authStore.getState().setSessionToken(sessionData.session_token);
    authStore.getState().setGuestName(guestName || "");
    restaurantStore.getState().setRestaurant(sessionData.restaurant);
    restaurantStore.getState().setTable(sessionData.table);
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
        const variantCache = loadVariantCache();
        const mergedCart = {};
        apiItems.forEach(
          ({ menu_item, quantity, variant_name, variant_group, variant_price, variant_is_veg }) => {
            const baseId = menu_item._id;
            const baseItem = {
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
                isVeg: variant_is_veg != null ? variant_is_veg : menu_item.is_veg,
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
    async (orderNote = "", { items, navigate, basePath, setDrawerOpen }) => {
      if (ordering || items.length === 0) return;
      setOrdering(true);
      try {
        await syncCart(items);
        await placeOrder(orderNote ? { notes: orderNote } : {});
        clear();
        setDrawerOpen(false);
        navigate(`${basePath}/orders`);
      } catch (err) {
        alert(err?.response?.data?.message || "Failed to place order. Please try again.");
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
