import { useState } from 'react';
import { cartStore } from '../../store/cartStore';
import { syncCart } from '../../services/customerService';

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

/**
 * Unified add-to-cart control used everywhere in the customer app.
 *
 * qty = 0  →  accent "Add to Cart" button
 * qty ≥ 1  →  3-cell stepper [ 🗑/− | qty | + ]
 *
 * Each interaction optimistically updates the store, then awaits syncCart.
 * Both stepper cells are disabled for the duration of the API call.
 */
export default function CartControl({ item }) {
  const [loading, setLoading] = useState(false);
  const q = cartStore((s) => s.cart[item._id]?.qty ?? 0);

  const sync = async () => {
    setLoading(true);
    try {
      await syncCart(Object.values(cartStore.getState().cart));
    } catch {
      // silently fail — CustomerLayout's useEffect will retry
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (loading) return;
    cartStore.getState().add(item);
    await sync();
  };

  const handleRemove = async () => {
    if (loading) return;
    cartStore.getState().remove(item);
    await sync();
  };

  const inCart = q > 0;

  return (
    <div className="relative inline-flex items-center" style={{ height: '36px', minWidth: '108px' }}>

      {/* ── Add button (qty = 0) ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleAdd}
        aria-label="Add to cart"
        className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-xl font-bold text-white text-xs tracking-wide transition-all duration-200 ease-out cursor-pointer active:scale-95"
        style={{
          background: 'var(--t-accent)',
          boxShadow: '0 4px 14px var(--t-accent-40)',
          opacity: inCart ? 0 : 1,
          transform: inCart ? 'scale(0.92)' : 'scale(1)',
          pointerEvents: inCart ? 'none' : 'auto',
          paddingLeft: '14px',
          paddingRight: '14px',
          whiteSpace: 'nowrap',
          minWidth: '96px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 900, lineHeight: 1 }}>+</span>
        <span>
          Add<span className="hidden lg:inline"> to Cart</span>
        </span>
      </button>

      {/* ── Stepper (qty ≥ 1) ────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 flex items-stretch rounded-xl overflow-hidden transition-all duration-200 ease-out"
        style={{
          border: '1.5px solid var(--t-accent-40)',
          background: 'var(--t-accent-10)',
          opacity: inCart ? 1 : 0,
          transform: inCart ? 'scale(1)' : 'scale(0.92)',
          pointerEvents: inCart ? 'auto' : 'none',
          minWidth: '108px',
        }}
      >
        {/* Remove / Trash */}
        <button
          type="button"
          onClick={handleRemove}
          disabled={loading}
          aria-label={q === 1 ? 'Remove from cart' : 'Decrease quantity'}
          className="flex items-center justify-center transition-all cursor-pointer"
          style={{
            width: '36px',
            color: 'var(--t-accent)',
            opacity: loading ? 0.35 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = 'var(--t-accent-20)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {q === 1 ? (
            <TrashIcon />
          ) : (
            <span style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1 }}>−</span>
          )}
        </button>

        {/* Qty */}
        <div
          className="flex items-center justify-center flex-1"
          style={{
            borderLeft: '1px solid var(--t-accent-40)',
            borderRight: '1px solid var(--t-accent-40)',
            minWidth: '36px',
          }}
        >
          {loading ? (
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: 'var(--t-accent)' }}
            />
          ) : (
            <span
              className="font-black text-xs tabular-nums select-none"
              style={{ color: '#ffffff' }}
            >
              {q}
            </span>
          )}
        </div>

        {/* Add */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={loading}
          aria-label="Increase quantity"
          className="flex items-center justify-center transition-all cursor-pointer"
          style={{
            width: '36px',
            color: 'var(--t-accent)',
            opacity: loading ? 0.35 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = 'var(--t-accent-20)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1 }}>+</span>
        </button>
      </div>

    </div>
  );
}
