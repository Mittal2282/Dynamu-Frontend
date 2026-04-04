import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { getCartSuggestions } from "../services/customerService";
import { cartStore } from "../store/cartStore";
import { restaurantStore } from "../store/restaurantStore";
import { formatCurrency } from "../utils/formatters";
import CartControl from "./customer/CartControl";
import { VegBadge } from "./ui/Badge";
import Button from "./ui/Button";
import Drawer from "./ui/Drawer";
import LazyImage from "./ui/LazyImage";
import Modal from "./ui/Modal";
import Text from "./ui/Text";

/* ─── Constants ────────────────────────────────────────────────────────────── */
const SERVICE_CHARGE = 10; // fixed ₹10
const TAX_RATE = 0.05; // 5 %

/* ─── Cart item row ────────────────────────────────────────────────────────── */
function CartItem({ item, onAddInstruction, currencySymbol }) {
  return (
    <div className="border-b border-white/5 last:border-0 py-1 first:pt-2">
      <div className="flex items-start gap-3 p-3 -mx-3 hover:bg-white/5 rounded-2xl transition-colors group">
        <VegBadge isVeg={item.is_veg} className="mt-1 shrink-0" />

        <LazyImage
          src={item.image_url}
          alt={item.name}
          containerClassName="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0 flex items-center justify-center"
          placeholder={
            <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-slate-400 px-1 text-center">
                No image available
              </span>
            </div>
          }
        />

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <Text
            as="p"
            size="sm"
            weight="semibold"
            color="white"
            className="leading-snug"
          >
            {item.name}
          </Text>
          {item.description && (
            <Text
              as="p"
              size="xs"
              color="white"
              className="opacity-40 mt-0.5 line-clamp-1"
            >
              {item.description}
            </Text>
          )}
          {item.discount_percentage > 0 ? (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="line-through text-slate-500 text-xs">
                {formatCurrency(item.price, currencySymbol)}
              </span>
              <Text as="span" size="sm" weight="bold" color="brand">
                {formatCurrency(
                  item.price * (1 - item.discount_percentage / 100),
                  currencySymbol,
                )}
              </Text>
              <span className="text-[10px] font-semibold bg-green-500/15 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full">
                {item.discount_percentage}% OFF
              </span>
            </div>
          ) : (
            <Text as="p" size="sm" weight="bold" color="brand" className="mt-1">
              {formatCurrency(item.price, currencySymbol)}
            </Text>
          )}

          {/* Add Instruction Button */}
          <div className="mt-2.5">
            {item.instruction ? (
              <div
                className="cursor-pointer group/instruction"
                onClick={() => onAddInstruction(item)}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[var(--t-accent)] opacity-80 group-hover/instruction:opacity-100 transition-opacity">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </span>
                  <Text
                    as="span"
                    size="xs"
                    weight="medium"
                    color="brand"
                    className="opacity-80 group-hover/instruction:opacity-100 transition-opacity hover:underline"
                  >
                    Edit Instruction
                  </Text>
                </div>
                <p
                  className="text-white/60 text-xs italic border-l-2 pl-2"
                  style={{ borderColor: "var(--t-accent)" }}
                >
                  "{item.instruction}"
                </p>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                }
                onClick={() => onAddInstruction(item)}
                className="!px-2.5 !py-1 !text-xs !font-medium !bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10"
              >
                Add Instruction
              </Button>
            )}
          </div>
        </div>

        <CartControl item={item} />
      </div>
    </div>
  );
}

