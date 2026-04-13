import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import LazyImage from "../ui/LazyImage";
import { VegBadge } from "../ui/Badge";
import CartControl from "./CartControl";
import VariantDrawer from "./VariantDrawer";
import { LevelDots } from "./MenuItemCard";
import { restaurantStore } from "../../store/restaurantStore";
import { formatCurrency } from "../../utils/formatters";
import { getItemVegStatus, variantEffectivePrice } from "../../utils/vegStatus";

/* ─── Lightweight card for similar items (avoids circular import) ─────────────── */
function SimilarItemCard({ item, currencySymbol }) {
  const [variantDrawerOpen, setVariantDrawerOpen] = useState(false);

  const availableVariants = item.has_variants
    ? (item.variants ?? []).filter((v) => v.isAvailable !== false)
    : [];
  const allVariantsUnavailable = item.has_variants && availableVariants.length === 0;
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
        <div className="absolute top-1.5 left-1.5 p-[3px] rounded-sm bg-white/90 shadow-sm">
          <VegBadge isVeg={vegStatus === "mixed" ? "mixed" : vegStatus === "veg"} size="sm" />
        </div>
      </div>

      {/* Details */}
      <div className="p-2.5 flex flex-col flex-1 gap-2">
        <p className="text-xs font-bold text-white leading-snug line-clamp-2">{item.name}</p>

        {/* Price */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.has_variants && (
            <span className="text-[9px]" style={{ color: "var(--t-dim)" }}>from</span>
          )}
          <span
            className="text-xs font-black"
            style={{ color: "var(--t-accent)" }}
          >
            {formatCurrency(discountedPrice ?? item.price_label ?? displayPrice, currencySymbol)}
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
              {allVariantsUnavailable ? "Unavailable" : (
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
export default function MenuItemDetailDrawer({ item, onClose }) {
  const [variantDrawerOpen, setVariantDrawerOpen] = useState(false);
  const { currencySymbol, menu } = restaurantStore();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!item) return null;

  const vegStatus = getItemVegStatus(item);
  const availableVariants = item.has_variants
    ? (item.variants ?? []).filter((v) => v.isAvailable !== false)
    : [];
  const allVariantsUnavailable = item.has_variants && availableVariants.length === 0;
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

  const rawIngredients = item.ingredients;
  const ingredients = Array.isArray(rawIngredients)
    ? rawIngredients
    : typeof rawIngredients === "string" && rawIngredients.trim()
      ? rawIngredients.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  const tags =
    typeof item.tags === "string" && item.tags.trim()
      ? item.tags.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  const similarItems = Object.values(menu ?? {})
    .flat()
    .filter((m) => m.category === item.category && m._id !== item._id && m.is_available !== false)
    .slice(0, 6);

  const content = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.65)" }}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
        style={{
          background: "var(--t-bg)",
          maxHeight: "92vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--t-line)" }} />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer z-10 transition-colors"
          style={{ background: "var(--t-float)", color: "var(--t-dim)" }}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          {/* Hero image */}
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
            <div className="absolute top-3 left-3 p-1 rounded-md bg-white/90 shadow">
              <VegBadge isVeg={vegStatus === "mixed" ? "mixed" : vegStatus === "veg"} size="md" />
            </div>
          </div>

          <div className="px-5 pt-4 pb-6 space-y-4">
            {/* Name + badges */}
            <div>
              <h2 className="text-xl font-bold text-white leading-snug">{item.name}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {item.category && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "var(--t-float)", color: "var(--t-dim)", border: "1px solid var(--t-line)" }}
                  >
                    {item.category}
                  </span>
                )}
                {item.meal_tag && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "color-mix(in srgb, var(--t-accent) 12%, transparent)", color: "var(--t-accent)" }}
                  >
                    {item.meal_tag}
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
                <span className="text-sm" style={{ color: "var(--t-dim)" }}>from</span>
              )}
              <span className="text-2xl font-black" style={{ color: "var(--t-accent)" }}>
                {formatCurrency(discountedPrice ?? item.price_label ?? displayPrice, currencySymbol)}
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

            {/* Description */}
            {item.description && (
              <p className="text-sm leading-relaxed" style={{ color: "rgba(245,246,250,0.7)" }}>
                {item.description}
              </p>
            )}

            {/* Spice + Sugar levels */}
            {(item.spicy_level > 0 || item.sugar_level > 0) && (
              <div className="flex gap-4">
                {item.spicy_level > 0 && (
                  <LevelDots level={item.spicy_level} icon="🌶️" color="var(--t-accent)" />
                )}
                {item.sugar_level > 0 && (
                  <LevelDots level={item.sugar_level} icon="🍬" color="var(--t-accent2)" />
                )}
              </div>
            )}

            {/* Attributes grid */}
            {(item.serves || item.preparation_time || item.taste_profile || item.allergens) && (
              <div className="grid grid-cols-2 gap-2">
                {item.serves && (
                  <div
                    className="px-3 py-2 rounded-xl"
                    style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--t-dim)" }}>
                      Serves
                    </p>
                    <p className="text-sm font-semibold text-white mt-0.5">{item.serves}</p>
                  </div>
                )}
                {item.preparation_time && (
                  <div
                    className="px-3 py-2 rounded-xl"
                    style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--t-dim)" }}>
                      Prep time
                    </p>
                    <p className="text-sm font-semibold text-white mt-0.5">{item.preparation_time} min</p>
                  </div>
                )}
                {item.taste_profile && (
                  <div
                    className="px-3 py-2 rounded-xl"
                    style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--t-dim)" }}>
                      Taste
                    </p>
                    <p className="text-sm font-semibold text-white mt-0.5">{item.taste_profile}</p>
                  </div>
                )}
                {item.allergens && (
                  <div
                    className="px-3 py-2 rounded-xl col-span-2"
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#ef4444" }}>
                      Allergens
                    </p>
                    <p className="text-sm font-semibold text-white mt-0.5">{item.allergens}</p>
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
                      style={{ borderColor: "var(--t-line)", color: "var(--t-dim)", background: "var(--t-float)" }}
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
                <p className="text-sm font-bold text-white mb-3">More from {item.category}</p>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 no-scrollbar">
                  {similarItems.map((sim) => (
                    <div key={sim._id} className="shrink-0 w-[170px]">
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
          className="shrink-0 px-5 py-4"
          style={{ borderTop: "1px solid var(--t-line)", background: "var(--t-bg)" }}
        >
          {!item.has_variants ? (
            <CartControl item={item} />
          ) : (
            <button
              type="button"
              onClick={() => !allVariantsUnavailable && setVariantDrawerOpen(true)}
              disabled={allVariantsUnavailable}
              className="w-full flex items-center justify-center gap-2 rounded-xl font-bold text-white text-sm tracking-wide transition-all active:scale-95 cursor-pointer"
              style={{
                background: allVariantsUnavailable ? "var(--t-line)" : "var(--t-accent)",
                boxShadow: allVariantsUnavailable ? "none" : "0 4px 14px var(--t-accent-40)",
                height: "48px",
                opacity: allVariantsUnavailable ? 0.55 : 1,
                cursor: allVariantsUnavailable ? "not-allowed" : "pointer",
              }}
            >
              {allVariantsUnavailable ? "Unavailable" : (
                <>
                  <span style={{ fontSize: "16px", fontWeight: 900 }}>+</span>
                  Choose Options
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Variant drawer (for variant items) */}
      {item.has_variants && (
        <VariantDrawer
          item={item}
          open={variantDrawerOpen}
          onClose={() => setVariantDrawerOpen(false)}
          currencySymbol={currencySymbol}
        />
      )}
    </>
  );

  return ReactDOM.createPortal(content, document.body);
}
