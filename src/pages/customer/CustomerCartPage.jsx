import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import LazyImage from "../../components/ui/LazyImage";
import { VegBadge } from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Text from "../../components/ui/Text";
import {
  cartStore,
  useCartItems,
  useCartCount,
} from "../../store/cartStore";
import { restaurantStore } from "../../store/restaurantStore";
import { formatCurrency } from "../../utils/formatters";

const SERVICE_CHARGE = 10;
const TAX_RATE = 0.05;

// ── Stepper ───────────────────────────────────────────────────────────────────
function Stepper({ qty, onAdd, onRemove }) {
  return (
    <div
      className="flex items-center gap-0 rounded-xl overflow-hidden shrink-0"
      style={{ border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <button
        onClick={onRemove}
        className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 text-lg font-bold transition-colors active:scale-90 cursor-pointer"
        aria-label="Remove one"
      >
        −
      </button>
      <span className="w-9 text-center text-sm font-bold text-white select-none" style={{ lineHeight: "2.25rem" }}>
        {String(qty).padStart(2, "0")}
      </span>
      <button
        onClick={onAdd}
        className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 text-lg font-bold transition-colors active:scale-90 cursor-pointer"
        aria-label="Add one"
      >
        +
      </button>
    </div>
  );
}

// ── Cart item row ─────────────────────────────────────────────────────────────
function CartItem({ item, onAdd, onRemove, onEditInstruction, currencySymbol }) {
  const effectivePrice =
    item.discount_percentage > 0
      ? item.price * (1 - item.discount_percentage / 100)
      : item.price;
  const lineTotal = effectivePrice * item.qty;

  return (
    <div
      className="flex items-start gap-4 p-4 rounded-2xl border transition-colors"
      style={{ background: "var(--t-surface)", borderColor: "var(--t-line)" }}
    >
      <div className="relative shrink-0">
        <LazyImage
          src={item.image_url}
          alt={item.name}
          containerClassName="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-white/5"
          placeholder={
            <div className="w-full h-full flex items-center justify-center bg-white/5">
              <span className="text-2xl">{item.is_veg ? "🥗" : "🍗"}</span>
            </div>
          }
        />
        <div className="absolute -top-1 -left-1 p-[3px] rounded-sm bg-white/90 shadow-sm">
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

        {/* Instruction */}
        {item.instruction ? (
          <button
            onClick={() => onEditInstruction(item)}
            className="mt-2 flex items-center gap-1.5 text-xs cursor-pointer hover:opacity-80"
            style={{ color: "var(--t-accent)" }}
          >
            <span>✏️</span>
            <span className="italic opacity-80">"{item.instruction}"</span>
          </button>
        ) : (
          <button
            onClick={() => onEditInstruction(item)}
            className="mt-2 text-xs px-2.5 py-1 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            style={{ color: "var(--t-dim)" }}
          >
            + Add note
          </button>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end gap-2">
        <Stepper
          qty={item.qty}
          onAdd={() => onAdd(item)}
          onRemove={() => onRemove(item)}
        />
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
  const { add, remove } = cartStore();
  const { currencySymbol, name } = restaurantStore();

  const [instructionModalOpen, setInstructionModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [instructionText, setInstructionText] = useState("");

  const subtotal = items.reduce((s, i) => {
    const p =
      i.discount_percentage > 0
        ? i.price * (1 - i.discount_percentage / 100)
        : i.price;
    return s + p * i.qty;
  }, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + SERVICE_CHARGE + tax;

  const handleEditInstruction = (item) => {
    setActiveItem(item);
    setInstructionText(item.instruction || "");
    setInstructionModalOpen(true);
  };

  const handleSaveInstruction = () => {
    if (activeItem) {
      cartStore.getState().setInstruction(activeItem._id ?? activeItem.id, instructionText.trim());
    }
    setInstructionModalOpen(false);
  };

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
                  onAdd={add}
                  onRemove={remove}
                  onEditInstruction={handleEditInstruction}
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

      {/* ── Instruction modal ────────────────────────────────────────────────── */}
      <Modal
        isOpen={instructionModalOpen}
        onClose={() => setInstructionModalOpen(false)}
        title="Add Special Instruction"
      >
        <div className="flex flex-col gap-4">
          <Text as="p" size="sm" color="white" className="opacity-70">
            Any requests for the kitchen regarding{" "}
            <strong>{activeItem?.name}</strong>?
          </Text>
          <textarea
            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[var(--t-accent)] transition-colors placeholder:text-white/30 resize-none"
            rows={3}
            maxLength={150}
            placeholder="e.g. No sugar, extra spicy, sauce on the side..."
            value={instructionText}
            onChange={(e) => setInstructionText(e.target.value)}
          />
          <Button variant="primary" fullWidth onClick={handleSaveInstruction} className="mt-2">
            Save Instruction
          </Button>
        </div>
      </Modal>
    </div>
  );
}
