import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * In-memory cart store — NOT persisted to localStorage.
 * Source of truth is the server; this is a local mirror for fast UI updates.
 * Keyed by item._id to avoid duplicates.
 */
export const cartStore = create(
  devtools(
    (set, get) => ({
      cart: {},

      add: (item) =>
        set((state) => ({
          cart: {
            ...state.cart,
            [item._id]: {
              ...item,
              qty: (state.cart[item._id]?.qty ?? 0) + 1,
            },
          },
        })),

      remove: (item) =>
        set((state) => {
          const qty = (state.cart[item._id]?.qty ?? 0) - 1;
          if (qty <= 0) {
            const { [item._id]: _, ...rest } = state.cart;
            return { cart: rest };
          }
          return {
            cart: {
              ...state.cart,
              [item._id]: { ...state.cart[item._id], qty },
            },
          };
        }),

      clear: () => set(() => ({ cart: {} })),

      setCart: (cart) => set(() => ({ cart })),

      getQty: (id) => get().cart[id]?.qty ?? 0,
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
  return Object.values(cartMap).reduce((sum, item) => sum + (item.price * item.qty), 0);
};
