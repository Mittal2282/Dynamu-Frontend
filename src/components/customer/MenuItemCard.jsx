import { useMemo, useState } from "react";
import CartControl from "./CartControl";
import VariantDrawer from "./VariantDrawer";
import { VegBadge } from "../ui/Badge";
import LazyImage from "../ui/LazyImage";
import { formatCurrency } from "../../utils/formatters";
import { cartStore, cartKey } from "../../store/cartStore";
import { syncCart } from "../../services/customerService";
import { getItemVegStatus, variantEffectivePrice } from "../../utils/vegStatus";

// ── Level dots (spice / sugar indicator) ─────────────────────────────────────
export function LevelDots({ level = 0, max = 5, color, icon }) {
  if (!level) return null;
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] leading-none">{icon}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-all"
            style={{
              background: i < level ? color : "var(--t-line)",
              opacity: i < level ? 1 : 0.35,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Compact per-variant qty row (used inside MenuItemCard for variant items) ──
function VariantQtyRow({ cartItem, currencySymbol }) {
  const key = cartItem._cartKey;
  const qty = cartStore((s) => s.cart[key]?.qty ?? 0);
  const variant = cartItem.selectedVariant;

  const handleAdd = async () => {
    cartStore.getState().add(cartItem);
    try { await syncCart(Object.values(cartStore.getState().cart)); } catch { /* ignore */ }
  };

  const handleRemove = async () => {
    cartStore.getState().remove(cartItem);
    try { await syncCart(Object.values(cartStore.getState().cart)); } catch { /* ignore */ }
  };

  if (qty === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Veg/non-veg dot */}
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: variant?.isVeg ? "#22c55e" : "#ef4444" }}
      />
      {/* Variant name */}
      <span
        className="flex-1 text-[11px] font-semibold truncate"
        style={{ color: "rgba(245,246,250,0.85)" }}
      >
        {variant?.name ?? "Default"}
      </span>
      {/* Mini stepper */}
      <div
        className="flex items-stretch rounded-lg overflow-hidden shrink-0"
        style={{ border: "1.5px solid var(--t-accent-40)", background: "var(--t-accent-10)", height: "26px" }}
      >
        <button
          type="button"
          onClick={handleRemove}
          className="flex items-center justify-center cursor-pointer transition-colors"
          style={{ width: "26px", color: "var(--t-accent)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-accent-20)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          aria-label="Decrease"
        >
          <span style={{ fontSize: "14px", fontWeight: 700, lineHeight: 1 }}>−</span>
        </button>
        <div
          className="flex items-center justify-center"
          style={{ minWidth: "24px", borderLeft: "1px solid var(--t-accent-40)", borderRight: "1px solid var(--t-accent-40)" }}
        >
          <span className="font-black text-[11px] tabular-nums select-none" style={{ color: "#fff" }}>
            {qty}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center justify-center cursor-pointer transition-colors"
          style={{ width: "26px", color: "var(--t-accent)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-accent-20)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          aria-label="Increase"
        >
          <span style={{ fontSize: "14px", fontWeight: 700, lineHeight: 1 }}>+</span>
        </button>
      </div>
    </div>
  );
}

// ── Menu item card (horizontal layout — image left, details right) ─────────────
export default function MenuItemCard({ item, currencySymbol, size = "md" }) {
  const isSmall = size === "sm";
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Only available variants are shown to the customer
  const availableVariants = item.has_variants
    ? (item.variants ?? []).filter(v => v.isAvailable !== false)
    : [];
  const allVariantsUnavailable = item.has_variants && availableVariants.length === 0;

  // Price for display — use effective (post-discount) price of first available variant
  const defaultVariant = item.has_variants
    ? (availableVariants.find((v) => v.isDefault) ?? availableVariants[0] ?? null)
    : null;
  const displayPrice = item.has_variants
    ? (defaultVariant ? variantEffectivePrice(defaultVariant) : item.price)
    : item.price;

  const hasDiscount = !item.has_variants && item.discount_percentage > 0;
  const discountedPrice = hasDiscount
    ? Math.round(item.price * (1 - item.discount_percentage / 100))
    : null;

  // Ingredients — support both array and comma-separated string
  const rawIngredients = item.ingredients;
  const ingredients = Array.isArray(rawIngredients)
    ? rawIngredients
    : typeof rawIngredients === "string" && rawIngredients.trim()
      ? rawIngredients.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  const spicyLevel =
    item.spicy_level != null && item.spicy_level > 0 ? item.spicy_level : null;
  const sugarLevel =
    item.sugar_level != null && item.sugar_level > 0 ? item.sugar_level : null;

  // ── Zustand subscriptions ────────────────────────────────────────────────────
  // Subscribe to the whole cart object — Zustand returns the same reference when
  // cart is unchanged, so this is safe and stable.
  const cart = cartStore((s) => s.cart);

  // Derived values via useMemo so we never return a new reference from a selector
  const variantTotalQty = useMemo(() => {
    if (!item.has_variants) return 0;
    return Object.entries(cart)
      .filter(([k]) => k.startsWith(`${item._id}__`))
      .reduce((sum, [, v]) => sum + v.qty, 0);
  }, [cart, item._id, item.has_variants]);

  const singleItemQty = useMemo(() => {
    if (item.has_variants) return 0;
    return cart[cartKey(item)]?.qty ?? 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, item._id, item.has_variants]);

  // Array of [cartKey, cartItem] pairs for in-cart variants — stable reference via useMemo
  const variantCartEntries = useMemo(() => {
    if (!item.has_variants) return [];
    return Object.entries(cart).filter(([k]) => k.startsWith(`${item._id}__`));
  }, [cart, item._id, item.has_variants]);

  // Veg status: 'veg' | 'nonveg' | 'mixed'
  const vegStatus = getItemVegStatus(item);

  const groupName = item.has_variants
    ? (item.variants?.[0]?.groupName ?? "Options")
    : null;

  return (
    <div
      className="rounded-2xl overflow-hidden border transition-transform duration-150 active:scale-[0.99] h-full flex flex-col"
      style={{ background: "var(--t-surface)", borderColor: "var(--t-line)" }}
    >
      <div className={`${isSmall ? "p-2.5" : "p-3"} flex gap-3 flex-1`}>
        {/* ── Image + Price ──────────────────────────────────────────────── */}
        <div className="shrink-0 flex flex-col items-center gap-3 self-start">
          <div className="relative overflow-hidden rounded-xl">
            <LazyImage
              src={item.image_url}
              alt={item.name}
              containerClassName={isSmall ? "w-[64px] h-[64px] rounded-xl overflow-hidden" : "w-[88px] h-[88px] md:w-[100px] md:h-[100px] rounded-xl overflow-hidden"}
              imgClassName="w-full h-full object-cover"
              placeholder={
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: "var(--t-float)" }}
                >
                  <span className="text-3xl">{vegStatus !== 'nonveg' ? "🥗" : "🍗"}</span>
                </div>
              }
            />
            {/* Veg / Non-veg dot */}
            <div className="absolute top-1.5 left-1.5 p-[3px] rounded-sm bg-white/90 shadow-sm">
              <VegBadge isVeg={vegStatus === 'mixed' ? 'mixed' : vegStatus === 'veg'} size="sm" />
            </div>
          </div>

          {/* Price below image */}
          <div className="flex flex-col items-center gap-1 w-full">
            {item.has_variants && (
              <span
                className="text-[9px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--t-dim)" }}
              >
                from
              </span>
            )}
            {/* Main price pill */}
            <div
              className="w-full text-center font-black text-[13px] leading-none px-2 py-1.5 rounded-lg"
              style={{
                color: "var(--t-accent)",
                background: "color-mix(in srgb, var(--t-accent) 10%, transparent)",
              }}
            >
              {formatCurrency(
                discountedPrice ?? item.price_label ?? displayPrice,
                currencySymbol,
              )}
            </div>
            {hasDiscount && (
              <div className="flex flex-col items-center gap-1">
                <span
                  className="text-[10px] line-through leading-none tracking-wide"
                  style={{ color: "var(--t-dim)", opacity: 0.6 }}
                >
                  {formatCurrency(displayPrice, currencySymbol)}
                </span>
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 rounded-full border uppercase leading-none tracking-tight"
                  style={{
                    background: "color-mix(in srgb, var(--t-success) 12%, transparent)",
                    borderColor: "color-mix(in srgb, var(--t-success) 25%, transparent)",
                    color: "var(--t-success)",
                  }}
                >
                  {item.discount_percentage}% off
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="font-bold text-sm md:text-base leading-snug line-clamp-2" style={{ color: "#ffffff" }}>
            {item.name}
          </h3>

          {/* Variant indicator pill */}
          {item.has_variants && item.variants?.length > 0 && (
            <span
              className="inline-flex items-center self-start gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5"
              style={{
                background: "color-mix(in srgb, var(--t-accent) 15%, transparent)",
                color: "var(--t-accent)",
              }}
            >
              {groupName} · {item.variants.length}
            </span>
          )}

          {item.description && (
            <p
              className="text-[11px] mt-1 leading-relaxed line-clamp-2"
              style={{ color: "rgba(245,246,250,0.6)" }}
            >
              {item.description}
            </p>
          )}

          {/* Spice + Sugar level dots */}
          {(spicyLevel !== null || sugarLevel !== null) && (
            <div className="flex gap-3 mt-1.5">
              {spicyLevel !== null && (
                <LevelDots level={spicyLevel} icon="🌶️" color="var(--t-accent)" />
              )}
              {sugarLevel !== null && (
                <LevelDots level={sugarLevel} icon="🍬" color="var(--t-accent2)" />
              )}
            </div>
          )}

          {/* ── Cart / Variant controls ───────────────────────────────────── */}
          <div className="mt-auto pt-2">
            {!item.has_variants ? (
              /* Non-variant item: standard CartControl */
              <div className="flex items-center justify-end">
                <CartControl item={item} />
              </div>
            ) : variantTotalQty === 0 ? (
              /* Variant item, nothing in cart: "Choose" button opens drawer */
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => !allVariantsUnavailable && setDrawerOpen(true)}
                  disabled={allVariantsUnavailable}
                  className="flex items-center justify-center gap-1.5 rounded-xl font-bold text-white text-xs tracking-wide transition-all active:scale-95"
                  style={{
                    background: allVariantsUnavailable ? "var(--t-line)" : "var(--t-accent)",
                    boxShadow: allVariantsUnavailable ? "none" : "0 4px 14px var(--t-accent-40)",
                    opacity: allVariantsUnavailable ? 0.55 : 1,
                    cursor: allVariantsUnavailable ? "not-allowed" : "pointer",
                    height: "36px",
                    minWidth: "108px",
                    paddingLeft: "14px",
                    paddingRight: "14px",
                  }}
                >
                  {allVariantsUnavailable ? (
                    <span>Unavailable</span>
                  ) : (
                    <>
                      <span style={{ fontSize: "13px", fontWeight: 900, lineHeight: 1 }}>+</span>
                      <span>Choose</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Variant item, one or more variants in cart: per-variant rows + Add more */
              <div className="flex flex-col gap-1.5">
                {variantCartEntries.map(([key, cartItem]) => (
                  <VariantQtyRow
                    key={key}
                    cartItem={cartItem}
                    currencySymbol={currencySymbol}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="self-end text-[11px] font-semibold cursor-pointer transition-opacity hover:opacity-70 mt-0.5"
                  style={{ color: "var(--t-accent)" }}
                >
                  + Add {groupName}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Ingredients carousel ──────────────────────────────────────────── */}
      {ingredients.length > 0 && (
        <div
          className="px-3 pb-2.5 pt-0 border-t -mt-0.5"
          style={{ borderColor: "var(--t-line)" }}
        >
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2">
            <span
              className="text-[9px] font-semibold uppercase tracking-wider shrink-0"
              style={{ color: "var(--t-dim)" }}
            >
              with
            </span>
            {ingredients.map((ing, i) => (
              <span
                key={i}
                className="shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap"
                style={{
                  borderColor: "var(--t-line)",
                  color: "var(--t-dim)",
                  background: "var(--t-float)",
                }}
              >
                {ing}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Variant drawer (portal) */}
      {item.has_variants && (
        <VariantDrawer
          item={item}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}
