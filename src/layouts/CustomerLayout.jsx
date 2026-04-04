import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import AIChatDrawer from "../components/AIChatDrawer";
import BottomNavigator from "../components/BottomNavigator";
import CartDrawer from "../components/CartDrawer";
import Header from "../components/Header";
import SessionGate from "../components/customer/SessionGate";
import Button from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import Text from "../components/ui/Text";
import useTheme from "../hooks/useTheme";
import {
  getCart,
  getChefsSpecials,
  getFeaturedItems,
  getTimeBasedMenu,
  getTrendingItems,
  placeOrder,
  respondToJoin,
  syncCart,
} from "../services/customerService";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
} from "../services/socketService";
import { authStore } from "../store/authStore";
import {
  cartStore,
  useCartCount,
  useCartItems,
  useCartTotal,
} from "../store/cartStore";
import { chatStore } from "../store/chatStore";
import { restaurantStore } from "../store/restaurantStore";
import { formatCurrency } from "../utils/formatters";

export default function CustomerLayout() {
  const { qrCodeId, tableNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  useTheme();

  const { add, remove, clear, setCart } = cartStore();
  const items = useCartItems();
  const count = useCartCount();
  const total = useCartTotal();
  const {
    name,
    currencySymbol,
    tableNumber: storedTable,
    menu,
  } = restaurantStore();

  const [gateComplete, setGateComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderVersion, setOrderVersion] = useState(0);
  const [pendingJoinRequests, setPendingJoinRequests] = useState([]);
  const [sessionReplaced, setSessionReplaced] = useState(false);
  const isRemoteCartUpdate = useRef(false);

  const [trendingItems, setTrendingItems] = useState([]);
  const [chefsSpecials, setChefsSpecials] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [timeBasedItems, setTimeBasedItems] = useState([]);
  const [mealTime, setMealTime] = useState("");
  const [sectionsLoading, setSectionsLoading] = useState(true);

  // Base path for this QR session
  const basePath = `/${qrCodeId}/${tableNumber}`;

  // Determine active tab from current URL
  const path = location.pathname;
  const isOrders = path === `${basePath}/orders`;

  // ── Gate callback — called by SessionGate once name/session is confirmed ──
  const handleGateComplete = useCallback(async (sessionData, guestName) => {
    try {
      authStore.getState().setSessionToken(sessionData.session_token);
      authStore.getState().setGuestName(guestName || "");
      restaurantStore.getState().setRestaurant(sessionData.restaurant);
      restaurantStore.getState().setTable(sessionData.table);
      restaurantStore.getState().setMenu(sessionData.menu ?? {});

      // Connect socket — listeners attached in the effect below
      connectSocket(sessionData.session_token);

      // Fetch special sections in parallel, track loading state
      setSectionsLoading(true);
      Promise.allSettled([
        getTrendingItems().then(setTrendingItems),
        getChefsSpecials().then(setChefsSpecials),
        getFeaturedItems().then(setFeaturedItems),
        getTimeBasedMenu().then(({ items, meal_time }) => {
          setTimeBasedItems(items);
          setMealTime(meal_time);
        }),
      ]).finally(() => setSectionsLoading(false));

      // Restore server-side cart
      try {
        const cartData = await getCart();
        const apiItems = cartData?.items;
        if (Array.isArray(apiItems) && apiItems.length > 0) {
          const cartMap = {};
          apiItems.forEach(({ menu_item, quantity }) => {
            cartMap[menu_item._id] = {
              _id: menu_item._id,
              name: menu_item.name,
              price: menu_item.price,
              discount_percentage: menu_item.discount_percentage || 0,
              is_veg: menu_item.is_veg,
              description: menu_item.description,
              image_url: menu_item.image_url,
              qty: quantity,
            };
          });
          setCart(cartMap);
        }
      } catch {
        /* keep existing cart */
      }

      setGateComplete(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Could not load the menu. Please scan the QR again.",
      );
      setGateComplete(true); // show error screen
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Disconnect socket on unmount ───────────────────────────────────────────
  useEffect(() => () => disconnectSocket(), []);

  // ── Socket event listeners — run once session is loaded ───────────────────
  useEffect(() => {
    if (loading) return;
    const socket = getSocket();
    if (!socket) return;

    const onCartUpdated = (serverCart) => {
      isRemoteCartUpdate.current = true;
      const cartMap = {};
      (serverCart.items || []).forEach(({ menu_item, quantity }) => {
        if (menu_item?._id) {
          cartMap[menu_item._id] = {
            _id: menu_item._id,
            name: menu_item.name,
            price: menu_item.price,
            discount_percentage: menu_item.discount_percentage || 0,
            is_veg: menu_item.is_veg,
            description: menu_item.description,
            image_url: menu_item.image_url,
            qty: quantity,
          };
        }
      });
      cartStore.getState().setCart(cartMap);
      setTimeout(() => {
        isRemoteCartUpdate.current = false;
      }, 100);
    };

    const onOrderPlaced = () => setOrderVersion((v) => v + 1);
    const onOrderUpdated = () => setOrderVersion((v) => v + 1);

    const onChatMessage = (payload) => {
      // Skip on the device that sent it — messages already added optimistically
      if (payload.origin_socket_id && payload.origin_socket_id === socket.id)
        return;
      chatStore
        .getState()
        .addMessage({ role: "user", text: payload.user_text, items: [] });
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

    socket.on("cart:updated", onCartUpdated);
    socket.on("order:placed", onOrderPlaced);
    socket.on("order:updated", onOrderUpdated);
    socket.on("chat:message", onChatMessage);
    socket.on("join:request", onJoinRequest);
    socket.on("session:replaced", onSessionReplaced);

    return () => {
      socket.off("cart:updated", onCartUpdated);
      socket.off("order:placed", onOrderPlaced);
      socket.off("order:updated", onOrderUpdated);
      socket.off("chat:message", onChatMessage);
      socket.off("join:request", onJoinRequest);
      socket.off("session:replaced", onSessionReplaced);
    };
  }, [loading]);

  // ── Sync cart to backend ───────────────────────────────────────────────────
  const itemsStr = JSON.stringify(
    items.map((i) => ({ _id: i._id, qty: i.qty })),
  );
  useEffect(() => {
    if (
      !authStore.getState().sessionToken ||
      loading ||
      isRemoteCartUpdate.current
    )
      return;
    syncCart(items).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsStr, loading]);

  // ── Place order ────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (ordering || items.length === 0) return;
    setOrdering(true);
    try {
      await syncCart(items);
      await placeOrder();
      clear();
      setDrawerOpen(false);
      navigate(`${basePath}/orders`);
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          "Failed to place order. Please try again.",
      );
    } finally {
      setOrdering(false);
    }
  };

  // Show gate screen until name/session is confirmed
  if (!gateComplete)
    return (
      <SessionGate
        qrCodeId={qrCodeId}
        tableNumber={tableNumber}
        onSessionReady={handleGateComplete}
      />
    );

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Spinner size="xl" />
        <Text size="sm" color="muted">
          Loading menu…
        </Text>
      </div>
    );

  // Full-screen overlay when this session was evicted by a new session
  if (sessionReplaced)
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">🔄</div>
        <Text as="h1" size="xl" weight="bold">
          Session Ended
        </Text>
        <Text size="sm" color="muted">
          A new session has been started at this table. Please scan the QR code
          again to continue.
        </Text>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-4xl">😕</p>
        <Text color="secondary">{error}</Text>
      </div>
    );

  const drawerSubtitle = name
    ? `${name} · Table ${storedTable ?? tableNumber}`
    : "";

  return (
    <div
      className="w-full md:max-w-3xl lg:max-w-full mx-auto min-h-screen bg-slate-950 text-white flex flex-col"
      style={{
        backgroundColor: "color-mix(in srgb, var(--t-bg) 96%, black)",
      }}
    >
      <Header
        variant="customer"
        onCartClick={() => setDrawerOpen(true)}
        basePath={basePath}
        aiChatOpen={aiChatOpen}
        onAIClick={() => {
          setAiChatOpen((v) => !v);
          setDrawerOpen(false);
        }}
      />

      {/* ── Child page ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0">
        <Outlet
          context={{
            menu,
            featuredItems,
            chefsSpecials,
            trendingItems,
            timeBasedItems,
            mealTime,
            orderVersion,
            basePath,
            sectionsLoading,
            onPlaceOrder: handlePlaceOrder,
            orderingCart: ordering,
            onOpenAI: () => {
              setAiChatOpen((v) => !v);
              setDrawerOpen(false);
            },
          }}
        />
      </div>

      {/* ── Cart bottom bar — mobile only ────────────────────────────────── */}
      {count > 0 && !isOrders && (
        <div className="md:hidden fixed bottom-[95px] left-0 right-0 z-30 flex justify-center px-4">
          <div className="w-full bg-brand rounded-2xl px-5 py-4 flex items-center justify-between shadow-2xl shadow-[var(--t-accent-40)]">
            <div>
              <Text size="sm" weight="bold">
                {count} {count === 1 ? "item" : "items"} added
              </Text>
              <p className="text-orange-100 text-xs mt-0.5">
                Total{" "}
                <span className="font-bold text-white">
                  {formatCurrency(total, currencySymbol)}
                </span>
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDrawerOpen(true)}
              className="!bg-white !text-brand font-bold"
            >
              View Cart →
            </Button>
          </div>
        </div>
      )}

      {/* ── Desktop floating AI FAB — bottom-right ───────────────────────── */}
      <div className="hidden md:flex fixed bottom-6 right-6 z-30">
        <button
          type="button"
          onClick={() => {
            setAiChatOpen((v) => !v);
            setDrawerOpen(false);
          }}
          className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-2xl text-2xl"
          style={{
            background: aiChatOpen ? "var(--t-accent)" : "var(--t-surface)",
            border: "1.5px solid var(--t-accent2-40)",
            boxShadow: "0 8px 24px var(--t-accent2-40)",
          }}
          title={aiChatOpen ? "Close AI Assistant" : "Open AI Assistant"}
        >
          {aiChatOpen ? "✕" : "🤖"}
        </button>
      </div>

      {/* ── Pending join requests panel ──────────────────────────────────── */}
      {pendingJoinRequests.length > 0 && (
        <div className="fixed bottom-[85px] md:bottom-5 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
          <div className="w-full md:max-w-3xl lg:max-w-full bg-slate-800 border border-white/10 rounded-2xl shadow-xl overflow-hidden pointer-events-auto">
            <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
              <span className="text-base">🔔</span>
              <Text size="sm" weight="semibold">
                Join Requests ({pendingJoinRequests.length})
              </Text>
            </div>
            <div className="divide-y divide-white/5">
              {pendingJoinRequests.map((req) => (
                <div
                  key={req.request_id}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <Text size="sm" color="muted" className="flex-1 truncate">
                    <span className="text-white font-medium">
                      {req.joiner_name}
                    </span>{" "}
                    wants to join
                  </Text>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        await respondToJoin(req.request_id, true).catch(
                          () => {},
                        );
                        setPendingJoinRequests((prev) =>
                          prev.filter((r) => r.request_id !== req.request_id),
                        );
                      }}
                      className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 flex items-center justify-center text-base hover:bg-green-500/40 transition-colors"
                      title="Accept"
                    >
                      ✓
                    </button>
                    <button
                      onClick={async () => {
                        await respondToJoin(req.request_id, false).catch(
                          () => {},
                        );
                        setPendingJoinRequests((prev) =>
                          prev.filter((r) => r.request_id !== req.request_id),
                        );
                      }}
                      className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center text-base hover:bg-red-500/40 transition-colors"
                      title="Reject"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom navigator — mobile only ────────────────────────────────── */}
      <div className="md:hidden">
        <BottomNavigator
          basePath={basePath}
          aiChatOpen={aiChatOpen}
          onChatClick={() => {
            setAiChatOpen((v) => !v);
            setDrawerOpen(false);
          }}
          onNavigate={() => {
            setAiChatOpen(false);
            setDrawerOpen(false);
          }}
        />
      </div>

      {/* ── Drawers ───────────────────────────────────────────────────────── */}
      <CartDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={items}
        onAdd={add}
        onRemove={remove}
        onPlaceOrder={handlePlaceOrder}
        total={total}
        count={count}
        loading={ordering}
        subtitle={drawerSubtitle}
      />

      <AIChatDrawer isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} />
    </div>
  );
}
