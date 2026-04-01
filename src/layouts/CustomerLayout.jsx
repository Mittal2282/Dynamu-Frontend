import { useEffect, useState } from 'react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import AIChatDrawer from '../components/AIChatDrawer';
import BottomNavigator from '../components/BottomNavigator';
import CartDrawer from '../components/CartDrawer';
import { CountBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import Text from '../components/ui/Text';
import useTheme from '../hooks/useTheme';
import {
  getCart, placeOrder, startSession, syncCart,
  getTrendingItems, getChefsSpecials, getFeaturedItems,
} from '../services/customerService';
import { authStore } from '../store/authStore';
import { cartStore, useCartCount, useCartItems, useCartTotal } from '../store/cartStore';
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
  const { name, tagline, currencySymbol, tableNumber: storedTable } = restaurantStore();

  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [menu, setMenu]         = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [ordering, setOrdering]     = useState(false);

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

        setMenu(sessionData.menu);

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

  // ── Sync cart to backend ───────────────────────────────────────────────────
  const itemsStr = JSON.stringify(items.map(i => ({ _id: i._id, qty: i.qty })));
  useEffect(() => {
    if (!authStore.getState().sessionToken || loading) return;
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

  const TABS = [
    { label: 'Home',      path: basePath,            active: isHome },
    { label: 'Menu',      path: `${basePath}/menu`,   active: isMenu },
    { label: 'My Orders', path: `${basePath}/orders`, active: isOrders },
  ];

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white flex flex-col">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 px-4 pt-6 pb-3 sticky top-0 z-20 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <Text as="h1" size="xl" weight="bold">{name}</Text>
            {tagline && <Text size="xs" color="muted" className="mt-0.5">{tagline}</Text>}
            <Text size="xs" color="secondary" className="mt-0.5">
              Table {storedTable ?? tableNumber}
            </Text>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAiChatOpen(true)}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl active:scale-95 transition-transform"
              aria-label="AI Menu Assistant"
            >
              🤖
            </button>
            {count > 0 && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="relative"
                aria-label={`View cart — ${count} items`}
              >
                <span className="text-2xl">🛒</span>
                <CountBadge count={count} />
              </button>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex mt-3 border-b border-white/10">
          {TABS.map(tab => (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                tab.active
                  ? 'text-orange-400 border-b-2 border-orange-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Child page ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0">
        <Outlet context={{ menu, featuredItems, chefsSpecials, trendingItems }} />
      </div>

      {/* ── Cart bottom bar — only on Menu route ──────────────────────────── */}
      {count > 0 && isMenu && (
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
        activeTab={aiChatOpen ? 'chat' : drawerOpen ? 'cart' : 'menu'}
        onMenuClick={() => { setAiChatOpen(false); setDrawerOpen(false); navigate(`${basePath}/menu`); }}
        onChatClick={() => { setAiChatOpen(true); setDrawerOpen(false); }}
        onCartClick={() => { setDrawerOpen(true); setAiChatOpen(false); }}
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
