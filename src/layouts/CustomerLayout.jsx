import { useEffect, useRef, useState } from 'react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import AIChatDrawer from '../components/AIChatDrawer';
import BottomNavigator from '../components/BottomNavigator';
import CartDrawer from '../components/CartDrawer';
import Header from '../components/Header';
import Button from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import Text from '../components/ui/Text';
import useTheme from '../hooks/useTheme';
import {
  getCart, placeOrder, startSession, syncCart,
  getTrendingItems, getChefsSpecials, getFeaturedItems,
} from '../services/customerService';
import { connectSocket, disconnectSocket, getSocket } from '../services/socketService';
import { authStore } from '../store/authStore';
import { cartStore, useCartCount, useCartItems, useCartTotal } from '../store/cartStore';
import { chatStore } from '../store/chatStore';
import { restaurantStore } from '../store/restaurantStore';
import { formatCurrency } from '../utils/formatters';

export default function CustomerLayout() {
  const { qrCodeId, tableNumber } = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();

  useTheme();

  const { add, remove, clear, setCart } = cartStore();
  const items = useCartItems();
  const count = useCartCount();
  const total = useCartTotal();
  const { name, tagline, currencySymbol, tableNumber: storedTable, menu } = restaurantStore();

  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [ordering, setOrdering]     = useState(false);
  const [orderVersion, setOrderVersion] = useState(0);
  const isRemoteCartUpdate = useRef(false);

  const [trendingItems, setTrendingItems] = useState([]);
  const [chefsSpecials, setChefsSpecials] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);

  // Base path for this QR session
  const basePath = `/${qrCodeId}/${tableNumber}`;

  // Determine active tab from current URL
  const path = location.pathname;
  const isMenu   = path === `${basePath}/menu`;
  const isOrders = path === `${basePath}/orders`;
  const isHome   = !isMenu && !isOrders;

  // ── Session start ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const sessionData = await startSession(qrCodeId, tableNumber);

        authStore.getState().setSessionToken(sessionData.session_token);
        restaurantStore.getState().setRestaurant(sessionData.restaurant);
        restaurantStore.getState().setTable(sessionData.table);
        restaurantStore.getState().setMenu(sessionData.menu ?? {});

        // Connect socket — listeners are attached in a separate effect below
        connectSocket(sessionData.session_token);

        // Fetch special sections in parallel (non-blocking)
        getTrendingItems().then(setTrendingItems).catch(() => {});
        getChefsSpecials().then(setChefsSpecials).catch(() => {});
        getFeaturedItems().then(setFeaturedItems).catch(() => {});

        // Restore server-side cart
        try {
          const cartData = await getCart();
          const apiItems = cartData?.items;
          if (Array.isArray(apiItems) && apiItems.length > 0) {
            const cartMap = {};
            apiItems.forEach(({ menu_item, quantity }) => {
              cartMap[menu_item._id] = {
                _id:         menu_item._id,
                name:        menu_item.name,
                price:       menu_item.price,
                is_veg:      menu_item.is_veg,
                description: menu_item.description,
                qty:         quantity,
              };
            });
            setCart(cartMap);
          }
        } catch { /* keep localStorage cart */ }
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load the menu. Please scan the QR again.');
      } finally {
        setLoading(false);
      }
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrCodeId, tableNumber]);

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
            _id:         menu_item._id,
            name:        menu_item.name,
            price:       menu_item.price,
            is_veg:      menu_item.is_veg,
            description: menu_item.description,
            qty:         quantity,
          };
        }
      });
      cartStore.getState().setCart(cartMap);
      setTimeout(() => { isRemoteCartUpdate.current = false; }, 100);
    };

    const onOrderPlaced  = () => setOrderVersion(v => v + 1);
    const onOrderUpdated = () => setOrderVersion(v => v + 1);

    const onChatMessage = (payload) => {
      // Skip on the device that sent it — messages already added optimistically
      if (payload.origin_socket_id && payload.origin_socket_id === socket.id) return;
      chatStore.getState().addMessage({ role: 'user', text: payload.user_text, items: [] });
      chatStore.getState().addMessage({ role: 'ai',   text: payload.ai_text,   items: payload.items || [] });
    };

    socket.on('cart:updated',  onCartUpdated);
    socket.on('order:placed',  onOrderPlaced);
    socket.on('order:updated', onOrderUpdated);
    socket.on('chat:message',  onChatMessage);

    return () => {
      socket.off('cart:updated',  onCartUpdated);
      socket.off('order:placed',  onOrderPlaced);
      socket.off('order:updated', onOrderUpdated);
      socket.off('chat:message',  onChatMessage);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // ── Sync cart to backend ───────────────────────────────────────────────────
  const itemsStr = JSON.stringify(items.map(i => ({ _id: i._id, qty: i.qty })));
  useEffect(() => {
    if (!authStore.getState().sessionToken || loading || isRemoteCartUpdate.current) return;
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
      alert(err?.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <Spinner size="xl" />
      <Text size="sm" color="muted">Loading menu…</Text>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-4xl">😕</p>
      <Text color="secondary">{error}</Text>
    </div>
  );

  const drawerSubtitle = name ? `${name} · Table ${storedTable ?? tableNumber}` : '';

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white flex flex-col">

      <Header variant="customer" onCartClick={() => setDrawerOpen(true)} />

      {/* ── Child page ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0">
        <Outlet context={{ menu, featuredItems, chefsSpecials, trendingItems, orderVersion, basePath }} />
      </div>

      {/* ── Cart bottom bar — Home and Menu routes ───────────────────────── */}
      {count > 0 && !isOrders && (
        <div className="fixed bottom-[85px] left-0 right-0 z-30 flex justify-center px-4">
          <div className="w-full max-w-md bg-brand rounded-2xl px-5 py-4 flex items-center justify-between shadow-2xl shadow-brand-primary-40">
            <div>
              <Text size="sm" weight="bold">{count} {count === 1 ? 'item' : 'items'} added</Text>
              <p className="text-orange-100 text-xs mt-0.5">
                Total <span className="font-bold text-white">{formatCurrency(total, currencySymbol)}</span>
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

      {/* ── Bottom navigator ──────────────────────────────────────────────── */}
      <BottomNavigator
        basePath={basePath}
        aiChatOpen={aiChatOpen}
        onChatClick={() => { setAiChatOpen(v => !v); setDrawerOpen(false); }}
        onNavigate={() => { setAiChatOpen(false); setDrawerOpen(false); }}
      />

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

      <AIChatDrawer
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
      />
    </div>
  );
}
