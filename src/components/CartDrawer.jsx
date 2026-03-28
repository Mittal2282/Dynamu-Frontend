import { restaurantStore } from '../store/restaurantStore';
import { VegBadge } from './ui/Badge';
import { Spinner } from './ui/Spinner';
import Button from './ui/Button';
import Text from './ui/Text';
import Drawer from './ui/Drawer';
import { formatCurrency } from '../utils/formatters';

/**
 * CartDrawer — polished bottom-sheet cart.
 *
 * Props: isOpen, onClose, items, onAdd, onRemove, onPlaceOrder, total, count, loading, subtitle
 */
export default function CartDrawer({
  isOpen,
  onClose,
  items       = [],
  onAdd,
  onRemove,
  onPlaceOrder,
  total       = 0,
  count       = 0,
  loading     = false,
  subtitle    = '',
}) {
  const { currencySymbol } = restaurantStore();

  return (
    <Drawer isOpen={isOpen} onClose={onClose} maxHeight="82vh">
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
        <div>
          <Text as="h2" size="lg" weight="bold">Your Cart</Text>
          {subtitle && <Text size="xs" color="muted" className="mt-0.5">{subtitle}</Text>}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-3xl leading-none w-8 h-8 flex items-center justify-center transition-colors"
          aria-label="Close cart"
        >
          &times;
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <span className="text-4xl">🛒</span>
            <Text color="muted" size="sm">Your cart is empty</Text>
          </div>
        ) : (
          items.map((item) => {
            const id = item._id ?? item.id;
            return (
              <div key={id} className="flex items-center gap-3 bg-slate-800/80 border border-white/5 rounded-xl p-3">
                <VegBadge isVeg={item.is_veg} size="sm" />

                <div className="flex-1 min-w-0">
                  <Text size="sm" weight="semibold" className="leading-snug truncate">{item.name}</Text>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatCurrency(item.price, currencySymbol)} &times; {item.qty}
                    {' = '}
                    <Text as="span" size="xs" weight="bold" color="brand">
                      {formatCurrency(item.price * item.qty, currencySymbol)}
                    </Text>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onRemove(item)}
                    className="w-7 h-7 rounded-full bg-[var(--color-brand-primary)] text-white font-bold flex items-center justify-center active:scale-95 transition-transform"
                    aria-label={`Remove one ${item.name}`}
                  >
                    −
                  </button>
                  <Text as="span" size="sm" weight="bold" className="w-4 text-center">{item.qty}</Text>
                  <button
                    onClick={() => onAdd(item)}
                    className="w-7 h-7 rounded-full bg-[var(--color-brand-primary)] text-white font-bold flex items-center justify-center active:scale-95 transition-transform"
                    aria-label={`Add one ${item.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="px-5 pb-8 pt-3 border-t border-white/10 space-y-3 shrink-0">
          <div className="flex justify-between items-center">
            <Text size="sm" color="secondary">{count} {count === 1 ? 'item' : 'items'}</Text>
            <Text size="xl" weight="bold">{formatCurrency(total, currencySymbol)}</Text>
          </div>
          <Button
            fullWidth
            size="lg"
            loading={loading}
            onClick={onPlaceOrder}
            className="shadow-xl shadow-brand-primary-40"
          >
            Place Order Now 🍽️
          </Button>
        </div>
      )}
    </Drawer>
  );
}
