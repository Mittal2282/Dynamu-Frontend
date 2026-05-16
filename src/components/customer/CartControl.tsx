import { useState } from "react";
import { syncCart } from "../../services/customerService";
import { cartStore, cartKey } from "../../store/cartStore";
import type { MenuItem } from "../../types/menu";
import type { Variant } from "../../types/menu";

interface CartControlProps {
  item: MenuItem;
  selectedVariant?: Variant & { groupName?: string };
  showDelete?: boolean;
}

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
 * Global syncing lock: while any cart API call is in flight, every CartControl
 * instance disables its buttons so simultaneous calls can't race each other.
 *
 * Delete (qty → 0) is pessimistic: the item stays in the UI until the API
 * confirms removal. Add / decrement (qty > 1) stay optimistic for fast UX.
 */
export default function CartControl({ item, selectedVariant, showDelete = false }: CartControlProps) {
  // Local flag drives the loading indicator on THIS instance's qty cell.
  const [loading, setLoading] = useState(false);

  // Global flag disables ALL CartControl buttons during any in-flight sync.
  const syncing = cartStore((s) => s.syncing);

  const itemWithVariant = selectedVariant ? { ...item, selectedVariant } : item;
  const key = cartKey(itemWithVariant);
  const q = cartStore((s) => s.cart[key]?.qty ?? 0);
  const isDisabled = syncing;

  const beginSync = () => {
    setLoading(true);
    cartStore.getState().setSyncing(true);
  };

  const endSync = () => {
    setLoading(false);
    cartStore.getState().setSyncing(false);
  };

  const handleAdd = async () => {
    if (isDisabled) return;
    // Optimistic: update store first, then sync
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cartStore.getState().add(itemWithVariant as any);
    beginSync();
    try {
      await syncCart(Object.values(cartStore.getState().cart));
    } catch { /* silently fail */ }
    finally { endSync(); }
  };

  const handleRemove = async () => {
    if (isDisabled) return;

    if (q === 1) {
      // Pessimistic delete: don't touch the store until the API confirms
      const pendingEntries = Object.values(cartStore.getState().cart).filter(
        (e) => cartKey(e) !== key,
      );
      beginSync();
      try {
        await syncCart(pendingEntries);
        cartStore.getState().remove(itemWithVariant); // only remove after success
      } catch { /* keep item if API fails */ }
      finally { endSync(); }
    } else {
      // Optimistic decrement for qty > 1
      cartStore.getState().remove(itemWithVariant);
      beginSync();
      try {
        await syncCart(Object.values(cartStore.getState().cart));
      } catch { /* silently fail */ }
      finally { endSync(); }
    }
  };

  const inCart = q > 0;

  return (
    <div
      className="relative inline-flex items-center"
      style={{ height: "36px", minWidth: "108px" }}
    >
      {/* ── Add button (qty = 0) ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={isDisabled}
        aria-label="Add to cart"
        className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-xl font-bold text-white text-xs tracking-wide transition-all duration-200 ease-out active:scale-95"
        style={{
          background: "var(--t-accent)",
          boxShadow: inCart || isDisabled ? "none" : "0 4px 14px var(--t-accent-40)",
          opacity: inCart ? 0 : isDisabled ? 0.4 : 1,
          transform: inCart ? "scale(0.92)" : "scale(1)",
          pointerEvents: inCart ? "none" : "auto",
          cursor: isDisabled ? "not-allowed" : "pointer",
          paddingLeft: "14px",
          paddingRight: "14px",
          whiteSpace: "nowrap",
          minWidth: "96px",
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: 900, lineHeight: 1 }}>+</span>
        <span>
          Add<span className="hidden lg:inline"> to Cart</span>
        </span>
      </button>

      {/* ── Stepper (qty ≥ 1) ────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 flex items-stretch rounded-xl overflow-hidden transition-all duration-200 ease-out"
        style={{
          border: "1.5px solid var(--t-accent-40)",
          background: "var(--t-accent-10)",
          opacity: inCart ? 1 : 0,
          transform: inCart ? "scale(1)" : "scale(0.92)",
          pointerEvents: inCart ? "auto" : "none",
          minWidth: "108px",
        }}
      >
        {/* Remove / Trash */}
        <button
          type="button"
          onClick={handleRemove}
          disabled={isDisabled}
          aria-label={q === 1 ? "Remove from cart" : "Decrease quantity"}
          className="flex items-center justify-center transition-all"
          style={{
            width: "36px",
            color: "var(--t-accent)",
            opacity: isDisabled ? 0.35 : 1,
            cursor: isDisabled ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!isDisabled) e.currentTarget.style.background = "var(--t-accent-20)";
          }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          {loading && q === 1 ? (
            <span
              className="w-3.5 h-3.5 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--t-accent-40)", borderTopColor: "var(--t-accent)" }}
            />
          ) : q === 1 && showDelete ? (
            <TrashIcon />
          ) : (
            <span style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1 }}>−</span>
          )}
        </button>

        {/* Qty */}
        <div
          className="flex items-center justify-center flex-1"
          style={{
            borderLeft: "1px solid var(--t-accent-40)",
            borderRight: "1px solid var(--t-accent-40)",
            minWidth: "36px",
          }}
        >
          {loading && q > 1 ? (
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "var(--t-accent)" }}
            />
          ) : (
            <span
              className="font-black text-xs tabular-nums select-none"
              style={{ color: "var(--t-accent)" }}
            >
              {q}
            </span>
          )}
        </div>

        {/* Add */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={isDisabled}
          aria-label="Increase quantity"
          className="flex items-center justify-center transition-all"
          style={{
            width: "36px",
            color: "var(--t-accent)",
            opacity: isDisabled ? 0.35 : 1,
            cursor: isDisabled ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!isDisabled) e.currentTarget.style.background = "var(--t-accent-20)";
          }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1 }}>+</span>
        </button>
      </div>
    </div>
  );
}
