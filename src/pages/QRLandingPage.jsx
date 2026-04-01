import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import AIChatDrawer from '../components/AIChatDrawer';
import BottomNavigator from '../components/BottomNavigator';
import CartDrawer from '../components/CartDrawer';
import { CountBadge, VegBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import Text from '../components/ui/Text';
import useTheme from '../hooks/useTheme';
import { getCart, placeOrder, startSession, syncCart, getCustomerOrders, getTrendingItems, getChefsSpecials, getFeaturedItems } from '../services/customerService';
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
  const { tableNumber: storedTable } = restaurantStore();

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

  // All orders belong to this session — group into one card: original first, add-ons below
  const original = orders.find(o => !o.is_addon);
  const addons = orders.filter(o => o.is_addon);
  const grandTotal = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const OrderBatch = ({ order, label }) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Text size="xs" color="muted">
          {label} · #{order.order_number} · {formatTime(order.createdAt)}
        </Text>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${ORDER_STATUS_BADGE[order.status] ?? 'bg-white/10 text-slate-300'}`}>
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
    </div>
  );

  return (
    <div className="px-4 py-4">
      <div className="bg-slate-800/80 border border-white/5 rounded-xl p-4 space-y-3">
        {/* Card header */}
        <div className="flex items-center justify-between">
          <Text size="sm" weight="bold">Your Order</Text>
          {storedTable && <Text size="xs" color="muted">Table {storedTable}</Text>}
        </div>

        {/* Original order */}
        {original && <OrderBatch order={original} label="Order" />}

        {/* Add-on orders */}
        {addons.map((addon, idx) => (
          <div key={addon._id} className="pt-2 border-t border-white/10">
            <OrderBatch order={addon} label={`Add-on${addons.length > 1 ? ` ${idx + 1}` : ''}`} />
          </div>
        ))}

        {/* Grand total */}
        <div className="pt-2 border-t border-white/10 flex justify-between">
          <Text size="xs" color="muted">Total</Text>
          <Text size="sm" weight="bold" color="brand">
            {formatCurrency(grandTotal, currencySymbol)}
          </Text>
        </div>
      </div>

      <Text size="xs" color="muted" className="text-center py-2">
        Status updates automatically every 15s
      </Text>
    </div>
  );
}

/* ─── Special section horizontal card strip ─────────────────────────────────── */
function MenuCardStrip({ title, items, currencySymbol }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="px-4 pt-4 pb-1">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">{title}</p>
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {items.map(item => (
          <div
            key={item._id}
            className="w-36 shrink-0 bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col gap-2"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: item.is_veg ? '#22c55e' : '#ef4444' }}
              />
              <Text as="p" size="xs" color="muted" className="truncate">{item.category || ''}</Text>
            </div>
            <Text as="p" size="sm" weight="semibold" color="white" className="line-clamp-2 leading-snug flex-1">
              {item.name}
            </Text>
            <Text as="p" size="sm" weight="bold" color="brand">
              {formatCurrency(item.price, currencySymbol)}
            </Text>
            <div className="flex justify-center">
              <CartControl item={item} />
            </div>
          </div>
        ))}
      </div>
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
  // 'home' | 'menu' | 'orders'
  const [activeTab, setActiveTab] = useState('home');

  // Special menu sections
  const [trendingItems, setTrendingItems]   = useState([]);
  const [chefsSpecials, setChefsSpecials]   = useState([]);
  const [featuredItems, setFeaturedItems]   = useState([]);

  // ── Search & filter state ────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [vegFilter, setVegFilter]     = useState(null); // null | true | false
  const [priceMin, setPriceMin]       = useState('');
  const [priceMax, setPriceMax]       = useState('');

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

  // ── Search / filter computed values (must be before any early return) ────────
  const allMenuItems = useMemo(() => Object.values(menu).flat(), [menu]);

  const activeFilterCount = (vegFilter !== null ? 1 : 0) + (priceMin !== '' || priceMax !== '' ? 1 : 0);
  const isSearchActive = searchQuery.trim() !== '' || activeFilterCount > 0;

  const filteredItems = useMemo(() => {
    if (!isSearchActive) return [];
    const q = searchQuery.trim().toLowerCase();
    return allMenuItems
      .map(item => {
        if (vegFilter !== null && item.is_veg !== vegFilter) return null;
        if (priceMin !== '' && item.price < parseFloat(priceMin)) return null;
        if (priceMax !== '' && item.price > parseFloat(priceMax)) return null;
        if (!q) return { ...item, _score: 0 };
        const iName = (item.name || '').toLowerCase();
        const iDesc = (item.description || '').toLowerCase();
        const iCat  = (item.category || '').toLowerCase();
        if (iName === q)          return { ...item, _score: 100 };
        if (iName.startsWith(q))  return { ...item, _score: 80 };
        if (iName.includes(q))    return { ...item, _score: 60 };
        if (iCat.includes(q))     return { ...item, _score: 40 };
        if (iDesc.includes(q))    return { ...item, _score: 20 };
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b._score - a._score);
  }, [allMenuItems, isSearchActive, searchQuery, vegFilter, priceMin, priceMax]);

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

        {/* Home / Menu / Orders tabs */}
        <div className="flex mt-3 border-b border-white/10">
          {[
            { key: 'home',   label: 'Home' },
            { key: 'menu',   label: 'Menu' },
            { key: 'orders', label: 'My Orders' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'text-orange-400 border-b-2 border-orange-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search bar + filter button (only on menu tab) */}
        {activeTab === 'menu' && (
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search dishes…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-xl pl-8 pr-8 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`relative shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                  : 'bg-white/10 border-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              Filter
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-white text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Category strip — menu tab only, hidden when search is active */}
        {activeTab === 'menu' && !isSearchActive && (
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
      ) : activeTab === 'home' ? (
        /* ── Home tab ── */
        <div className={`flex-1 ${count > 0 ? 'pb-40' : 'pb-24'} py-2`}>
          <MenuCardStrip title="Featured ⭐" items={featuredItems} currencySymbol={currencySymbol} />
          <MenuCardStrip title="Chef's Special 👨‍🍳" items={chefsSpecials} currencySymbol={currencySymbol} />
          <MenuCardStrip title="Trending This Week 🔥" items={trendingItems} currencySymbol={currencySymbol} />
          {featuredItems.length === 0 && chefsSpecials.length === 0 && trendingItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
              <span className="text-4xl">🍽️</span>
              <Text color="muted" size="sm">Highlights will appear here soon.</Text>
            </div>
          )}
        </div>
      ) : (
        /* ── Menu tab ── */
        <div className={`flex-1 ${count > 0 ? 'pb-40' : 'pb-24'}`}>

          {/* Filter panel */}
          {showFilters && (
            <div className="px-4 pt-3 pb-2 bg-slate-900/80 border-b border-white/5 space-y-3">
              {/* Veg filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-14 shrink-0">Diet</span>
                {[
                  { label: 'All',     value: null },
                  { label: '🟢 Veg',  value: true },
                  { label: '🔴 Non-Veg', value: false },
                ].map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setVegFilter(vegFilter === opt.value ? null : opt.value)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                      vegFilter === opt.value
                        ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Price range */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-14 shrink-0">Price</span>
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                  className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/60"
                />
                <span className="text-slate-600 text-xs">–</span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                  className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/60"
                />
                {(priceMin !== '' || priceMax !== '') && (
                  <button
                    onClick={() => { setPriceMin(''); setPriceMax(''); }}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="px-4 py-4 space-y-3">
            {isSearchActive ? (
              /* ── Search / filter results ── */
              filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center gap-2">
                  <span className="text-3xl">🔍</span>
                  <Text color="muted" size="sm">No items match your search.</Text>
                  <button
                    onClick={() => { setSearchQuery(''); setVegFilter(null); setPriceMin(''); setPriceMax(''); }}
                    className="text-xs text-orange-400 hover:text-orange-300 mt-1"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <>
                  <Text size="xs" color="muted">{filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}</Text>
                  {filteredItems.map(item => (
                    <div key={item._id} className="bg-slate-800/80 rounded-xl p-4 flex gap-3 items-start border border-white/5">
                      <VegBadge isVeg={item.is_veg} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <Text as="span" size="sm" weight="semibold" className="leading-snug">{item.name}</Text>
                            {item.category && (
                              <Text size="xs" color="muted" className="mt-0.5">{item.category}</Text>
                            )}
                          </div>
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
                </>
              )
            ) : (
              /* ── Normal category view ── */
              <>
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
              </>
            )}
          </div>
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
