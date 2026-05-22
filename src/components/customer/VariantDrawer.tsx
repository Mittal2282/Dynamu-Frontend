import ReactDOM from "react-dom";
import { syncCart } from "../../services/customerService";
import { cartStore } from "../../store/cartStore";
import type { MenuItem, Variant } from "../../types/menu";
import { getItemVegStatus, variantEffectivePrice } from "../../utils/vegStatus";
import Drawer from "../ui/Drawer";
import LazyImage from "../ui/LazyImage";
import VariantSelector from "./VariantSelector";

interface VariantDrawerProps {
  item: MenuItem;
  open: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export default function VariantDrawer({ item, open, onClose, currencySymbol }: VariantDrawerProps) {
  if (!item) return null;

  const vegStatus = getItemVegStatus(item);

  const handleAdd = async (variant: Variant & { groupName?: string }) => {
    const effectiveVariant = { ...variant, price: variantEffectivePrice(variant) };
    cartStore.getState().add({ ...item, selectedVariant: effectiveVariant, qty: 0 });
    onClose();
    cartStore.getState().setSyncing(true);
    try {
      await syncCart(Object.values(cartStore.getState().cart));
    } catch { /* silently fail */ }
    finally { cartStore.getState().setSyncing(false); }
  };

  const content = (
    <Drawer isOpen={open} onClose={onClose}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-2 pb-4 border-b shrink-0" style={{ borderColor: "var(--t-line)" }}>
        <div className="flex items-start justify-between">
          <div className="flex gap-3 items-center min-w-0 flex-1 pr-3">
            <div className="shrink-0 overflow-hidden rounded-xl">
              <LazyImage
                src={item.image_url}
                alt={item.name}
                containerClassName="w-[52px] h-[52px] rounded-xl overflow-hidden"
                imgClassName="w-full h-full object-cover"
                placeholder={
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--t-float)" }}>
                    <span className="text-xl">{vegStatus !== "nonveg" ? "🥗" : "🍗"}</span>
                  </div>
                }
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold leading-snug line-clamp-1" style={{ color: "var(--t-text)" }}>
                {item.name}
              </h2>
              {item.description && (
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--t-dim)" }}>
                  {item.description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors text-lg mt-0.5 cursor-pointer active:scale-95 shrink-0"
            style={{ color: "var(--t-dim)" }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Variant selector ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <VariantSelector item={item} currencySymbol={currencySymbol} onAdd={handleAdd} />
      </div>
    </Drawer>
  );

  // Wrap in a stopPropagation div so React's synthetic event bubbling
  // from this portal never reaches MenuItemCard's onClick (which opens the detail drawer).
  return ReactDOM.createPortal(
    <div onClick={(e) => e.stopPropagation()}>{content}</div>,
    document.body,
  );
}
