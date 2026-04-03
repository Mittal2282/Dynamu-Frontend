import { useEffect } from 'react';
import { restaurantStore } from '../store/restaurantStore';
import { buildCssTokens, applyCssTokens, DEFAULT_THEME_NUMBER } from '../theme/tokens';

/**
 * useTheme — resolves the active restaurant theme by number and applies it as
 * CSS custom properties on :root.
 *
 * Mount once at the top level of the customer-facing app (CustomerLayout).
 * Whenever `themeNumber` changes in the store, the CSS variables are swapped
 * instantly without a page reload.
 *
 * Theme numbers 1–4 map to the palettes defined in src/theme/tokens.js.
 * Any missing / invalid value falls back to Theme 1 (Ember Dark).
 */
export default function useTheme() {
  const { themeNumber } = restaurantStore();

  useEffect(() => {
    const tokens = buildCssTokens(themeNumber || DEFAULT_THEME_NUMBER);
    applyCssTokens(tokens);
  }, [themeNumber]);
}
