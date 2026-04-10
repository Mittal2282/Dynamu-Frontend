/**
 * Returns the veg status of a menu item considering all its variants.
 *
 * Returns:
 *  'veg'    — item is veg (no variants, or all available variants are veg)
 *  'nonveg' — item is non-veg (no variants, or all available variants are non-veg)
 *  'mixed'  — item has both veg and non-veg variants
 */
export function getItemVegStatus(item) {
  const variants = item.has_variants ? (item.variants ?? []) : [];
  if (variants.length === 0) {
    return item.is_veg !== false ? 'veg' : 'nonveg';
  }
  const hasVeg    = variants.some(v => v.isVeg !== false);
  const hasNonVeg = variants.some(v => v.isVeg === false);
  if (hasVeg && hasNonVeg) return 'mixed';
  return hasVeg ? 'veg' : 'nonveg';
}

/**
 * Returns the effective (post-discount) price for a single variant.
 * Falls back to the raw price when no discount is set.
 */
export function variantEffectivePrice(variant) {
  const disc = variant.discount_percentage ?? 0;
  return disc > 0 ? Math.round(variant.price * (1 - disc / 100)) : variant.price;
}
