import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Compute the cart key for an item.
 * Variant items use a composite key so the same dish with different variants
 * are stored as separate cart entries.
 */
export function cartKey(item) {
  if (item?.selectedVariant?.name) {
    return `${item._id}__${item.selectedVariant.name}`;
  }
  return item._id;
}

/**
 * Persist { cartKey: selectedVariant } for all variant entries to sessionStorage.
 * Called after every add/remove so page refreshes can restore variant info.
 */
export function saveVariantCache(cart) {
  const cache = {};
  Object.entries(cart).forEach(([key, item]) => {
    if (item.selectedVariant) cache[key] = item.selectedVariant;
  });
  try { sessionStorage.setItem('dynamu_variant_cache', JSON.stringify(cache)); } catch { /* ignore */ }
}

/** Load the persisted variant cache from sessionStorage. */
export function loadVariantCache() {
  try { return JSON.parse(sessionStorage.getItem('dynamu_variant_cache') || '{}'); } catch { return {}; }
}

/**
 * In-memory cart store — NOT persisted to localStorage.
 * Source of truth is the server; this is a local mirror for fast UI updates.
 * Keyed by cartKey(item) to support variant items.
 */
export const cartStore = create(
  devtools(
    (set, get) => ({
      cart: {},

      add: (item) => {
        const key = cartKey(item);
        set((state) => {
          const newCart = {
            ...state.cart,
            [key]: {
              ...item,
              _cartKey: key,
              qty: (state.cart[key]?.qty ?? 0) + 1,
            },
          };
          saveVariantCache(newCart);
          return { cart: newCart };
        });
      },

      remove: (item) => {
        const key = cartKey(item);
        set((state) => {
          const qty = (state.cart[key]?.qty ?? 0) - 1;
          let newCart;
          if (qty <= 0) {
            const { [key]: _, ...rest } = state.cart;
            newCart = rest;
          } else {
            newCart = { ...state.cart, [key]: { ...state.cart[key], qty } };
          }
          saveVariantCache(newCart);
          return { cart: newCart };
        });
      },

      clear: () => set(() => ({ cart: {} })),

      setCart: (cart) => set(() => ({ cart })),

      setInstruction: (key, instruction) =>
        set((state) => {
          if (!state.cart[key]) return state;
          return {
            cart: {
              ...state.cart,
              [key]: {
                ...state.cart[key],
                instruction,
              },
            },
          };
        }),

      // Accepts either a plain id string (backward compat) or a full item object
      getQty: (itemOrId) => {
        const key = typeof itemOrId === 'string' ? itemOrId : cartKey(itemOrId);
        return get().cart[key]?.qty ?? 0;
      },
    }),
    { name: 'CartStore' }
  )
);

// Custom hooks for derived data (ensures React reactivity)
export const useCartItems = () => {
  const cartMap = cartStore((state) => state.cart);
  return Object.values(cartMap);
};
export const useCartCount = () => {
  const cartMap = cartStore((state) => state.cart);
  return Object.values(cartMap).reduce((sum, item) => sum + item.qty, 0);
};
export const useCartTotal = () => {
  const cartMap = cartStore((state) => state.cart);
  return Object.values(cartMap).reduce((sum, item) => {
    // selectedVariant.price is already the effective (post-discount) price —
    // baked in by VariantDrawer.handleAdd via variantEffectivePrice().
    // For non-variant items, apply item-level discount to base price.
    const basePrice = item.selectedVariant?.price ?? item.price;
    const disc = item.selectedVariant
      ? 0  // already discounted
      : (item.discount_percentage ?? 0);
    const effectivePrice = disc > 0 ? basePrice * (1 - disc / 100) : basePrice;
    return sum + effectivePrice * item.qty;
  }, 0);
};
