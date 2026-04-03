import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import CartControl from '../../components/customer/CartControl';
import { VegBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Text from '../../components/ui/Text';
import LazyImage from '../../components/ui/LazyImage';
import { useCartCount } from '../../store/cartStore';
import { restaurantStore } from '../../store/restaurantStore';
import { formatCurrency } from '../../utils/formatters';

export default function CustomerMenuPage() {
  const menuFromStore = restaurantStore((s) => s.menu);
  const { menu: menuFromOutlet } = useOutletContext() || {};
  const menu =
    menuFromStore && Object.keys(menuFromStore).length > 0 ? menuFromStore : (menuFromOutlet ?? {});
  const { currencySymbol } = restaurantStore();
  const count = useCartCount();

  const categories = Object.keys(menu);
  const [selected, setSelected] = useState(() => categories[0] ?? null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [vegFilter, setVegFilter]     = useState(null);
  const [priceMin, setPriceMin]       = useState('');
  const [priceMax, setPriceMax]       = useState('');

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

  const menuItems = selected ? (menu[selected] ?? []) : [];

  return (
    <div className={`flex-1 flex flex-col ${count > 0 ? 'pb-40' : 'pb-24'}`}>

      {/* Search bar + filter */}
      <div className="px-4 pt-3 pb-0 bg-slate-900/80 border-b border-white/5">
        <div className="flex items-center gap-2">
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

        {/* Category strip — hidden during search */}
        {!isSearchActive && (
          <div className="flex gap-2 overflow-x-auto mt-3 pb-2 no-scrollbar">
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

      {/* Filter panel */}
      {showFilters && (
        <div className="px-4 pt-3 pb-2 bg-slate-900/80 border-b border-white/5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-14 shrink-0">Diet</span>
            {[
              { label: 'All',        value: null },
              { label: '🟢 Veg',     value: true },
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

      {/* Items */}
      <div className="px-4 py-4 space-y-3">
        {isSearchActive ? (
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
              {filteredItems.map(item => <MenuItemCard key={item._id} item={item} currencySymbol={currencySymbol} />)}
            </>
          )
        ) : (
          <>
            {menuItems.length === 0 && (
              <Text color="muted" className="text-center mt-10">No items in this category.</Text>
            )}
            {menuItems.map(item => <MenuItemCard key={item._id} item={item} currencySymbol={currencySymbol} />)}
          </>
        )}
      </div>
    </div>
  );
}

function MenuItemCard({ item, currencySymbol }) {
  return (
    <div className="bg-slate-800/80 rounded-xl p-4 flex gap-3 items-start border border-white/5">
      <VegBadge isVeg={item.is_veg} className="mt-1" />
      <LazyImage
        src={item.image_url}
        alt={item.name}
        containerClassName="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0"
        placeholder={
          <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-slate-400 px-1 text-center">
              No image available
            </span>
          </div>
        }
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <Text as="span" size="sm" weight="semibold" className="leading-snug">{item.name}</Text>
            {item.category && (
              <Text size="xs" color="muted" className="mt-0.5">{item.category}</Text>
            )}
          </div>
          {item.discount_percentage > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
              <span className="line-through text-slate-500 text-xs">
                {formatCurrency(item.price, currencySymbol)}
              </span>
              <span className="font-bold text-brand text-sm">
                {formatCurrency(item.price * (1 - item.discount_percentage / 100), currencySymbol)}
              </span>
              <span className="text-[10px] font-semibold bg-green-500/15 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full">
                {item.discount_percentage}% OFF
              </span>
            </div>
          ) : (
            <Text as="span" size="sm" weight="bold" color="brand" className="shrink-0">
              {formatCurrency(item.price_label ?? item.price, currencySymbol)}
            </Text>
          )}
        </div>
        {item.description && (
          <Text size="xs" color="muted" className="mt-1 line-clamp-2">{item.description}</Text>
        )}
        <div className="mt-3 flex justify-end">
          <CartControl item={item} />
        </div>
      </div>
    </div>
  );
}
