/**
 * Design token definitions.
 * All brand color references flow through here.
 */

/**
 * Default brand colors (used when no restaurant-specific branding is available).
 * Restaurant branding from the API overrides these at runtime via CSS vars.
 */
export const BRAND_DEFAULTS = {
  primary:   '#FF6B35',
  secondary: '#FFFFFF',
};

/**
 * Generate the full set of CSS custom properties from a brand config.
 * @param {{ primary: string, secondary: string }} brand
 * @returns {Record<string, string>}
 */
export function buildCssTokens(brand = BRAND_DEFAULTS) {
  return {
    '--color-brand-primary':   brand.primary,
    '--color-brand-secondary': brand.secondary,
    // Derived: alpha variants for overlays
    '--color-brand-primary-10':  `${brand.primary}1A`, // 10% opacity
    '--color-brand-primary-20':  `${brand.primary}33`, // 20% opacity
    '--color-brand-primary-40':  `${brand.primary}66`, // 40% opacity
  };
}

/**
 * Apply CSS custom properties to :root.
 * @param {Record<string, string>} tokens
 */
export function applyCssTokens(tokens) {
  const root = document.documentElement;
  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
