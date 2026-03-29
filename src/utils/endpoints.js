/**
 * All API endpoint strings in one place.
 * Never hardcode paths in service or component files.
 */

// ─── Customer ─────────────────────────────────────────────────────────────────
export const ENDPOINTS = {
  // Session
  SESSION_START:   '/api/customer/session/start',

  // Cart
  CART:            '/api/customer/cart',

  // Orders
  PLACE_ORDER:     '/api/customer/order',
  CUSTOMER_ORDERS: '/api/customer/orders',

  // AI Chat
  CHAT:            '/api/ai/chat',
  CHAT_HISTORY:    '/api/ai/chat/history',
  CHAT_WELCOME:    '/api/ai/chat/welcome',

  // Admin – Auth
  ADMIN_LOGIN:     '/api/auth/login',
  ADMIN_LOGOUT:    '/api/auth/logout',
  ADMIN_REFRESH:   '/api/auth/refresh',

  // Admin – Restaurant dashboard
  DASH_PROFILE:    '/api/restaurant-dash/profile',
  DASH_ORDERS:     '/api/restaurant-dash/orders',
  DASH_STATS:      '/api/restaurant-dash/stats',
  DASH_MENU:         '/api/restaurant-dash/menu',
  DASH_MENU_ITEM:    (id) => `/api/restaurant-dash/menu/${id}`,
  DASH_MENU_TOGGLE:  (id) => `/api/restaurant-dash/menu/${id}/toggle`,
  DASH_CLOSE_SESSION:(id) => `/api/restaurant-dash/sessions/${id}/close`,

  // Superadmin
  SA_RESTAURANTS:  '/api/superadmin/restaurants',
  SA_TABLES:       (id) => `/api/superadmin/restaurants/${id}/tables`,
  SA_MENU:         (id) => `/api/superadmin/restaurants/${id}/menu`,
  SA_QR_PDF:       (id) => `/api/superadmin/restaurants/${id}/qr-pdf`,
  SA_REST_ORDERS:  (id) => `/api/superadmin/restaurants/${id}/orders`,
};
