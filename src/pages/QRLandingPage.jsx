import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AIChatDrawer from '../components/AIChatDrawer';
import BottomNavigator from '../components/BottomNavigator';
import CartDrawer from '../components/CartDrawer';
import { CountBadge, VegBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import Text from '../components/ui/Text';
import useTheme from '../hooks/useTheme';
import { getCart, placeOrder, startSession, syncCart } from '../services/customerService';
import { authStore } from '../store/authStore';
import { cartStore, useCartCount, useCartItems, useCartTotal } from '../store/cartStore';
import { restaurantStore } from '../store/restaurantStore';
import { formatCurrency } from '../utils/formatters';

/* ─── Cart control per item ─────────────────────────────────────────────────── */
function CartControl({ item }) {
  const { add, remove, getQty } = cartStore();
  const q = getQty(item._id);

  if (q === 0) {
    return (
      <Button
        size="sm"
        onClick={() => add(item)}
        className="tracking-wider"
      >
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

/* ─── QR Landing Page ───────────────────────────────────────────────────────── */
export default function QRLandingPage() {
  const { restaurantId, tableNumber } = useParams();

  // Apply restaurant brand colors as CSS vars
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

  // ── Session start ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const sessionData = await startSession(restaurantId, tableNumber);

        // Persist session token
        authStore.getState().setSessionToken(sessionData.session_token);

        // Populate restaurant + table stores
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
          // Keep localStorage cart; server cart unavailable
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load the menu. Please scan the QR again.');
      } finally {
        setLoading(false);
      }
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, tableNumber]);

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
      await placeOrder({
        tableNumber: storedTable ?? tableNumber,
        items,
        totalPrice: total,
      });
      clear();
      syncCart([]).catch(() => {});
      setDrawerOpen(false);
      alert('Order placed! 👨‍🍳');
    } catch {
      alert('Failed to place order. Please try again.');
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
      <div className="bg-slate-900 px-4 pt-6 pb-4 sticky top-0 z-20 border-b border-white/5">
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
            {/* AI chat */}
            <button
              onClick={() => setAiChatOpen(true)}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl active:scale-95 transition-transform"
              aria-label="AI Menu Assistant"
            >
              🤖
            </button>

            {/* Cart */}
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

        {/* Category strip */}
        <div className="flex gap-2 overflow-x-auto mt-4 pb-1 no-scrollbar">
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
      </div>

      {/* ── Menu items ──────────────────────────────────────────────────────── */}
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

      {/* ── Footer / Navigation ──────────────────────────────────────────────── */}
      <BottomNavigator 
        activeTab={aiChatOpen ? 'chat' : drawerOpen ? 'cart' : 'menu'}
        onMenuClick={() => { setAiChatOpen(false); setDrawerOpen(false); }}
        onChatClick={() => { setAiChatOpen(true); setDrawerOpen(false); }}
        onCartClick={() => { setDrawerOpen(true); setAiChatOpen(false); }}
      />

      {/* ── Cart bottom bar ──────────────────────────────────────────────────── */}
      {count > 0 && (
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
