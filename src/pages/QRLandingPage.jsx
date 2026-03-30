import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import AIChatDrawer from '../components/AIChatDrawer';
import BottomNavigator from '../components/BottomNavigator';
import CartDrawer from '../components/CartDrawer';
import { CountBadge, VegBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import Text from '../components/ui/Text';
import useTheme from '../hooks/useTheme';
import { getCart, placeOrder, startSession, syncCart, getCustomerOrders } from '../services/customerService';
import { authStore } from '../store/authStore';
import { cartStore, useCartCount, useCartItems, useCartTotal } from '../store/cartStore';
import { restaurantStore } from '../store/restaurantStore';
import { formatCurrency } from '../utils/formatters';

/* ─── Status config ─────────────────────────────────────────────────────────── */
const ORDER_STATUS_BADGE = {
  pending:   'bg-yellow-500/20 text-yellow-300',
  confirmed: 'bg-blue-500/20 text-blue-300',
  preparing: 'bg-purple-500/20 text-purple-300',
  ready:     'bg-green-500/20 text-green-300',
  served:    'bg-slate-500/20 text-slate-300',
  cancelled: 'bg-red-500/20 text-red-300',
  completed: 'bg-slate-500/20 text-slate-300',
};

const ORDER_STATUS_LABEL = {
  pending:   'Waiting',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready:     'Ready!',
  served:    'Served',
  cancelled: 'Cancelled',
  completed: 'Done',
};

/* ─── Cart control per item ─────────────────────────────────────────────────── */
function CartControl({ item }) {
  const { add, remove, getQty } = cartStore();
  const q = getQty(item._id);

  if (q === 0) {
    return (
      <Button size="sm" onClick={() => add(item)} className="tracking-wider">
        ADD
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => remove(item)}
        className="w-7 h-7 rounded-full bg-[var(--color-brand-primary)] text-white font-bold flex items-center justify-center active:scale-95 transition-transform"
      >
        −
      </button>
      <Text as="span" size="sm" weight="bold" className="w-4 text-center">{q}</Text>
      <button
        onClick={() => add(item)}
        className="w-7 h-7 rounded-full bg-[var(--color-brand-primary)] text-white font-bold flex items-center justify-center active:scale-95 transition-transform"
      >
        +
      </button>
    </div>
  );
}

/* ─── My Orders section ─────────────────────────────────────────────────────── */
function MyOrders({ currencySymbol }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getCustomerOrders();
      setOrders(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  if (loading) return (
    <div className="flex justify-center py-10">
      <Spinner size="md" />
    </div>
  );

  if (orders.length === 0) return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
      <span className="text-4xl">🍽️</span>
      <Text color="muted" size="sm">No orders placed yet.</Text>
      <Text color="muted" size="xs">Add items from the menu and place your order!</Text>
    </div>
  );

  return (
    <div className="px-4 py-4 space-y-3">
      {orders.map(order => (
        <div key={order._id} className="bg-slate-800/80 border border-white/5 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <Text size="sm" weight="bold">Order #{order.order_number}</Text>
              <Text size="xs" color="muted">
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {order.is_addon && (
                  <span className="ml-2 text-orange-300">· Add-on</span>
                )}
              </Text>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ORDER_STATUS_BADGE[order.status] ?? 'bg-white/10 text-slate-300'}`}>
              {ORDER_STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>

          <ul className="space-y-0.5">
            {order.items?.map((item, i) => (
              <li key={i} className="flex justify-between text-xs text-slate-400">
                <span>{item.name}</span>
                <span>×{item.quantity}</span>
              </li>
            ))}
          </ul>

          {order.estimated_prep_time && (
            <Text size="xs" color="secondary">
              Est. ready in ~{order.estimated_prep_time} min
            </Text>
          )}

          <div className="pt-1 border-t border-white/10 flex justify-between">
            <Text size="xs" color="muted">Total</Text>
            <Text size="sm" weight="bold" color="brand">
              {formatCurrency(order.total_amount, currencySymbol)}
            </Text>
          </div>
        </div>
      ))}

      <Text size="xs" color="muted" className="text-center pb-2">
        Status updates automatically every 15s
      </Text>
    </div>
  );
}

/* ─── QR Landing Page ───────────────────────────────────────────────────────── */
export default function QRLandingPage() {
  const { qrCodeId, tableNumber } = useParams();

  useTheme();

  const { add, remove, clear, setCart, getQty } = cartStore();
  const items = useCartItems();
  const count = useCartCount();
  const total = useCartTotal();
  const { name, tagline, currencySymbol, tableNumber: storedTable } = restaurantStore();

  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [menu, setMenu]             = useState({});
  const [selected, setSelected]     = useState(null);
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [aiChatOpen, setAiChatOpen]     = useState(false);
  const [ordering, setOrdering]         = useState(false);
  // 'menu' | 'orders'
  const [activeTab, setActiveTab] = useState('menu');

  // ── Session start ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const sessionData = await startSession(qrCodeId, tableNumber);

        authStore.getState().setSessionToken(sessionData.session_token);
        restaurantStore.getState().setRestaurant(sessionData.restaurant);
        restaurantStore.getState().setTable(sessionData.table);

        setMenu(sessionData.menu);
        setSelected(Object.keys(sessionData.menu)[0] ?? null);

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
        } catch {
          // Keep localStorage cart
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load the menu. Please scan the QR again.');
      } finally {
        setLoading(false);
      }
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrCodeId, tableNumber]);

  // ── Sync cart to backend ─────────────────────────────────────────────────────
  const itemsStr = JSON.stringify(items.map(i => ({ _id: i._id, qty: i.qty })));

  useEffect(() => {
    if (!authStore.getState().sessionToken || loading) return;
    syncCart(items).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsStr, loading]);

  // ── Place order ──────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (ordering || items.length === 0) return;
    setOrdering(true);
    try {
      // Ensure server cart is up-to-date before placing
      await syncCart(items);
      await placeOrder();
      clear();
      setDrawerOpen(false);
      setActiveTab('orders');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Spinner size="xl" />
        <Text size="sm" color="muted">Loading menu…</Text>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-4xl">😕</p>
        <Text color="secondary">{error}</Text>
      </div>
    );
  }

  const categories = Object.keys(menu);
  const menuItems  = selected ? (menu[selected] ?? []) : [];
  const drawerSubtitle = name ? `${name} · Table ${storedTable ?? tableNumber}` : '';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 px-4 pt-6 pb-3 sticky top-0 z-20 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <Text as="h1" size="xl" weight="bold">{name}</Text>
            {tagline && (
              <Text size="xs" color="muted" className="mt-0.5">{tagline}</Text>
            )}
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

        {/* Menu / Orders tabs */}
        <div className="flex mt-3 border-b border-white/10">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'menu'
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Menu
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'orders'
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Orders
          </button>
        </div>

        {/* Category strip (only on menu tab) */}
        {activeTab === 'menu' && (
          <div className="flex gap-2 overflow-x-auto mt-3 pb-1 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelected(cat)}
                className={[
                  'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
                  selected === cat
                    ? 'bg-brand text-white shadow-lg shadow-brand-primary-40'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20',
                ].join(' ')}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      {activeTab === 'orders' ? (
        <MyOrders currencySymbol={currencySymbol} />
      ) : (
        <div className={`flex-1 px-4 py-4 space-y-3 ${count > 0 ? 'pb-40' : 'pb-24'}`}>
          {menuItems.length === 0 && (
            <Text color="muted" className="text-center mt-10">No items in this category.</Text>
          )}

          {menuItems.map(item => (
            <div key={item._id} className="bg-slate-800/80 rounded-xl p-4 flex gap-3 items-start border border-white/5">
              <VegBadge isVeg={item.is_veg} className="mt-1" />

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <Text as="span" size="sm" weight="semibold" className="leading-snug">{item.name}</Text>
                  <Text as="span" size="sm" weight="bold" color="brand" className="shrink-0">
                    {formatCurrency(item.price_label ?? item.price, currencySymbol)}
                  </Text>
                </div>
                {item.description && (
                  <Text size="xs" color="muted" className="mt-1 line-clamp-2">{item.description}</Text>
                )}
                <div className="mt-3 flex justify-end">
                  <CartControl item={item} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer / Navigation ──────────────────────────────────────────────── */}
      <BottomNavigator
        activeTab={aiChatOpen ? 'chat' : drawerOpen ? 'cart' : 'menu'}
        onMenuClick={() => { setAiChatOpen(false); setDrawerOpen(false); setActiveTab('menu'); }}
        onChatClick={() => { setAiChatOpen(true); setDrawerOpen(false); }}
        onCartClick={() => { setDrawerOpen(true); setAiChatOpen(false); }}
      />

      {/* ── Cart bottom bar ──────────────────────────────────────────────────── */}
      {count > 0 && activeTab === 'menu' && (
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

      {/* ── Drawers ──────────────────────────────────────────────────────────── */}
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
