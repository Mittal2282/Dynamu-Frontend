import { useMemo, useState } from "react";
import CartControl from "./CartControl";
import MenuItemDetailDrawer from "./MenuItemDetailDrawer";
import { VegBadge } from "../ui/Badge";
import LazyImage from "../ui/LazyImage";
import { formatCurrency } from "../../utils/formatters";
import { cartStore, cartKey } from "../../store/cartStore";
import { syncCart } from "../../services/customerService";
import { getItemVegStatus, variantEffectivePrice } from "../../utils/vegStatus";
import type { MenuItem, Variant } from "../../types/menu";

interface MenuItemCardProps {
  item: MenuItem;
  currencySymbol?: string;
  size?: 'md' | 'sm';
}

// Extended MenuItem fields used in this component beyond the base type
interface ExtendedMenuItem extends MenuItem {
  spicy_level?: number;
  sugar_level?: number;
  price_label?: string | number;
  ingredients?: string | string[];
}

interface LevelDotsProps {
  level?: number;
  max?: number;
  color?: string;
  icon?: string;
}

// ── Level dots (spice / sugar indicator) ─────────────────────────────────────
export function LevelDots({ level = 0, max = 5, color, icon }: LevelDotsProps) {
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
interface CartItemEntry {
  _cartKey: string;
  selectedVariant?: { name?: string; isVeg?: boolean | null };
  [key: string]: unknown;
}

interface VariantQtyRowProps {
  cartItem: CartItemEntry;
  currencySymbol?: string;
}

function VariantQtyRow({ cartItem, currencySymbol: _currencySymbol }: VariantQtyRowProps) {
  const key = cartItem._cartKey;
  const qty = cartStore((s) => s.cart[key]?.qty ?? 0);
  const syncing = cartStore((s) => s.syncing);
  const [loading, setLoading] = useState(false);
  const variant = cartItem.selectedVariant;

  const beginSync = () => { setLoading(true); cartStore.getState().setSyncing(true); };
  const endSync   = () => { setLoading(false); cartStore.getState().setSyncing(false); };

  const handleAdd = async () => {
    if (syncing) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cartStore.getState().add(cartItem as any);
    beginSync();
    try { await syncCart(Object.values(cartStore.getState().cart)); } catch { /* ignore */ }
    finally { endSync(); }
  };

  const handleRemove = async () => {
    if (syncing) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cartStore.getState().remove(cartItem as any);
    beginSync();
    try { await syncCart(Object.values(cartStore.getState().cart)); } catch { /* ignore */ }
    finally { endSync(); }
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
        style={{ color: "var(--t-text)" }}
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
          disabled={syncing}
          aria-label="Decrease"
          className="flex items-center justify-center transition-colors"
          style={{ width: "26px", color: "var(--t-accent)", opacity: syncing ? 0.35 : 1, cursor: syncing ? "not-allowed" : "pointer" }}
          onMouseEnter={(e) => { if (!syncing) e.currentTarget.style.background = "var(--t-accent-20)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ fontSize: "14px", fontWeight: 700, lineHeight: 1 }}>−</span>
        </button>
        <div
          className="flex items-center justify-center"
          style={{ minWidth: "24px", borderLeft: "1px solid var(--t-accent-40)", borderRight: "1px solid var(--t-accent-40)" }}
        >
          {loading ? (
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--t-accent)" }} />
          ) : (
            <span className="font-black text-[11px] tabular-nums select-none" style={{ color: "var(--t-accent)" }}>
              {qty}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={syncing}
          aria-label="Increase"
          className="flex items-center justify-center transition-colors"
          style={{ width: "26px", color: "var(--t-accent)", opacity: syncing ? 0.35 : 1, cursor: syncing ? "not-allowed" : "pointer" }}
          onMouseEnter={(e) => { if (!syncing) e.currentTarget.style.background = "var(--t-accent-20)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ fontSize: "14px", fontWeight: 700, lineHeight: 1 }}>+</span>
        </button>
      </div>
    </div>
  );
}

// ── Menu item card (horizontal layout — image left, details right) ─────────────
export default function MenuItemCard({ item, currencySymbol, size = "md" }: MenuItemCardProps) {
  const extItem = item as ExtendedMenuItem;
  const isSmall = size === "sm";

  // Only available variants are shown to the customer
  const availableVariants = item.has_variants
    ? (item.variants ?? []).filter(v => v.isAvailable !== false)
    : [];

  const [variantExpanded, setVariantExpanded] = useState(false);
  const [selectedInlineVariant, setSelectedInlineVariant] = useState<Variant | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openVariantPicker = () => {
    const def = availableVariants.find((v) => (v as { isDefault?: boolean }).isDefault) ?? availableVariants[0] ?? null;
    setSelectedInlineVariant(def);
    setVariantExpanded(true);
  };

  const handleInlineAdd = async () => {
    if (!selectedInlineVariant || cartStore.getState().syncing) return;
    const effectiveVariant = { ...selectedInlineVariant, price: variantEffectivePrice(selectedInlineVariant) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cartStore.getState().add({ ...item, selectedVariant: effectiveVariant } as any);
    cartStore.getState().setSyncing(true);
    try {
      await syncCart(Object.values(cartStore.getState().cart));
      setVariantExpanded(false);
    } catch { /* ignore */ }
    finally { cartStore.getState().setSyncing(false); }
  };
  const allVariantsUnavailable = item.has_variants && availableVariants.length === 0;

  // Price for display — use effective (post-discount) price of first available variant
  const defaultVariant = item.has_variants
    ? (availableVariants.find((v) => (v as { isDefault?: boolean }).isDefault) ?? availableVariants[0] ?? null)
    : null;
  const displayPrice = item.has_variants
    ? (defaultVariant ? variantEffectivePrice(defaultVariant) : item.price)
    : item.price;

  const hasDiscount = !item.has_variants && (item.discount_percentage ?? 0) > 0;
  const discountedPrice = hasDiscount
    ? Math.round(item.price * (1 - (item.discount_percentage ?? 0) / 100))
    : null;

  // Ingredients — support both array and comma-separated string
  const rawIngredients = extItem.ingredients;
  const ingredients = Array.isArray(rawIngredients)
    ? rawIngredients
    : typeof rawIngredients === "string" && rawIngredients.trim()
      ? rawIngredients.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  const spicyLevel =
    extItem.spicy_level != null && extItem.spicy_level > 0 ? extItem.spicy_level : null;
  const sugarLevel =
    extItem.sugar_level != null && extItem.sugar_level > 0 ? extItem.sugar_level : null;

  // ── Zustand subscriptions ────────────────────────────────────────────────────
  const cart = cartStore((s) => s.cart);
  const syncing = cartStore((s) => s.syncing);

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

  // Array of [cartKey, cartItem] pairs for in-cart variants
  const variantCartEntries = useMemo(() => {
    if (!item.has_variants) return [];
    return Object.entries(cart).filter(([k]) => k.startsWith(`${item._id}__`));
  }, [cart, item._id, item.has_variants]);

  // Veg status: 'veg' | 'nonveg' | 'mixed'
  const vegStatus = getItemVegStatus(item);

  const groupName = item.has_variants
    ? ((item.variants?.[0] as { groupName?: string })?.groupName ?? "Options")
    : null;

  void singleItemQty; // used implicitly via cartKey subscription

  return (
    <div
      className={`rounded-2xl overflow-hidden border h-full flex flex-col cursor-pointer ${!variantExpanded ? "transition-transform duration-150 active:scale-[0.99]" : ""}`}
      style={{ background: "var(--t-surface)", borderColor: variantExpanded ? "var(--t-accent)" : "var(--t-line)" }}
      onClick={() => { if (!variantExpanded) setDetailOpen(true); }}
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
                discountedPrice ?? extItem.price_label ?? displayPrice,
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
          <h3 className="font-bold text-sm md:text-base leading-snug line-clamp-2" style={{ color: "var(--t-text)" }}>
            {item.name}
          </h3>

          {/* Variant indicator pill */}
          {item.has_variants && item.variants && item.variants.length > 0 && (
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
              style={{ color: "var(--t-dim)" }}
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
          <div className="mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
            {!item.has_variants ? (
              /* Non-variant item: standard CartControl */
              <div className="flex items-center justify-end">
                <CartControl item={item} />
              </div>
            ) : variantTotalQty === 0 ? (
              /* Variant item, nothing in cart: "Choose" button expands inline */
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => !allVariantsUnavailable && openVariantPicker()}
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
                    cartItem={cartItem as CartItemEntry}
                    currencySymbol={currencySymbol}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => openVariantPicker()}
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

      {/* ── Inline variant picker ─────────────────────────────────────────── */}
      {item.has_variants && variantExpanded && (
        <div
          className="border-t px-3 pb-4 pt-3"
          style={{ borderColor: "var(--t-line)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--t-dim)" }}>
              {groupName}
            </p>
            <button
              type="button"
              onClick={() => setVariantExpanded(false)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors"
              style={{ color: "var(--t-dim)", background: "var(--t-float)" }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-1.5 mb-3">
            {availableVariants.map((v) => {
              const isActive = selectedInlineVariant?.name === v.name;
              return (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => setSelectedInlineVariant(v)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left"
                  style={{
                    borderColor: isActive ? "var(--t-accent)" : "var(--t-line)",
                    background: isActive
                      ? "color-mix(in srgb, var(--t-accent) 10%, transparent)"
                      : "var(--t-surface)",
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: isActive ? "var(--t-accent)" : "var(--t-line)" }}
                  >
                    {isActive && <div className="w-2 h-2 rounded-full" style={{ background: "var(--t-accent)" }} />}
                  </div>
                  <span className="flex-1 text-sm font-semibold" style={{ color: "var(--t-text)" }}>
                    {v.name}
                  </span>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: v.isVeg !== false ? "#22c55e" : "#ef4444" }} />
                  <span className="text-sm font-bold" style={{ color: isActive ? "var(--t-accent)" : "var(--t-dim)" }}>
                    {formatCurrency(variantEffectivePrice(v), currencySymbol)}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleInlineAdd}
            disabled={!selectedInlineVariant || syncing}
            className="relative w-full py-2.5 rounded-xl font-bold text-white text-sm tracking-wide transition-all active:scale-[0.98]"
            style={{
              background: selectedInlineVariant ? "var(--t-accent)" : "var(--t-line)",
              boxShadow: selectedInlineVariant && !syncing ? "0 4px 14px var(--t-accent-40)" : "none",
              cursor: syncing || !selectedInlineVariant ? "not-allowed" : "pointer",
            }}
          >
            <span className={syncing ? "opacity-0" : ""}>
              {selectedInlineVariant
                ? `Add to Cart · ${formatCurrency(variantEffectivePrice(selectedInlineVariant), currencySymbol)}`
                : "Select an option"}
            </span>
            {syncing && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span
                  className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
                />
              </span>
            )}
          </button>
        </div>
      )}

      {/* Detail drawer (portal) */}
      {detailOpen && (
        <MenuItemDetailDrawer
          item={item}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </div>
  );
}
