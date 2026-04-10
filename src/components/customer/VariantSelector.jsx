import { useState } from "react";
import { formatCurrency } from "../../utils/formatters";
import { variantEffectivePrice } from "../../utils/vegStatus";

/**
 * Shared variant selection UI used inside VariantDrawer (mobile + desktop popup).
 *
 * Props:
 *   item           — MenuItem object with variants[]
 *   currencySymbol — e.g. "₹"
 *   onAdd(variant) — called with the selected variant object when user confirms
 */
export default function VariantSelector({ item, currencySymbol, onAdd }) {
  // Show ALL variants; filter available ones for default selection
  const allVariants = item.variants ?? [];
  const availableVariants = allVariants.filter(v => v.isAvailable !== false);

  const defaultVariant = availableVariants.find((v) => v.isDefault) ?? availableVariants[0] ?? null;
  const [selected, setSelected] = useState(defaultVariant);

  if (!item.variants?.length) return null;

  const groupName = allVariants[0]?.groupName ?? "Options";

  return (
    <div className="flex flex-col gap-1">
      <p
        className="text-[11px] font-semibold uppercase tracking-wider mb-1"
        style={{ color: "var(--t-dim)" }}
      >
        {groupName}
      </p>
      <div className="flex flex-col gap-1.5">
        {allVariants.map((v) => {
          const isUnavailable = v.isAvailable === false;
          const isActive   = !isUnavailable && selected?.name === v.name;
          const effPrice   = variantEffectivePrice(v);
          const hasVDisc   = (v.discount_percentage ?? 0) > 0;
          return (
            <button
              key={v.name}
              type="button"
              onClick={() => !isUnavailable && setSelected(v)}
              disabled={isUnavailable}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all text-left"
              style={{
                borderColor: isUnavailable
                  ? "var(--t-line)"
                  : isActive ? "var(--t-accent)" : "var(--t-line)",
                background: isUnavailable
                  ? "var(--t-float)"
                  : isActive
                    ? "color-mix(in srgb, var(--t-accent) 10%, transparent)"
                    : "var(--t-surface)",
                opacity: isUnavailable ? 0.55 : 1,
                cursor: isUnavailable ? "not-allowed" : "pointer",
              }}
            >
              {/* Radio indicator */}
              <div
                className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                style={{ borderColor: isActive ? "var(--t-accent)" : "var(--t-line)" }}
              >
                {isActive && (
                  <div className="w-2 h-2 rounded-full" style={{ background: "var(--t-accent)" }} />
                )}
              </div>

              {/* Variant name */}
              <span
                className="flex-1 text-sm font-semibold"
                style={{ color: isUnavailable ? "var(--t-dim)" : isActive ? "#fff" : "rgba(245,246,250,0.8)" }}
              >
                {v.name}
              </span>

              {/* Veg/non-veg dot */}
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: v.isVeg !== false ? "#22c55e" : "#ef4444" }}
              />

              {/* Unavailable tag OR price */}
              {isUnavailable ? (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: "rgba(239,68,68,0.12)",
                    color: "#f87171",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  Unavailable
                </span>
              ) : (
                /* Price (effective + optional strikethrough original) */
                <div className="flex flex-col items-end shrink-0">
                  <span
                    className="text-sm font-black leading-tight"
                    style={{ color: isActive ? "var(--t-accent)" : "var(--t-dim)" }}
                  >
                    {formatCurrency(effPrice, currencySymbol)}
                  </span>
                  {hasVDisc && (
                    <span
                      className="text-[10px] line-through leading-tight"
                      style={{ color: "var(--t-dim)", opacity: 0.55 }}
                    >
                      {formatCurrency(v.price, currencySymbol)}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Add to Cart button */}
      <button
        type="button"
        onClick={() => selected && onAdd(selected)}
        disabled={!selected}
        className="mt-4 w-full py-3 rounded-xl font-bold text-white text-sm tracking-wide transition-all active:scale-[0.98]"
        style={{
          background: selected ? "var(--t-accent)" : "var(--t-line)",
          boxShadow: selected ? "0 4px 14px var(--t-accent-40)" : "none",
          opacity: selected ? 1 : 0.5,
          cursor: selected ? "pointer" : "not-allowed",
        }}
      >
        {selected ? (
          <>
            Add to Cart
            <span className="ml-2 font-black">
              · {formatCurrency(variantEffectivePrice(selected), currencySymbol)}
            </span>
          </>
        ) : (
          "All options unavailable"
        )}
      </button>
    </div>
  );
}
