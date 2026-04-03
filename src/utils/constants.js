/**
 * Application-wide constants.
 * Single source of truth for magic strings and values.
 */

// ─── LocalStorage Keys ────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  SESSION_TOKEN:     'dynamu_session_token',
  CART_PREFIX:       'dynamu_cart_', // append restaurantId
  SIDEBAR_STATE:     'dynamu_sidebar_state',
};

// ─── App Meta ─────────────────────────────────────────────────────────────────
export const APP_NAME        = 'Dynamu';
export const APP_TAGLINE     = 'Smart Restaurant Management';

// ─── Menu ─────────────────────────────────────────────────────────────────────
export const QUICK_CHAT_CHIPS = [
  { label: 'Spicy 🌶️',           text: 'Show me spicy dishes' },
  { label: "Chef's Special ⭐",   text: "What's the chef's special here?" },
  { label: 'Under ₹300 💰',       text: 'Recommend something under ₹300' },
  { label: 'Vegetarian 🥗',       text: 'Show me vegetarian options' },
  { label: 'Bestsellers 🔥',      text: 'What are your bestsellers?' },
  { label: 'Light meal 🍃',       text: 'Suggest something light' },
  { label: 'Budget ₹500 💸',      text: 'What can I get under ₹500?' },
];

// ─── Theme System ─────────────────────────────────────────────────────────────
// Backend sends restaurant.branding.theme as a number 1–4.
// Full theme definitions live in src/theme/tokens.js.
// This constant is the fallback when no theme is provided.
export const DEFAULT_THEME_NUMBER = 1;
