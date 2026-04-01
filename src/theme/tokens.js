/**
 * Design token definitions.
 * All brand color references flow through here.
 */

/**
 * Default brand colors (used when no restaurant-specific branding is available).
 * Restaurant branding from the API overrides these at runtime via CSS vars.
 */
export const BRAND_DEFAULTS = {
  primary:   '#FF6B00',
  secondary: '#00F0FF',
  tertiary:  '#7000FF',
  neutral:   '#0B0E14',
};

/**
 * Generate the full set of CSS custom properties from a brand config.
 * @param {{ primary: string, secondary: string, tertiary: string, neutral: string }} brand
 * @returns {Record<string, string>}
 */
export function buildCssTokens(brand = BRAND_DEFAULTS) {
  return {
    '--color-brand-primary':    brand.primary,
    '--color-brand-secondary':  brand.secondary,
    '--color-brand-tertiary':   brand.tertiary,
    '--color-brand-neutral':    brand.neutral,

    // Derived: alpha variants for Primary
    '--color-brand-primary-10':  `${brand.primary}1A`, // 10% opacity
    '--color-brand-primary-20':  `${brand.primary}33`, // 20% opacity
    '--color-brand-primary-40':  `${brand.primary}66`, // 40% opacity

    // Derived: alpha variants for Secondary
    '--color-brand-secondary-10': `${brand.secondary}1A`,
    '--color-brand-secondary-20': `${brand.secondary}33`,
    '--color-brand-secondary-40': `${brand.secondary}66`,

    // Derived: alpha variants for Tertiary
    '--color-brand-tertiary-10': `${brand.tertiary}1A`,
    '--color-brand-tertiary-20': `${brand.tertiary}33`,
    '--color-brand-tertiary-40': `${brand.tertiary}66`,

    // Derived: alpha variants for Neutral
    '--color-brand-neutral-10': `${brand.neutral}1A`,
    '--color-brand-neutral-20': `${brand.neutral}33`,
    '--color-brand-neutral-40': `${brand.neutral}66`,

    // Customer bottom nav — derived from neutral so it tracks dynamic theme
    '--color-nav-tile-active': `color-mix(in srgb, ${brand.neutral} 88%, white 12%)`,
    '--color-nav-muted':       `color-mix(in srgb, ${brand.neutral} 28%, white 72%)`,
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
