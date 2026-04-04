import CartControl from "./CartControl";
import { VegBadge } from "../ui/Badge";
import LazyImage from "../ui/LazyImage";
import { formatCurrency } from "../../utils/formatters";

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

// ── Menu item card (horizontal layout — image left, details right) ─────────────
export default function MenuItemCard({ item, currencySymbol }) {
  const hasDiscount = item.discount_percentage > 0;
  const discountedPrice = hasDiscount
    ? Math.round(item.price * (1 - item.discount_percentage / 100))
    : null;

  // Ingredients — support both array and comma-separated string
  const rawIngredients = item.ingredients;
  const ingredients = Array.isArray(rawIngredients)
    ? rawIngredients
    : typeof rawIngredients === "string" && rawIngredients.trim()
      ? rawIngredients
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const spicyLevel =
    item.spicy_level != null && item.spicy_level > 0 ? item.spicy_level : null;
  const sugarLevel =
    item.sugar_level != null && item.sugar_level > 0 ? item.sugar_level : null;

  return (
    <div
      className="rounded-2xl overflow-hidden border transition-transform duration-150 active:scale-[0.99]"
      style={{ background: "var(--t-surface)", borderColor: "var(--t-line)" }}
    >
      <div className="p-3 flex gap-3">
        {/* ── Image ──────────────────────────────────────────────────────── */}
        <div className="relative shrink-0 self-start overflow-hidden rounded-xl">
          <LazyImage
            src={item.image_url}
            alt={item.name}
            containerClassName="w-[88px] h-[88px] md:w-[100px] md:h-[100px] rounded-xl overflow-hidden"
            imgClassName="w-full h-full object-cover"
            placeholder={
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "var(--t-float)" }}
              >
                <span className="text-3xl">{item.is_veg ? "🥗" : "🍗"}</span>
              </div>
            }
          />
          {/* Veg / Non-veg dot */}
          <div className="absolute top-1.5 left-1.5 p-[3px] rounded-sm bg-white/90 shadow-sm">
            <VegBadge isVeg={item.is_veg} size="sm" />
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="font-bold text-sm md:text-base leading-snug" style={{ color: "#ffffff" }}>
            {item.name}
          </h3>

          {item.description && (
            <p
              className="text-[11px] mt-0.5 leading-relaxed line-clamp-2"
              style={{ color: "rgba(245,246,250,0.6)" }}
            >
              {item.description}
            </p>
          )}

          {/* Spice + Sugar level dots */}
          {(spicyLevel !== null || sugarLevel !== null) && (
            <div className="flex gap-3 mt-1.5">
              {spicyLevel !== null && (
                <LevelDots
                  level={spicyLevel}
                  icon="🌶️"
                  color="var(--t-accent)"
                />
              )}
              {sugarLevel !== null && (
                <LevelDots
                  level={sugarLevel}
                  icon="🍬"
                  color="var(--t-accent2)"
                />
              )}
            </div>
          )}

          {/* Pricing + Cart control */}
          <div className="mt-auto pt-2 flex items-center justify-between gap-2">
            <div className="flex items-end gap-2 pr-3 mt-1.5 min-h-[32px]">
              <div
                className="font-black text-sm"
                style={{ color: "var(--t-accent)" }}
              >
                {formatCurrency(
                  discountedPrice ?? item.price_label ?? item.price,
                  currencySymbol,
                )}
              </div>
              {hasDiscount && (
                <div className="flex flex-col items-start gap-1">
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded-md border uppercase leading-none tracking-tight"
                    style={{
                      background:
                        "color-mix(in srgb, var(--t-success) 12%, transparent)",
                      borderColor:
                        "color-mix(in srgb, var(--t-success) 20%, transparent)",
                      color: "var(--t-success)",
                    }}
                  >
                    {item.discount_percentage}% off
                  </span>
                  <span
                    className="text-[10px] line-through opacity-70 ml-1 leading-none"
                    style={{ color: "var(--t-dim)" }}
                  >
                    {formatCurrency(item.price, currencySymbol)}
                  </span>
                </div>
              )}
              <span
                className="text-[9px] mb-0.5"
                style={{ color: "var(--t-dim)" }}
              >
                incl. GST
              </span>
            </div>
            <div className="shrink-0">
              <CartControl item={item} />
            </div>
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
    </div>
  );
}
