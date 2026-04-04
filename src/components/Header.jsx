import { CountBadge } from '../components/ui/Badge';
import Text from '../components/ui/Text';
import { useCartCount } from '../store/cartStore';
import { restaurantStore } from '../store/restaurantStore';

function IconCutlery({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="3" y1="2" x2="3" y2="22" />
      <path d="M7 2v8a4 4 0 0 1-4 4" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <path d="M21 2l-1 10a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2L15 2" />
      <line x1="18" y1="14" x2="18" y2="22" />
    </svg>
  );
}

function IconCartBag({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

/**
 * @param {{ onCartClick: () => void, variant?: 'legacy' | 'customer' }} props
 */
export default function Header({ onCartClick, variant = 'legacy' }) {
  const { name, tagline } = restaurantStore();
  const count = useCartCount();

  if (variant === 'customer') {
    const title = name || 'Restaurant';
    return (
      <header
        className="px-5 py-3.5 sticky top-0 z-30 border-b border-white/[0.08]"
        style={{ backgroundColor: 'color-mix(in srgb, var(--t-bg) 96%, black)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <IconCutlery className="w-7 h-7 shrink-0" style={{ color: 'var(--t-accent)' }} />
            <h1
              className="text-[15px] font-bold uppercase tracking-[0.12em] leading-tight truncate"
              style={{ color: 'var(--t-accent)' }}
            >
              {title}
            </h1>
          </div>
          <button
            type="button"
            onClick={onCartClick}
            className="relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            style={{
              background: 'color-mix(in srgb, var(--t-bg) 70%, white 8%)',
              border: '1px solid color-mix(in srgb, white 12%, var(--t-bg))',
            }}
            aria-label={`Cart${count > 0 ? ` — ${count} items` : ''}`}
          >
            <IconCartBag className="w-5 h-5" style={{ color: 'var(--t-accent)' }} />
            <CountBadge count={count} showZero />
          </button>
        </div>
      </header>
    );
  }

  const title = name || 'Dynamu Smart Menu';
  const sub = tagline || 'Table 05 • Royal Cafe';

  return (
    <header className="px-5 py-4 flex justify-between items-center bg-white/5 backdrop-blur-md border-b border-white/10">
      <div>
        <Text
          as="h1"
          size="lg"
          weight="bold"
          className="bg-gradient-to-r from-brand to-orange-400 bg-clip-text text-transparent"
        >
          {title}
        </Text>
        <Text size="xs" color="muted" className="mt-0.5">{sub}</Text>
      </div>

      <button
        type="button"
        onClick={onCartClick}
        className="relative cursor-pointer active:scale-90 transition-transform"
        aria-label={`View cart${count > 0 ? ` — ${count} items` : ''}`}
      >
        <span className="text-2xl">🛒</span>
        <CountBadge count={count} />
      </button>
    </header>
  );
}
