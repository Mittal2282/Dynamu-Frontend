import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { syncCart } from "../../services/customerService";
import { cartStore } from "../../store/cartStore";
import { restaurantStore } from "../../store/restaurantStore";
import type { MenuItem, Variant } from "../../types/menu";
import { formatCurrency } from "../../utils/formatters";
import { getItemVegStatus, variantEffectivePrice } from "../../utils/vegStatus";
import { VegBadge } from "../ui/Badge";
import LazyImage from "../ui/LazyImage";
import CartControl from "./CartControl";
import { LevelDots } from "./MenuItemCard";
import VariantDrawer from "./VariantDrawer";

interface MenuItemDetailDrawerProps {
  item: MenuItem;
  onClose: () => void;
  currencySymbol?: string;
}

// Extended fields used in this component beyond the base MenuItem type
interface ExtendedMenuItem extends MenuItem {
  spicy_level?: number;
  sugar_level?: number;
  price_label?: string | number;
  ingredients?: string | string[];
  tags?: string[];
  meal_tag?: string;
  serves?: string | number;
  preparation_time?: string | number;
  taste_profile?: string;
  allergens?: string;
}

/* ─── Lightweight card for similar items (avoids circular import) ─────────────── */
interface SimilarItemCardProps {
  item: MenuItem;
  currencySymbol?: string;
}

