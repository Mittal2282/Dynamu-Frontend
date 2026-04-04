import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import LazyImage from "../../components/ui/LazyImage";
import { VegBadge } from "../../components/ui/Badge";
import CartControl from "../../components/customer/CartControl";
import {
  cartStore,
  useCartItems,
  useCartCount,
} from "../../store/cartStore";
import { restaurantStore } from "../../store/restaurantStore";
import { formatCurrency } from "../../utils/formatters";

const SERVICE_CHARGE = 10;
const TAX_RATE = 0.05;

// ── Cart item row ─────────────────────────────────────────────────────────────
function CartItem({ item, currencySymbol }) {
  const effectivePrice =
    item.discount_percentage > 0
      ? item.price * (1 - item.discount_percentage / 100)
      : item.price;
  const lineTotal = effectivePrice * item.qty;

  const [instructionOpen, setInstructionOpen] = useState(false);
  const [draft, setDraft] = useState(item.instruction || "");

  useEffect(() => {
    setDraft(item.instruction || "");
  }, [item.instruction]);

  const handleSave = () => {
    cartStore.getState().setInstruction(item._id ?? item.id, draft.trim());
    setInstructionOpen(false);
  };

  const handleCancel = () => {
    setDraft(item.instruction || "");
    setInstructionOpen(false);
  };

  return (
    <div
      className="flex items-start gap-4 p-4 rounded-2xl border transition-colors"
      style={{ background: "var(--t-surface)", borderColor: "var(--t-line)" }}
    >
      <div className="relative shrink-0 self-start overflow-hidden rounded-xl">
        <LazyImage
          src={item.image_url}
          alt={item.name}
          containerClassName="w-[88px] h-[88px] md:w-[100px] md:h-[100px] rounded-xl overflow-hidden"
          imgClassName="w-full h-full object-cover"
          placeholder={
            <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--t-float)" }}>
              <span className="text-3xl">{item.is_veg ? "🥗" : "🍗"}</span>
            </div>
          }
        />
        <div className="absolute top-1.5 left-1.5 p-[3px] rounded-sm bg-white/90 shadow-sm">
          <VegBadge isVeg={item.is_veg} size="sm" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm md:text-base text-white leading-snug">{item.name}</p>
        {item.description && (
          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "rgba(245,246,250,0.55)" }}>
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1.5">
          {item.discount_percentage > 0 ? (
            <>
              <span className="font-bold text-sm" style={{ color: "var(--t-accent)" }}>
                {formatCurrency(effectivePrice, currencySymbol)}
              </span>
              <span className="line-through text-xs" style={{ color: "var(--t-dim)" }}>
                {formatCurrency(item.price, currencySymbol)}
              </span>
              <span className="text-[10px] font-semibold bg-green-500/15 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full">
                {item.discount_percentage}% OFF
              </span>
            </>
          ) : (
            <span className="font-bold text-sm" style={{ color: "var(--t-accent)" }}>
              {formatCurrency(item.price, currencySymbol)}
            </span>
          )}
        </div>

        {/* Inline Instruction */}
        <div className="mt-2">
          {instructionOpen ? (
            <div className="flex flex-col gap-1.5">
              <textarea
                autoFocus
                rows={2}
                maxLength={150}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="e.g. No sugar, extra spicy, sauce on the side..."
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[var(--t-accent)] transition-colors placeholder:text-white/30 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer active:scale-[0.98]"
                  style={{ background: "var(--t-accent)", color: "#fff" }}
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer active:scale-[0.98]"
                  style={{ color: "var(--t-dim)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : item.instruction ? (
            <button
              onClick={() => setInstructionOpen(true)}
              className="flex items-center gap-1.5 text-xs cursor-pointer hover:opacity-80"
              style={{ color: "var(--t-accent)" }}
            >
              <span>✏️</span>
              <span className="italic opacity-80">"{item.instruction}"</span>
            </button>
          ) : (
            <button
              onClick={() => setInstructionOpen(true)}
              className="text-xs px-2.5 py-1 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              style={{ color: "var(--t-dim)" }}
            >
              + Add note
            </button>
          )}
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-2">
        <CartControl item={item} />
        <span className="text-xs font-semibold" style={{ color: "var(--t-dim)" }}>
          = {formatCurrency(lineTotal, currencySymbol)}
        </span>
      </div>
    </div>
  );
}

// ── Bill row ──────────────────────────────────────────────────────────────────
function BillRow({ label, value, bold, accent }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span
        className={`text-sm ${bold ? "font-bold text-white" : ""}`}
        style={!bold ? { color: "var(--t-dim)" } : {}}
      >
        {label}
      </span>
      <span
        className={`text-sm font-bold ${bold ? "text-lg" : ""}`}
        style={{ color: accent ? "var(--t-accent)" : bold ? "var(--t-text)" : "var(--t-dim)" }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Main cart page ────────────────────────────────────────────────────────────
export default function CustomerCartPage() {
  const navigate = useNavigate();
  const { basePath, onPlaceOrder, orderingCart } = useOutletContext();
  const items = useCartItems();
  const count = useCartCount();
  const { currencySymbol, name } = restaurantStore();

  const subtotal = items.reduce((s, i) => {
    const p =
      i.discount_percentage > 0
        ? i.price * (1 - i.discount_percentage / 100)
        : i.price;
    return s + p * i.qty;
  }, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + SERVICE_CHARGE + tax;

  return (
    <div className="flex-1 pb-12" style={{ backgroundColor: "color-mix(in srgb, var(--t-bg) 96%, black)" }}>
      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 pt-6">

        {/* ── Breadcrumbs ────────────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 mb-6 text-sm" aria-label="Breadcrumb">
          <button
            onClick={() => navigate(basePath)}
            className="transition-colors cursor-pointer hover:text-white"
            style={{ color: "var(--t-dim)" }}
          >
            Home
          </button>
          <span style={{ color: "var(--t-line)" }}>›</span>
          <button
            onClick={() => navigate(`${basePath}/menu`)}
            className="transition-colors cursor-pointer hover:text-white"
            style={{ color: "var(--t-dim)" }}
          >
            Menu
          </button>
          <span style={{ color: "var(--t-line)" }}>›</span>
          <span className="font-semibold text-white">Cart</span>
        </nav>

        {/* ── Page title ─────────────────────────────────────────────────── */}
        <div className="flex items-baseline gap-3 mb-6">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white">
            Your Cart
          </h1>
          {count > 0 && (
            <span
              className="text-sm font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "var(--t-accent-20)", color: "var(--t-accent)" }}
            >
              {count} {count === 1 ? "item" : "items"}
            </span>
          )}
        </div>

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <span className="text-6xl">🛒</span>
            <p className="text-xl font-bold text-white">Your cart is empty</p>
            <p className="text-sm" style={{ color: "var(--t-dim)" }}>
              Browse the menu and add something delicious
            </p>
            <button
              onClick={() => navigate(`${basePath}/menu`)}
              className="mt-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer"
              style={{ background: "var(--t-accent)", color: "#fff" }}
            >
              Browse Menu →
            </button>
          </div>
        )}

        {items.length > 0 && (
          <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:items-start">

            {/* ── Items list ─────────────────────────────────────────────── */}
            <div className="space-y-3 mb-6 lg:mb-0">
              <p
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: "var(--t-dim)" }}
              >
                Items Selected
              </p>
              {items.map((item) => (
                <CartItem
                  key={item._id ?? item.id}
                  item={item}
                  currencySymbol={currencySymbol}
                />
              ))}

              <button
                onClick={() => navigate(`${basePath}/menu`)}
                className="w-full mt-2 py-3 rounded-xl border text-sm font-semibold transition-all hover:bg-white/5 active:scale-[0.99] cursor-pointer"
                style={{ borderColor: "var(--t-line)", color: "var(--t-dim)" }}
              >
                + Add More Items
              </button>
            </div>

            {/* ── Bill summary ───────────────────────────────────────────── */}
            <div className="lg:sticky lg:top-24">
              <div
                className="rounded-2xl border p-5"
                style={{ background: "var(--t-surface)", borderColor: "var(--t-line)" }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-1"
                  style={{ color: "var(--t-dim)" }}
                >
                  Bill Summary
                </p>
                {name && (
                  <p className="text-xs mb-4" style={{ color: "var(--t-dim)" }}>
                    {name}
                  </p>
                )}

                <div
                  className="border-t"
                  style={{ borderColor: "var(--t-line)" }}
                >
                  <BillRow
                    label="Subtotal"
                    value={formatCurrency(subtotal, currencySymbol, 2)}
                  />
                  <BillRow
                    label="Service Charge"
                    value={formatCurrency(SERVICE_CHARGE, currencySymbol, 2)}
                  />
                  <BillRow
                    label="Estimated Taxes (5%)"
                    value={formatCurrency(tax, currencySymbol, 2)}
                  />
                  <div
                    className="border-t mt-1 pt-1"
                    style={{ borderColor: "var(--t-line)" }}
                  >
                    <BillRow
                      label="Total Amount"
                      value={formatCurrency(total, currencySymbol, 2)}
                      bold
                      accent
                    />
                  </div>
                </div>

                <button
                  onClick={onPlaceOrder}
                  disabled={orderingCart}
                  className="w-full mt-4 py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  style={{
                    background: "var(--t-accent)",
                    color: "#fff",
                    boxShadow: "0 8px 32px var(--t-accent-40)",
                  }}
                >
                  {orderingCart ? "Placing Order…" : "Place Order →"}
                </button>

                <p
                  className="text-center text-xs mt-3"
                  style={{ color: "var(--t-dim)" }}
                >
                  Items will be prepared once you place the order
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
