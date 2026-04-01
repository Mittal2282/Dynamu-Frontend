import { useOutletContext } from 'react-router-dom';
import CartControl from '../../components/customer/CartControl';
import Text from '../../components/ui/Text';
import { restaurantStore } from '../../store/restaurantStore';
import { formatCurrency } from '../../utils/formatters';
import { useCartCount } from '../../store/cartStore';

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

export default function CustomerHomePage() {
  const { featuredItems, chefsSpecials, trendingItems } = useOutletContext();
  const { currencySymbol } = restaurantStore();
  const count = useCartCount();

  const hasContent = featuredItems.length > 0 || chefsSpecials.length > 0 || trendingItems.length > 0;

  return (
    <div className={`flex-1 py-2 ${count > 0 ? 'pb-40' : 'pb-24'}`}>
      <MenuCardStrip title="Featured ⭐" items={featuredItems} currencySymbol={currencySymbol} />
      <MenuCardStrip title="Chef's Special 👨‍🍳" items={chefsSpecials} currencySymbol={currencySymbol} />
      <MenuCardStrip title="Trending This Week 🔥" items={trendingItems} currencySymbol={currencySymbol} />
      {!hasContent && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
          <span className="text-4xl">🍽️</span>
          <Text color="muted" size="sm">Highlights will appear here soon.</Text>
        </div>
      )}
    </div>
  );
}