function SimilarItemCard({ item, currencySymbol }: SimilarItemCardProps) {
  const [variantDrawerOpen, setVariantDrawerOpen] = useState(false);

  const availableVariants = item.has_variants
    ? (item.variants ?? []).filter((v) => v.isAvailable !== false)
    : [];
  const allVariantsUnavailable = item.has_variants && availableVariants.length === 0;
  const defaultVariant = item.has_variants
    ? (availableVariants.find((v) => (v as { isDefault?: boolean }).isDefault) ??
      availableVariants[0] ??
      null)
    : null;
  const displayPrice = item.has_variants
    ? defaultVariant
      ? variantEffectivePrice(defaultVariant)
      : item.price
    : item.price;
  const hasDiscount = !item.has_variants && (item.discount_percentage ?? 0) > 0;
  const discountedPrice = hasDiscount
    ? Math.round(item.price * (1 - (item.discount_percentage ?? 0) / 100))
    : null;
  const vegStatus = getItemVegStatus(item);

  return (
    <div
      className="rounded-2xl overflow-hidden border flex flex-col"
      style={{ background: "var(--t-surface)", borderColor: "var(--t-line)" }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: "100px" }}>
        <LazyImage
          src={item.image_url}
          alt={item.name}
          containerClassName="w-full h-full overflow-hidden"
          imgClassName="w-full h-full object-cover"
          placeholder={
            <div
              className="w-full h-full flex items-center justify-center text-3xl"
              style={{ background: "var(--t-float)" }}
            >
              {vegStatus !== "nonveg" ? "🥗" : "🍗"}
            </div>
          }
        />
        <div className="absolute top-1.5 left-1.5 p-0.75 rounded-sm bg-white/90 shadow-sm">
          <VegBadge isVeg={vegStatus === "mixed" ? "mixed" : vegStatus === "veg"} size="sm" />
        </div>
      </div>

      {/* Details */}
      <div className="p-2.5 flex flex-col flex-1 gap-2">
        <p
          className="text-xs font-bold leading-snug line-clamp-2"
          style={{ color: "var(--t-text)" }}
        >
          {item.name}
        </p>

        {/* Price */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.has_variants && (
            <span className="text-[9px]" style={{ color: "var(--t-dim)" }}>
              from
            </span>
          )}
          <span className="text-xs font-black" style={{ color: "var(--t-accent)" }}>
            {formatCurrency(
              discountedPrice ?? displayPrice,
              currencySymbol,
            )}
          </span>
          {hasDiscount && (
            <span
              className="text-[9px] line-through"
              style={{ color: "var(--t-dim)", opacity: 0.6 }}
            >
              {formatCurrency(displayPrice, currencySymbol)}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
          {!item.has_variants ? (
            <CartControl item={item} />
          ) : (
            <button
              type="button"
              onClick={() => !allVariantsUnavailable && setVariantDrawerOpen(true)}
              disabled={allVariantsUnavailable}
              className="w-full flex items-center justify-center gap-1 rounded-xl font-bold text-white text-xs tracking-wide transition-all active:scale-95 cursor-pointer"
              style={{
                background: allVariantsUnavailable ? "var(--t-line)" : "var(--t-accent)",
                boxShadow: allVariantsUnavailable ? "none" : "0 4px 14px var(--t-accent-40)",
                height: "32px",
              }}
            >
              {allVariantsUnavailable ? (
                "Unavailable"
              ) : (
                <>
                  <span style={{ fontSize: "12px", fontWeight: 900 }}>+</span>
                  Choose
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {item.has_variants && (
        <VariantDrawer
          item={item}
          open={variantDrawerOpen}
          onClose={() => setVariantDrawerOpen(false)}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}

/* ─── Menu Item Detail Drawer (bottom sheet portal) ─────────────────────────── */
export default function MenuItemDetailDrawer({ item, onClose }: MenuItemDetailDrawerProps) {
  const { currencySymbol, menu } = restaurantStore();

  // Variant selection — initialised after mount via effect so hooks stay unconditional
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addLoading, setAddLoading] = useState(false);

  // Drag-to-close state
  const [dragDelta, setDragDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startY: number; delta: number; active: boolean }>({
    startY: 0,
    delta: 0,
    active: false,
  });

  const CLOSE_THRESHOLD = 100;

  const handleTouchStart = (e: React.TouchEvent) => {
    dragRef.current = { startY: e.touches[0].clientY, delta: 0, active: true };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current.active) return;
    const delta = Math.max(0, e.touches[0].clientY - dragRef.current.startY);
    dragRef.current.delta = delta;
    setDragDelta(delta);
  };

  const handleTouchEnd = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setIsDragging(false);
    if (dragRef.current.delta >= CLOSE_THRESHOLD) {
      setDragDelta(window.innerHeight);
      setTimeout(onClose, 280);
    } else {
      setDragDelta(0);
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Pre-select the default variant once we know the item
  useEffect(() => {
    if (!item?.has_variants) return;
    const variants = (item.variants ?? []).filter((v) => v.isAvailable !== false);
    const def =
      variants.find((v) => (v as { isDefault?: boolean }).isDefault) ?? variants[0] ?? null;
    setSelectedVariant(def);
  }, [item]);

  if (!item) return null;

  const extItem = item as ExtendedMenuItem;
  const vegStatus = getItemVegStatus(item);
  const availableVariants = item.has_variants
    ? (item.variants ?? []).filter((v) => v.isAvailable !== false)
    : [];
  const allVariantsUnavailable = item.has_variants && availableVariants.length === 0;
  const defaultVariant = item.has_variants
    ? (availableVariants.find((v) => (v as { isDefault?: boolean }).isDefault) ??
      availableVariants[0] ??
      null)
    : null;
  const groupName = item.has_variants
    ? ((item.variants?.[0] as { groupName?: string })?.groupName ?? "Options")
    : null;

  const handleAddToCart = async () => {
    setAddLoading(true);
    try {
      if (item.has_variants) {
        if (!selectedVariant) return;
        const effectiveVariant = {
          ...selectedVariant,
          price: variantEffectivePrice(selectedVariant),
        };
        for (let i = 0; i < quantity; i++) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cartStore.getState().add({ ...item, selectedVariant: effectiveVariant } as any);
        }
      } else {
        for (let i = 0; i < quantity; i++) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cartStore.getState().add(item as any);
        }
      }
      await syncCart(Object.values(cartStore.getState().cart));
      onClose();
    } catch {
      // keep drawer open on failure
    } finally {
      setAddLoading(false);
    }
  };

  const displayPrice = item.has_variants
    ? defaultVariant
      ? variantEffectivePrice(defaultVariant)
      : item.price
    : item.price;
  const hasDiscount = !item.has_variants && (item.discount_percentage ?? 0) > 0;
  const discountedPrice = hasDiscount
    ? Math.round(item.price * (1 - (item.discount_percentage ?? 0) / 100))
    : null;

  const rawIngredients = extItem.ingredients;
  const ingredients = Array.isArray(rawIngredients)
    ? rawIngredients
    : typeof rawIngredients === "string" && rawIngredients.trim()
      ? rawIngredients
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const tags: string[] = Array.isArray(extItem.tags) ? extItem.tags : [];

  const similarItems = Object.values(menu ?? {})
    .flat()
    .filter((m) => m.category === item.category && m._id !== item._id && m.is_available !== false)
    .slice(0, 6);

  const content = (
    <>
      {/* Backdrop — fades as user drags sheet down */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: "rgba(0,0,0,0.65)",
          opacity: 1 - dragDelta / (window.innerHeight * 0.6),
          transition: isDragging ? "none" : "opacity 0.28s ease",
        }}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden flex flex-col"
        style={{
          background: "var(--t-bg)",
          maxHeight: "92vh",
          transform: `translateY(${dragDelta}px)`,
          transition: isDragging ? "none" : "transform 0.28s cubic-bezier(0.32,0.72,0,1)",
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close button — always visible, overlaid on top of sheet */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer z-20 transition-opacity hover:opacity-80 active:scale-95"
          style={{ background: "rgba(0,0,0,0.45)", color: "#fff" }}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          {/* Hero image — flush to top */}
          <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
            <LazyImage
              src={item.image_url}
              alt={item.name}
              containerClassName="w-full h-full overflow-hidden"
              imgClassName="w-full h-full object-cover"
              placeholder={
                <div
                  className="w-full h-full flex items-center justify-center text-6xl"
                  style={{ background: "var(--t-float)" }}
                >
                  {vegStatus !== "nonveg" ? "🥗" : "🍗"}
                </div>
              }
            />
            {/* Veg badge */}
            <div className="absolute bottom-3 left-3 p-1 rounded-md bg-white/90 shadow">
              <VegBadge isVeg={vegStatus === "mixed" ? "mixed" : vegStatus === "veg"} size="md" />
            </div>
          </div>

          <div className="px-5 pt-4 pb-6 space-y-4">
            {/* Name + badges */}
            <div>
              <h2 className="text-xl font-bold leading-snug" style={{ color: "var(--t-text)" }}>
                {item.name}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {item.category && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--t-float)",
                      color: "var(--t-dim)",
                      border: "1px solid var(--t-line)",
                    }}
                  >
                    {item.category}
                  </span>
                )}
                {extItem.meal_tag && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: "color-mix(in srgb, var(--t-accent) 12%, transparent)",
                      color: "var(--t-accent)",
                    }}
                  >
                    {extItem.meal_tag}
                  </span>
                )}
                {item.is_chefs_special && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
                  >
                    Chef's Special
                  </span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 flex-wrap">
              {item.has_variants && (
                <span className="text-sm" style={{ color: "var(--t-dim)" }}>
                  from
                </span>
              )}
              <span className="text-2xl font-black" style={{ color: "var(--t-accent)" }}>
                {formatCurrency(
                  discountedPrice ?? displayPrice,
                  currencySymbol,
                )}
              </span>
              {hasDiscount && (
                <>
                  <span
                    className="text-base line-through"
                    style={{ color: "var(--t-dim)", opacity: 0.6 }}
                  >
                    {formatCurrency(item.price, currencySymbol)}
                  </span>
                  <span
                    className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{
                      background: "color-mix(in srgb, var(--t-success) 12%, transparent)",
                      color: "var(--t-success)",
                    }}
                  >
                    {item.discount_percentage}% off
                  </span>
                </>
              )}
            </div>

            {/* Inline variant picker */}
            {item.has_variants && availableVariants.length > 0 && (
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: "var(--t-dim)" }}
                >
                  {groupName}
                </p>
                <div className="flex flex-col gap-2">
                  {availableVariants.map((v) => {
                    const isActive = selectedVariant?.name === v.name;
                    const effPrice = variantEffectivePrice(v);
                    return (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left"
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
                          {isActive && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ background: "var(--t-accent)" }}
                            />
                          )}
                        </div>
                        <span
                          className="flex-1 text-sm font-semibold"
                          style={{ color: "var(--t-text)" }}
                        >
                          {v.name}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: v.isVeg !== false ? "#22c55e" : "#ef4444" }}
                        />
                        <span
                          className="text-sm font-bold"
                          style={{ color: isActive ? "var(--t-accent)" : "var(--t-dim)" }}
                        >
                          {formatCurrency(effPrice, currencySymbol)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            {item.description && (
              <p className="text-sm leading-relaxed" style={{ color: "var(--t-dim)" }}>
                {item.description}
              </p>
            )}

            {/* Spice + Sugar levels */}
            {((extItem.spicy_level ?? 0) > 0 || (extItem.sugar_level ?? 0) > 0) && (
              <div className="flex gap-4">
                {(extItem.spicy_level ?? 0) > 0 && (
                  <LevelDots level={extItem.spicy_level} icon="🌶️" color="var(--t-accent)" />
                )}
                {(extItem.sugar_level ?? 0) > 0 && (
                  <LevelDots level={extItem.sugar_level} icon="🍬" color="var(--t-accent2)" />
                )}
              </div>
            )}

            {/* Attributes grid */}
            {(extItem.serves ||
              extItem.preparation_time ||
              extItem.taste_profile ||
              extItem.allergens) && (
              <div className="grid grid-cols-2 gap-2">
                {extItem.serves && (
                  <div
                    className="px-3 py-2 rounded-xl"
                    style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "var(--t-dim)" }}
                    >
                      Serves
                    </p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--t-text)" }}>
                      {extItem.serves}
                    </p>
                  </div>
                )}
                {extItem.preparation_time && (
                  <div
                    className="px-3 py-2 rounded-xl"
                    style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "var(--t-dim)" }}
                    >
                      Prep time
                    </p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--t-text)" }}>
                      {extItem.preparation_time} min
                    </p>
                  </div>
                )}
                {extItem.taste_profile && (
                  <div
                    className="px-3 py-2 rounded-xl"
                    style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "var(--t-dim)" }}
                    >
                      Taste
                    </p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--t-text)" }}>
                      {extItem.taste_profile}
                    </p>
                  </div>
                )}
                {extItem.allergens && (
                  <div
                    className="px-3 py-2 rounded-xl col-span-2"
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.15)",
                    }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "#ef4444" }}
                    >
                      Allergens
                    </p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--t-text)" }}>
                      {extItem.allergens}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Ingredients */}
            {ingredients.length > 0 && (
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: "var(--t-dim)" }}
                >
                  Ingredients
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ingredients.map((ing, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full border font-medium"
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

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background: "color-mix(in srgb, var(--t-accent) 10%, transparent)",
                      color: "var(--t-accent)",
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Similar items */}
            {similarItems.length > 0 && (
              <div>
                <p className="text-sm font-bold mb-3" style={{ color: "var(--t-text)" }}>
                  More from {item.category}
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 no-scrollbar">
                  {similarItems.map((sim) => (
                    <div key={sim._id} className="shrink-0 w-42.5">
                      <SimilarItemCard item={sim} currencySymbol={currencySymbol} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky CTA */}
        <div
          className="shrink-0 px-5 py-4 flex items-center gap-3"
          style={{ borderTop: "1px solid var(--t-line)", background: "var(--t-bg)" }}
        >
          {/* Quantity stepper */}
          <div
            className="flex items-stretch rounded-xl overflow-hidden shrink-0"
            style={{
              border: "1.5px solid var(--t-accent-40)",
              background: "var(--t-accent-10)",
              height: "52px",
            }}
          >
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex items-center justify-center transition-colors"
              style={{ width: "44px", color: "var(--t-accent)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--t-accent-20)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              aria-label="Decrease quantity"
            >
              <span style={{ fontSize: "18px", fontWeight: 700, lineHeight: 1 }}>−</span>
            </button>
            <div
              className="flex items-center justify-center"
              style={{
                minWidth: "36px",
                borderLeft: "1px solid var(--t-accent-40)",
                borderRight: "1px solid var(--t-accent-40)",
              }}
            >
              <span
                className="font-black text-base tabular-nums select-none"
                style={{ color: "var(--t-accent)" }}
              >
                {quantity}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex items-center justify-center transition-colors"
              style={{ width: "44px", color: "var(--t-accent)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--t-accent-20)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              aria-label="Increase quantity"
            >
              <span style={{ fontSize: "18px", fontWeight: 700, lineHeight: 1 }}>+</span>
            </button>
          </div>

          {/* Add to Cart button */}
          {(() => {
            const disabled =
              allVariantsUnavailable || (item.has_variants && !selectedVariant) || addLoading;
            const unitPrice =
              item.has_variants && selectedVariant
                ? variantEffectivePrice(selectedVariant)
                : (discountedPrice ?? displayPrice);
            const totalPrice = unitPrice * quantity;
            return (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={disabled}
                className="relative flex-1 flex items-center justify-center gap-2 rounded-xl font-bold text-white text-sm tracking-wide transition-all active:scale-[0.98]"
                style={{
                  background: disabled && !addLoading ? "var(--t-line)" : "var(--t-accent)",
                  boxShadow: disabled ? "none" : "0 4px 14px var(--t-accent-40)",
                  height: "52px",
                  opacity: allVariantsUnavailable ? 0.55 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                {addLoading ? (
                  <span
                    className="w-5 h-5 rounded-full border-2 animate-spin"
                    style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
                  />
                ) : allVariantsUnavailable ? (
                  "Unavailable"
                ) : item.has_variants && !selectedVariant ? (
                  "Select an option"
                ) : (
                  `Add to Cart · ${formatCurrency(totalPrice, currencySymbol)}`
                )}
              </button>
            );
          })()}
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(content, document.body);
}
