/**
 * Centralized query / cache key constants.
 * Keep in sync with endpoints.js.
 */
export const QUERY_KEYS = {
  CART:          'cart',
  CHAT_HISTORY:  'chatHistory',
  ORDERS:        'orders',
  STATS:         'stats',
  DASH_PROFILE:  'dashProfile',
  RESTAURANTS:   'restaurants',
  REST_ORDERS:   'restaurantOrders',
} as const;

export type QueryKey = typeof QUERY_KEYS[keyof typeof QUERY_KEYS];
