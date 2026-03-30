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

// ─── Theme Palettes ───────────────────────────────────────────────────────────
export const THEMES = {
  CYBERPLATE_NOIR: {
    primary:   '#FF6B00',
    secondary: '#00F0FF',
    tertiary:  '#7000FF',
    neutral:   '#0B0E14',
  },
  OBSIDIAN_GILT: {
    primary:   '#D4AF37',
    secondary: '#FDF9F4',
    tertiary:  '#C5A028',
    neutral:   '#1A1A1A',
  },
  EXECUTIVE_MAITRE_D: {
    primary:   '#3B82F6',
    secondary: '#1E293B',
    tertiary:  '#231500',
    neutral:   '#0F172A',
  },
};

// Default (CyberPlate Noir)
export const DEFAULT_BRAND = {
  primaryColor:   THEMES.CYBERPLATE_NOIR.primary,
  secondaryColor: THEMES.CYBERPLATE_NOIR.secondary,
  tertiaryColor:  THEMES.CYBERPLATE_NOIR.tertiary,
  neutralColor:   THEMES.CYBERPLATE_NOIR.neutral,
};
