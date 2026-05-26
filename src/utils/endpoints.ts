/**
 * All API endpoint strings in one place.
 * Never hardcode paths in service or component files.
 */

// ─── Customer ─────────────────────────────────────────────────────────────────
export const ENDPOINTS = {
  // Session
  SESSION_START:        '/api/customer/session/start',
  SESSION_CHECK:        '/api/customer/session/check',
  SESSION_REQUEST_JOIN: '/api/customer/session/request-join',
  SESSION_JOIN_STATUS:  (id: string): string => `/api/customer/session/join-status/${id}`,
  SESSION_RESPOND_JOIN: '/api/customer/session/respond-join',
  SESSION_END:          '/api/customer/session/end',
  REQUEST_BILL:    '/api/customer/bill/request',

  // Cart
  CART:            '/api/customer/cart',

  // Orders
  PLACE_ORDER:     '/api/customer/order',
  CUSTOMER_ORDERS: '/api/customer/orders',

  // AI Chat
  CHAT:            '/api/ai/chat',
  CHAT_STREAM:     '/api/ai/chat/stream',
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
  DASH_MENU:               '/api/restaurant-dash/menu',
  DASH_MENU_ITEM:          (id: string): string => `/api/restaurant-dash/menu/${id}`,
  DASH_MENU_ITEM_DELETE:   (id: string): string => `/api/restaurant-dash/menu/${id}`,
  DASH_MENU_TOGGLE:        (id: string): string => `/api/restaurant-dash/menu/${id}/toggle`,
  DASH_MENU_CHEFS_SPECIAL: (id: string): string => `/api/restaurant-dash/menu/${id}/chefs-special`,
  DASH_MENU_FEATURED:      (id: string): string => `/api/restaurant-dash/menu/${id}/featured`,
  DASH_MENU_BULK:          '/api/restaurant-dash/menu/bulk',
  DASH_MENU_IMAGE_UPLOAD:  '/api/restaurant-dash/menu/upload-image',
  DASH_CATEGORIES:         '/api/restaurant-dash/categories',
  DASH_TABLES:             '/api/restaurant-dash/tables',
  DASH_TABLES_QR_PDF:      '/api/restaurant-dash/tables/qr-pdf',
  DASH_TABLES_BULK:        '/api/restaurant-dash/tables/bulk',
  DASH_TABLE_FREE:         (id: string): string => `/api/restaurant-dash/tables/${id}/free`,
  DASH_TABLE_TOGGLE_ACTIVE:(id: string): string => `/api/restaurant-dash/tables/${id}/toggle-active`,
  DASH_TABLE_BILL_PDF:     (id: string): string => `/api/restaurant-dash/tables/${id}/bill-pdf`,
  DASH_CLOSE_SESSION:      (id: string): string => `/api/restaurant-dash/sessions/${id}/close`,
  DASH_MARK_BILL_PAID:          (id: string): string => `/api/restaurant-dash/sessions/${id}/mark-paid`,
  DASH_ORDER_COLLECT_PAYMENT:   (id: string): string => `/api/restaurant-dash/orders/${id}/collect-payment`,
  DASH_PAYMENT_METHODS:    '/api/restaurant-dash/payment-methods',
  DASH_PAYMENT_METHOD_DEL: (name: string): string => `/api/restaurant-dash/payment-methods/${encodeURIComponent(name)}`,
  DASH_INGREDIENTS:             '/api/restaurant-dash/ingredients',
  DASH_INGREDIENTS_TOGGLE:      '/api/restaurant-dash/ingredients/toggle',
  DASH_INGREDIENTS_BULK:        '/api/restaurant-dash/ingredients/bulk',
  DASH_INGREDIENTS_BULK_ADD:    '/api/restaurant-dash/ingredients/bulk-add',
  DASH_INGREDIENTS_IMPORT:      '/api/restaurant-dash/ingredients/import',
  DASH_INGREDIENT_DETAIL:       (name: string): string => `/api/restaurant-dash/ingredients/${encodeURIComponent(name)}`,
  DASH_INGREDIENT_UPDATE:       (name: string): string => `/api/restaurant-dash/ingredients/${encodeURIComponent(name)}`,
  DASH_INGREDIENT_DELETE:       (name: string): string => `/api/restaurant-dash/ingredients/${encodeURIComponent(name)}`,
  DASH_INGREDIENT_LEDGER:       (name: string): string => `/api/restaurant-dash/ingredients/${encodeURIComponent(name)}/ledger`,
  DASH_MENU_ITEM_RECIPE:        (id: string): string => `/api/restaurant-dash/menu/${id}/recipe`,
  DASH_ORDERS_MANUAL:      '/api/restaurant-dash/orders/manual',
  DASH_ORDERS_BULK_MANUAL: '/api/restaurant-dash/orders/bulk-manual',
  DASH_LOCATION:           '/api/restaurant-dash/location',

  // Customer — special sections
  CART_SUGGESTIONS:   '/api/customer/suggestions',
  MENU_TIME_BASED:    '/api/customer/menu/time-based',
  MENU_TRENDING:      '/api/customer/menu/trending',
  MENU_CHEFS_SPECIAL: '/api/customer/menu/chefs-special',
  MENU_FEATURED:      '/api/customer/menu/featured',

  // Superadmin
  SA_RESTAURANTS:  '/api/superadmin/restaurants',
  SA_TABLES:       (id: string): string => `/api/superadmin/restaurants/${id}/tables`,
  SA_MENU:         (id: string): string => `/api/superadmin/restaurants/${id}/menu`,
  SA_QR_PDF:       (id: string): string => `/api/superadmin/restaurants/${id}/qr-pdf`,
  SA_REST_ORDERS:  (id: string): string => `/api/superadmin/restaurants/${id}/orders`,
  SA_PETPOOJA:     (id: string): string => `/api/superadmin/restaurants/${id}/petpooja`,

  // Petpooja — restaurant dash
  DASH_PETPOOJA_CONFIG: '/api/petpooja/config',
};