/* ─── "You might also like" suggestion row ─────────────────────────────────── */
function SuggestionRow({ item, onAdd }) {
  return (
    <div className="border-b border-white/5 last:border-0 py-1">
      <div
        className="flex items-center gap-3 p-3 -mx-3 rounded-2xl group cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => onAdd(item)}
      >
        <LazyImage
          src={item.image_url}
          alt={item.name}
          containerClassName="w-9 h-9 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0 flex items-center justify-center"
          placeholder={
            <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
              <span className="text-[9px] font-semibold text-slate-400 px-1 text-center">
                No image available
              </span>
            </div>
          }
        />
        <Text
          as="p"
          size="sm"
          weight="medium"
          color="white"
          className="flex-1 opacity-80 group-hover:opacity-100 transition-opacity"
        >
          {item.name}
        </Text>
        <button
          className="w-8 h-8 rounded-xl border border-white/20 flex items-center justify-center text-white/60 group-hover:text-white group-hover:border-[color:var(--t-accent2)] group-hover:bg-[color:var(--t-accent2-20)] hover:scale-105 active:scale-95 transition-all text-lg font-bold cursor-pointer"
          aria-label="Add suggestion"
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ─── Bill row ─────────────────────────────────────────────────────────────── */
function BillRow({ label, value, muted }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 -mx-3 hover:bg-white/5 rounded-xl transition-colors cursor-default">
      <Text
        as="span"
        size="sm"
        color="white"
        className={muted ? "opacity-50" : "opacity-70"}
      >
        {label}
      </Text>
      <Text
        as="span"
        size="sm"
        weight="semibold"
        color="white"
        className={muted ? "opacity-50" : "opacity-90"}
      >
        {value}
      </Text>
    </div>
  );
}

/* ─── CartDrawer ────────────────────────────────────────────────────────────── */
export default function CartDrawer({
  isOpen,
  onClose,
  items = [],
  onAdd,
  onRemove,
  onPlaceOrder,
  count = 0,
  loading = false,
  subtitle = "",
}) {
  const { currencySymbol } = restaurantStore();
  const navigate = useNavigate();
  const outlet = useOutletContext();
  const { basePath: baseFromOutlet } = outlet || {};
  const { qrCodeId, tableNumber } = useParams();
  const basePath =
    baseFromOutlet ||
    (qrCodeId != null && tableNumber != null
      ? `/${qrCodeId}/${tableNumber}`
      : "/");

  // AI suggestions — stale-while-revalidate, no loader
  const [suggestions, setSuggestions] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (items.length === 0) {
      setSuggestions([]);
      return;
    }

    // Don't clear stale suggestions — they stay visible until new ones arrive
    debounceRef.current = setTimeout(() => {
      getCartSuggestions(items.map((i) => i._id))
        .then((data) => {
          if (data.length > 0) setSuggestions(data);
        })
        .catch(() => {});
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i._id).join(",")]);

  // Instruction Modal State
  const [instructionModalOpen, setInstructionModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [instructionText, setInstructionText] = useState("");

  const handleOpenInstruction = (item) => {
    setActiveItem(item);
    setInstructionText(item.instruction || "");
    setInstructionModalOpen(true);
  };

  const handleSaveInstruction = () => {
    if (activeItem) {
      cartStore
        .getState()
        .setInstruction(
          activeItem._id ?? activeItem.id,
          instructionText.trim(),
        );
    }
    setInstructionModalOpen(false);
  };

  const subtotal = items.reduce((s, i) => {
    const effectivePrice =
      i.discount_percentage > 0
        ? i.price * (1 - i.discount_percentage / 100)
        : i.price;
    return s + effectivePrice * i.qty;
  }, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + SERVICE_CHARGE + tax;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      height={items.length > 0 ? "85vh" : undefined}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-2 pb-4 border-b border-white/10 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <Text
              as="h2"
              size="xl"
              weight="bold"
              color="white"
              className="tracking-wide uppercase"
            >
              My Cart
            </Text>
            <Text
              as="p"
              size="xs"
              color="white"
              className="opacity-40 mt-0.5 uppercase tracking-widest"
            >
              {count} {count === 1 ? "item" : "items"} selected
              {subtitle ? ` · ${subtitle}` : ""}
            </Text>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors text-lg mt-0.5 cursor-pointer active:scale-95"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Scrollable body ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* Empty state */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="text-5xl">🛒</span>
            <Text as="p" size="sm" color="white" className="opacity-50">
              Your cart is empty
            </Text>
            <Button
              variant="secondary"
              onClick={() => {
                onClose();
                navigate(`${basePath}/menu`);
              }}
              className="mt-2 border-[color:var(--t-accent-40)] text-[color:var(--t-accent)] hover:bg-[color:var(--t-accent-10)] active:bg-[color:var(--t-accent-20)]"
            >
              Browse Menu
            </Button>
          </div>
        )}

        {items.length > 0 && (
          <>
            {/* Cart items */}
            <div className="px-5">
              {items.map((item) => (
                <CartItem
                  key={item._id ?? item.id}
                  item={item}
                  onAddInstruction={handleOpenInstruction}
                  currencySymbol={currencySymbol}
                />
              ))}
            </div>

            {/* You might also like — shown only when suggestions are available */}
            {suggestions.length > 0 && (
              <div className="px-5 pt-4 pb-2">
                <Text
                  as="p"
                  size="xs"
                  weight="bold"
                  className="uppercase tracking-widest mb-1"
                  style={{ color: "var(--t-accent2)" }}
                >
                  You Might Also Like
                </Text>
                {suggestions.map((s) => (
                  <SuggestionRow
                    key={s._id}
                    item={s}
                    onAdd={(suggItem) => onAdd({ ...suggItem, qty: 0 })}
                  />
                ))}
              </div>
            )}

            {/* Divider */}
            <div className="mx-5 my-2 border-t border-white/10" />

            {/* Bill breakdown */}
            <div className="px-5">
              <BillRow
                label="Subtotal"
                value={formatCurrency(subtotal, currencySymbol, 2)}
                muted
              />
              <BillRow
                label="Service Charge"
                value={formatCurrency(SERVICE_CHARGE, currencySymbol, 2)}
                muted
              />
              <BillRow
                label="Estimated Taxes (5%)"
                value={formatCurrency(tax, currencySymbol, 2)}
                muted
              />
            </div>

            {/* Divider */}
            <div className="mx-5 my-2 border-t border-white/10" />

            {/* Total */}
            <div className="px-5 pb-10">
              <div className="flex items-baseline justify-between py-2 mt-1 cursor-default px-2 -mx-2 hover:bg-white/5 rounded-lg transition-colors">
                <Text as="span" size="lg" weight="bold" color="white">
                  Total Amount
                </Text>
                <Text as="span" size="2xl" weight="bold" color="brand">
                  {formatCurrency(total, currencySymbol, 2)}
                </Text>
              </div>
            </div>

            {/* Spacer so content doesn't hide behind sticky button */}
            <div className="h-10" />
          </>
        )}
      </div>

      {/* ── Sticky Place Order button ───────────────────────────────────────── */}
      {items.length > 0 && (
        <div
          className="shrink-0 px-5 pb-8 pt-4"
          // We apply the soft gradient background over the scrollable area
          style={{
            background: "linear-gradient(to top, var(--t-bg) 80%, transparent)",
          }}
        >
          <Button
            variant="primary"
            fullWidth
            size="xl"
            loading={loading}
            onClick={onPlaceOrder}
            className="uppercase tracking-widest shadow-[0_8px_32px_-4px_var(--t-accent-40)]"
          >
            Place Order
            <span className="text-base ml-1">→</span>
          </Button>
        </div>
      )}

      {/* ── Instruction Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={instructionModalOpen}
        onClose={() => setInstructionModalOpen(false)}
        title="Add Special Instruction"
      >
        <div className="flex flex-col gap-4">
          <Text as="p" size="sm" color="white" className="opacity-70">
            Any requests for the kitchen regarding{" "}
            <strong>{activeItem?.name}</strong>? We will try our best to
            accommodate them.
          </Text>
          <textarea
            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[var(--t-accent)] transition-colors placeholder:text-white/30 resize-none"
            rows={3}
            maxLength={150}
            placeholder="e.g. No sugar, extra spicy, sauce on the side..."
            value={instructionText}
            onChange={(e) => setInstructionText(e.target.value)}
          />
          <Button
            variant="primary"
            fullWidth
            onClick={handleSaveInstruction}
            className="mt-2"
          >
            Save Instruction
          </Button>
        </div>
      </Modal>
    </Drawer>
  );
}
