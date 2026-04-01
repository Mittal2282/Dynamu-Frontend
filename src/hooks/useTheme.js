import { useEffect } from 'react';
import { restaurantStore } from '../store/restaurantStore';
import { buildCssTokens, applyCssTokens, BRAND_DEFAULTS } from '../theme/tokens';

/**
 * useTheme — applies restaurant brand colors as CSS variables on mount
 * and whenever the restaurant store changes.
 *
 * Mount this once at the top level of the customer-facing app (e.g. CustomerLayout).
 * The CSS variables are then available to Tailwind via the `brand-*` color tokens.
 */
export default function useTheme() {
  const { primaryColor, secondaryColor, tertiaryColor, neutralColor } = restaurantStore();

  useEffect(() => {
    const tokens = buildCssTokens({
      primary:   primaryColor   || BRAND_DEFAULTS.primary,
      secondary: secondaryColor || BRAND_DEFAULTS.secondary,
      tertiary:  tertiaryColor  || BRAND_DEFAULTS.tertiary,
      neutral:   neutralColor   || BRAND_DEFAULTS.neutral,
    });
    applyCssTokens(tokens);
  }, [primaryColor, secondaryColor, tertiaryColor, neutralColor]);
}
