import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useCartCount, useCartItems, useCartTotal, cartStore } from "../../../store/cartStore";
import { restaurantStore } from "../../../store/restaurantStore";
import { authStore } from "../../../store/authStore";
import { disconnectSocket } from "../../../services/socketService";
import { syncCart } from "../../../services/customerService";
import { buildCssTokens, applyCssTokens, DEFAULT_THEME_NUMBER } from "../../../theme/tokens";
import {
  getTrendingItems,
  getChefsSpecials,
  getFeaturedItems,
  getTimeBasedMenu,
} from "../../../services/customerService";

import Header from "../../../components/common/Header";
import BottomNavigator from "../../../components/common/BottomNavigator";
import CartDrawer from "../../../components/common/CartDrawer/CartDrawer";
import AIChatDrawer from "../../../components/common/AIChatDrawer/AIChatDrawer";
import SessionGate from "../../../components/customer/SessionGate";
import { Spinner } from "../../../components/ui/Spinner";
import Text from "../../../components/ui/Text";

import useCustomerSession from "./useCustomerSession";
import CartBar from "./CartBar";
import JoinRequestsPanel from "./JoinRequestsPanel";
import DesktopAIFab from "./DesktopAIFab";

export default function CustomerLayout() {
  const { qrCodeId, tableNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Theme ──
  const { themeNumber } = restaurantStore();
  useEffect(() => {
    const tokens = buildCssTokens(themeNumber || DEFAULT_THEME_NUMBER);
    applyCssTokens(tokens);
  }, [themeNumber]);

  const { remove } = cartStore();
  const items = useCartItems();
  const count = useCartCount();
  const total = useCartTotal();
  const { name, tableNumber: storedTable, menu } = restaurantStore();

  const [gateComplete, setGateComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const openedCartFromAI = useRef(false);
  const [orderVersion, setOrderVersion] = useState(0);

  // Special sections
  const [trendingItems, setTrendingItems] = useState([]);
  const [chefsSpecials, setChefsSpecials] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [timeBasedItems, setTimeBasedItems] = useState([]);
  const [mealTime, setMealTime] = useState("");
  const [sectionsLoading, setSectionsLoading] = useState(true);

  const basePath = `/${qrCodeId}/${tableNumber}`;
  const path = location.pathname;
  const isOrders = path === `${basePath}/orders`;

  const {
    ordering,
    pendingJoinRequests,
    setPendingJoinRequests,
    sessionReplaced,
    isRemoteCartUpdate,
    handleGateComplete: sessionGateComplete,
    handlePlaceOrder: sessionPlaceOrder,
  } = useCustomerSession(loading, setLoading, setOrderVersion);

  // ── Disconnect socket on unmount ──
  useEffect(() => () => disconnectSocket(), []);

  // ── Sync cart to backend ──
  const itemsStr = JSON.stringify(items.map((i) => ({ _id: i._id, qty: i.qty })));
  useEffect(() => {
    if (!authStore.getState().sessionToken || loading || isRemoteCartUpdate.current) return;
    syncCart(items).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsStr, loading]);

  // ── Gate callback ──
  const handleGateComplete = async (sessionData, guestName) => {
    try {
      await sessionGateComplete(sessionData, guestName);

      // Fetch special sections in parallel
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

      setGateComplete(true);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Could not load the menu. Please scan the QR again.",
      );
      setGateComplete(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Place order wrapper ──
  const handlePlaceOrder = async (orderNote = "") => {
    await sessionPlaceOrder(orderNote, { items, navigate, basePath, setDrawerOpen });
  };

  const toggleAI = () => {
    setAiChatOpen((v) => !v);
    setDrawerOpen(false);
  };

  // ── Early returns ──
  if (!gateComplete) {
    return (
      <SessionGate
        qrCodeId={qrCodeId}
        tableNumber={tableNumber}
        onSessionReady={handleGateComplete}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Spinner size="xl" />
        <Text size="sm" color="muted">Loading menu…</Text>
      </div>
    );
  }

  if (sessionReplaced) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">🔄</div>
        <Text as="h1" size="xl" weight="bold">Session Ended</Text>
        <Text size="sm" color="muted">
          A new session has been started at this table. Please scan the QR code again to continue.
        </Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-4xl">😕</p>
        <Text color="secondary">{error}</Text>
      </div>
    );
  }

  const drawerSubtitle = name ? `${name} · Table ${storedTable ?? tableNumber}` : "";

  return (
    <div
      className="w-full md:max-w-3xl lg:max-w-full mx-auto min-h-screen bg-slate-950 text-white flex flex-col"
      style={{ backgroundColor: "color-mix(in srgb, var(--t-bg) 96%, black)" }}
    >
      <Header
        variant="customer"
        onCartClick={() => setDrawerOpen(true)}
        basePath={basePath}
        aiChatOpen={aiChatOpen}
        onAIClick={toggleAI}
      />

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
            onOpenAI: toggleAI,
          }}
        />
      </div>

      {!isOrders && <CartBar count={count} onViewCart={() => setDrawerOpen(true)} />}

      <DesktopAIFab aiChatOpen={aiChatOpen} onToggle={toggleAI} />

      <JoinRequestsPanel
        requests={pendingJoinRequests}
        onResolve={(id) => setPendingJoinRequests((prev) => prev.filter((r) => r.request_id !== id))}
      />

      {/* Bottom navigator — mobile only */}
      <div className="md:hidden">
        <BottomNavigator
          basePath={basePath}
          aiChatOpen={aiChatOpen}
          onChatClick={toggleAI}
          onNavigate={() => { setAiChatOpen(false); setDrawerOpen(false); }}
        />
      </div>

      {/* Drawers */}
      <CartDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          if (openedCartFromAI.current) {
            openedCartFromAI.current = false;
            setAiChatOpen(true);
          }
        }}
        items={items}
        onRemove={remove}
        onPlaceOrder={handlePlaceOrder}
        total={total}
        count={count}
        loading={ordering}
        subtitle={drawerSubtitle}
      />

      <AIChatDrawer
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        onGoToCart={() => {
          openedCartFromAI.current = true;
          setAiChatOpen(false);
          setDrawerOpen(true);
        }}
      />
    </div>
  );
}
