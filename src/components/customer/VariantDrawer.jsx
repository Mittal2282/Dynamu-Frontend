import { useEffect } from "react";
import ReactDOM from "react-dom";
import { cartStore } from "../../store/cartStore";
import { syncCart } from "../../services/customerService";
import LazyImage from "../ui/LazyImage";
import VariantSelector from "./VariantSelector";
import { getItemVegStatus, variantEffectivePrice } from "../../utils/vegStatus";

/**
 * Variant selection popup rendered via ReactDOM.createPortal into document.body.
 *
 * Rendering inside a portal means this component's DOM is completely OUTSIDE
 * MenuItemCard's tree, so click events here can never bubble to the card.
 *
 * - Mobile (< md): bottom sheet slides up
 * - Desktop/Tablet (≥ md): centered modal popup
 */
export default function VariantDrawer({ item, open, onClose, currencySymbol }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!item) return null;

  const vegStatus = getItemVegStatus(item);

  const handleAdd = async (variant) => {
    // Bake the effective (post-discount) price into selectedVariant.price so the
    // cart and cart total always reflect the discounted amount.
    const effectiveVariant = { ...variant, price: variantEffectivePrice(variant) };
    cartStore.getState().add({ ...item, selectedVariant: effectiveVariant });
    onClose();
    try {
      await syncCart(Object.values(cartStore.getState().cart));
    } catch { /* silently fail — layout useEffect will retry */ }
  };

  const itemHeader = (
    <div className="flex gap-3 mb-5">
      <div className="shrink-0 overflow-hidden rounded-xl">
        <LazyImage
          src={item.image_url}
          alt={item.name}
          containerClassName="w-[72px] h-[72px] rounded-xl overflow-hidden"
          imgClassName="w-full h-full object-cover"
          placeholder={
            <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--t-float)" }}>
              <span className="text-2xl">{vegStatus !== 'nonveg' ? "🥗" : "🍗"}</span>
            </div>
          }
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-base text-white leading-snug">{item.name}</h3>
        {item.description && (
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "rgba(245,246,250,0.55)" }}>
            {item.description}
          </p>
        )}
      </div>
    </div>
  );

  const content = (
    <>
      {/* ── Shared backdrop ─────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: "rgba(0,0,0,0.6)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s",
        }}
        onClick={onClose}
      />

      {/* ── Mobile: bottom sheet (< md) ──────────────────────────────────── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl"
        style={{
          background: "var(--t-bg)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s ease-out",
          maxHeight: "85vh",
          overflowY: "auto",
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--t-line)" }} />
        </div>
        <div className="px-5 pb-8 pt-2">
          {itemHeader}
          <VariantSelector item={item} currencySymbol={currencySymbol} onAdd={handleAdd} />
        </div>
      </div>

      {/* ── Desktop/Tablet: centered popup (≥ md) ───────────────────────── */}
      {/* Outer div: clicking the padding area (outside dialog) closes the popup */}
      <div
        className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-6"
        style={{ pointerEvents: open ? "auto" : "none" }}
        onClick={onClose}
      >
        {/* Inner dialog: clicks here do NOT close the popup */}
        <div
          className="w-full max-w-sm rounded-2xl shadow-2xl flex flex-col"
          style={{
            background: "var(--t-bg)",
            borderTop: "2.5px solid var(--t-accent)",
            opacity: open ? 1 : 0,
            transform: open ? "scale(1)" : "scale(0.95)",
            transition: "opacity 0.2s, transform 0.2s",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10 shrink-0">
            <h3 className="text-white font-bold text-base leading-none">Customise</h3>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors text-sm cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          {/* Body */}
          <div className="px-5 pb-6 pt-4 overflow-y-auto">
            {itemHeader}
            <VariantSelector item={item} currencySymbol={currencySymbol} onAdd={handleAdd} />
          </div>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(content, document.body);
}
