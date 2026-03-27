import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosInstance';
import CartDrawer from '../components/CartDrawer';
import AIChatDrawer from '../components/AIChatDrawer';

/* ─── Persistent cart hook ──────────────────────────────────────────────────
   Cart is keyed by qrCodeId so it survives page refreshes for the same table.
   Every mutation is persisted to localStorage immediately and synced to the
   backend via PUT /api/cart (fire-and-forget so the server tracks the cart).
   On session start we also try GET /api/cart to restore any server-side cart.
────────────────────────────────────────────────────────────────────────────── */
function useCart(qrCodeId) {
  const storageKey = `dynamu_cart_${qrCodeId}`;

  const [cart, setCartState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch {
      return {};
    }
  });

  // Persist to localStorage + sync to API on every cart change
  useEffect(() => {
    try {
      if (Object.keys(cart).length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(cart));
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {}

    // Sync to backend (fire and forget — session token is sent via interceptor)
    api.put('/api/customer/cart', { items: Object.values(cart) }).catch(() => {});
  }, [cart, storageKey]);

  const add = useCallback((item) => {
    setCartState(prev => ({
      ...prev,
      [item._id]: { ...item, qty: (prev[item._id]?.qty ?? 0) + 1 },
    }));
  }, []);

  const remove = useCallback((item) => {
    setCartState(prev => {
      const qty = (prev[item._id]?.qty ?? 0) - 1;
      if (qty <= 0) {
        const { [item._id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [item._id]: { ...prev[item._id], qty } };
    });
  }, []);

  const clear = useCallback(() => {
    setCartState({});
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // Call after session start to pull any server-saved cart
  const loadFromAPI = useCallback(async () => {
    try {
      const res = await api.get('/api/customer/cart');
      const apiItems = res.data?.data?.items;
      if (Array.isArray(apiItems) && apiItems.length > 0) {
        const apiCart = {};
        apiItems.forEach(item => {
          // Transform backend format → frontend format
          const mi = item.menu_item;
          apiCart[mi._id] = {
            _id: mi._id,
            name: mi.name,
            price: mi.price,
            is_veg: mi.is_veg,
            description: mi.description,
            qty: item.quantity,
          };
        });
        setCartState(apiCart);
        localStorage.setItem(storageKey, JSON.stringify(apiCart));
      }
    } catch {
      // Keep the localStorage cart — server cart unavailable
    }
  }, [storageKey]);

  const qty    = (id) => cart[id]?.qty ?? 0;
  const items  = Object.values(cart);
  const count  = items.reduce((s, i) => s + i.qty, 0);
  const total  = items.reduce((s, i) => s + i.price * i.qty, 0);

  return { add, remove, clear, loadFromAPI, qty, count, total, items };
}

/* ─── Add / qty control per item ───────────────────────────────────────────── */
function CartControl({ item, cart }) {
  const q = cart.qty(item._id);
  if (q === 0) {
    return (
      <button
        onClick={() => cart.add(item)}
        className="px-4 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold active:scale-95 transition-transform"
      >
        ADD
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => cart.remove(item)}
        className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold text-base flex items-center justify-center active:scale-95 transition-transform"
      >
        −
      </button>
      <span className="text-sm font-bold w-4 text-center">{q}</span>
      <button
        onClick={() => cart.add(item)}
        className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold text-base flex items-center justify-center active:scale-95 transition-transform"
      >
        +
      </button>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */
export default function QRLandingPage() {
  const { qrCodeId } = useParams();
  const cart = useCart(qrCodeId);

  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [table, setTable]           = useState(null);
  const [menu, setMenu]             = useState({});
  const [selected, setSelected]     = useState(null);
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [aiChatOpen, setAiChatOpen]     = useState(false);
  const [ordering, setOrdering]         = useState(false);

  useEffect(() => {
    api.post('/api/customer/session/start', { qr_code_id: qrCodeId })
      .then(async res => {
        const { session_token, restaurant, table, menu } = res.data.data;
        localStorage.setItem('session_token', session_token);
        setRestaurant(restaurant);
        setTable(table);
        setMenu(menu);
        setSelected(Object.keys(menu)[0] ?? null);
        // Load any server-persisted cart for this session
        await cart.loadFromAPI();
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Could not load the menu. Please scan the QR again.');
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrCodeId]);

  const handlePlaceOrder = async () => {
    if (ordering || cart.items.length === 0) return;
    setOrdering(true);
    try {
      await api.post('/api/order', {
        table_number: table?.table_number,
        items: cart.items,
        total_price: cart.total,
      });
      cart.clear();
      // Clear server cart after order is placed
      api.put('/api/customer/cart', { items: [] }).catch(() => {});
      setDrawerOpen(false);
      alert('Order placed! 👨‍🍳');
    } catch {
      alert('Failed to place order. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading menu…</p>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
        <p className="text-4xl">😕</p>
        <p className="text-slate-300">{error}</p>
      </div>
    );
  }

  const categories = Object.keys(menu);
  const items      = selected ? (menu[selected] ?? []) : [];

  const drawerSubtitle = restaurant && table
    ? `${restaurant.name} · Table ${table.table_number}`
    : '';

  /* ── Menu ── */
  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white flex flex-col">

      {/* Header */}
      <div className="bg-slate-900 px-4 pt-6 pb-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
            <p className="text-sm text-slate-400 mt-0.5">Table {table.table_number}</p>
          </div>
          {/* Header action buttons */}
          <div className="flex items-center gap-2">
            {/* AI chat button — always visible */}
            <button
              onClick={() => setAiChatOpen(true)}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl active:scale-95 transition-transform"
              aria-label="AI Menu Assistant"
            >
              🤖
            </button>
            {/* Cart icon — visible when cart has items */}
            {cart.count > 0 && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="relative"
                aria-label="View cart"
              >
                <span className="text-2xl">🛒</span>
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cart.count}
                </span>
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
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selected === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/10 text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className={`flex-1 px-4 py-4 space-y-3 ${cart.count > 0 ? 'pb-28' : 'pb-10'}`}>
        {items.length === 0 && (
          <p className="text-slate-500 text-center mt-10">No items in this category.</p>
        )}
        {items.map(item => (
          <div key={item._id} className="bg-slate-800 rounded-xl p-4 flex gap-3 items-start">

            {/* Veg / non-veg indicator */}
            <span className="mt-1 shrink-0">
              <span
                className="block w-3 h-3 rounded-full"
                style={{ backgroundColor: item.is_veg ? '#22c55e' : '#ef4444' }}
              />
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <span className="font-semibold text-sm leading-snug">{item.name}</span>
                <span className="text-orange-400 font-bold text-sm shrink-0">
                  ₹{item.price_label ?? item.price}
                </span>
              </div>
              {item.description && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
              )}
              <div className="mt-3 flex justify-end">
                <CartControl item={item} cart={cart} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart bottom bar — visible only when cart has items */}
      {cart.count > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center px-4 pb-4">
          <div className="w-full max-w-md bg-orange-500 rounded-2xl px-5 py-4 flex items-center justify-between shadow-2xl">
            <div>
              <p className="text-white font-bold text-sm">
                {cart.count} {cart.count === 1 ? 'item' : 'items'} added
              </p>
              <p className="text-orange-100 text-xs mt-0.5">
                Total &nbsp;<span className="font-bold text-white">₹{cart.total}</span>
              </p>
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              className="bg-white text-orange-500 font-bold text-sm px-5 py-2 rounded-xl active:scale-95 transition-transform"
            >
              View Cart →
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={cart.items}
        onAdd={cart.add}
        onRemove={cart.remove}
        onPlaceOrder={handlePlaceOrder}
        total={cart.total}
        count={cart.count}
        loading={ordering}
        subtitle={drawerSubtitle}
      />

      {/* AI Chat Drawer */}
      <AIChatDrawer
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        cart={cart}
      />
    </div>
  );
}
