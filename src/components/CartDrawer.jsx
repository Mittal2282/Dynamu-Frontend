import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { getCartSuggestions } from "../services/customerService";
import { restaurantStore } from "../store/restaurantStore";
import { formatCurrency } from "../utils/formatters";
import CartControl from "./customer/CartControl";
import MenuItemCard from "./customer/MenuItemCard";
import { VegBadge } from "./ui/Badge";
import Button from "./ui/Button";
import Drawer from "./ui/Drawer";
import LazyImage from "./ui/LazyImage";
import Text from "./ui/Text";

/* ─── Constants ────────────────────────────────────────────────────────────── */
const SERVICE_CHARGE = 10; // fixed ₹10
const TAX_RATE = 0.05; // 5 %

/* ─── Cart item row ────────────────────────────────────────────────────────── */
function CartItem({ item, currencySymbol }) {
  // Variant-aware price and veg status
  const basePrice = item.selectedVariant?.price ?? item.price;
  const effectivePrice =
    item.discount_percentage > 0
      ? basePrice * (1 - item.discount_percentage / 100)
      : basePrice;
  const displayIsVeg = item.selectedVariant ? item.selectedVariant.isVeg : item.is_veg;

  return (
    <div
      className="rounded-2xl overflow-hidden border mb-3 last:mb-0"
      style={{ background: "var(--t-surface)", borderColor: "var(--t-line)" }}
    >
      <div className="p-3 flex gap-3">
        {/* Image with VegBadge overlay */}
        <div className="relative shrink-0 self-start overflow-hidden rounded-xl">
          <LazyImage
            src={item.image_url}
            alt={item.name}
            containerClassName="w-[88px] h-[88px] rounded-xl overflow-hidden"
            imgClassName="w-full h-full object-cover"
            placeholder={
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "var(--t-float)" }}
              >
                <span className="text-3xl">{displayIsVeg ? "🥗" : "🍗"}</span>
              </div>
            }
          />
          <div className="absolute top-1.5 left-1.5 p-[3px] rounded-sm bg-white/90 shadow-sm">
            <VegBadge isVeg={displayIsVeg} size="sm" />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <Text as="p" size="sm" weight="semibold" color="white" className="leading-snug">
            {item.name}
          </Text>
          {/* Variant label */}
          {item.selectedVariant && (
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: "var(--t-accent)" }}>
              {item.selectedVariant.groupName
                ? `${item.selectedVariant.groupName}: ${item.selectedVariant.name}`
                : item.selectedVariant.name}
            </p>
          )}
          {!item.selectedVariant && item.description && (
            <Text as="p" size="xs" color="white" className="opacity-40 mt-0.5 line-clamp-1">
              {item.description}
            </Text>
          )}
          {item.discount_percentage > 0 ? (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="line-through text-slate-500 text-xs">
                {formatCurrency(basePrice, currencySymbol)}
              </span>
              <Text as="span" size="sm" weight="bold" color="brand">
                {formatCurrency(effectivePrice, currencySymbol)}
              </Text>
              <span className="text-[10px] font-semibold bg-green-500/15 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full">
                {item.discount_percentage}% OFF
              </span>
            </div>
          ) : (
            <Text as="p" size="sm" weight="bold" color="brand" className="mt-1">
              {formatCurrency(basePrice, currencySymbol)}
            </Text>
          )}
        </div>

        <CartControl item={item} selectedVariant={item.selectedVariant} showDelete={true} />
      </div>
    </div>
  );
}

/* ─── Bill row ─────────────────────────────────────────────────────────────── */
function BillRow({ label, value, muted }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 -mx-3 hover:bg-white/5 rounded-xl transition-colors cursor-default">
      <Text as="span" size="sm" color="white" className={muted ? "opacity-50" : "opacity-70"}>
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
    (qrCodeId != null && tableNumber != null ? `/${qrCodeId}/${tableNumber}` : "/");

  // Order level notes
  const [orderNote, setOrderNote] = useState("");

  // AI suggestions — stale-while-revalidate, no loader
  const [suggestions, setSuggestions] = useState([]);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const cartIds = new Set(items.map((i) => i._id));

    // Remove newly-added suggestions immediately so the section feels responsive.
    setSuggestions((prev) => prev.filter((item) => !cartIds.has(item._id)));

    if (items.length === 0) {
      setSuggestions([]);
      return;
    }

    const currentRequestId = ++requestIdRef.current;

    // Keep stale suggestions visible while refreshing, but refresh quickly.
    debounceRef.current = setTimeout(() => {
      getCartSuggestions(items.map((i) => i._id))
        .then((data) => {
          if (requestIdRef.current !== currentRequestId) return;
          const latestCartIds = new Set(items.map((i) => i._id));
          setSuggestions((data || []).filter((item) => !latestCartIds.has(item._id)));
        })
        .catch(() => {});
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i._id).join(",")]);

  const subtotal = items.reduce((s, i) => {
    const basePrice = i.selectedVariant?.price ?? i.price;
    const effectivePrice =
      i.discount_percentage > 0 ? basePrice * (1 - i.discount_percentage / 100) : basePrice;
    return s + effectivePrice * i.qty;
  }, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + SERVICE_CHARGE + tax;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} height={items.length > 0 ? "85vh" : undefined}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-2 pb-4 border-b border-white/10 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <Text as="h2" size="xl" weight="bold" color="white" className="tracking-wide uppercase">
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
            <div
              style={{
                padding: "10px 20px 10px 20px",
              }}
            >
              {items.map((item) => (
                <CartItem key={item._cartKey ?? item._id} item={item} currencySymbol={currencySymbol} />
              ))}
            </div>

            {/* Global Order Note */}
            <div className="px-5 mt-4">
              <textarea
                rows={3}
                maxLength={500}
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Add special instructions for the kitchen... (e.g. less spicy, allergies)"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[var(--t-accent)] focus:bg-white/[0.06] transition-colors placeholder:text-white/30 resize-none shadow-inner"
              />
              <div className="mt-1 flex justify-end">
                <span className="text-[10px]" style={{ color: "var(--t-nav-muted)" }}>
                  {orderNote.length}/500
                </span>
              </div>
            </div>

            {/* You might also like — shown only when suggestions are available */}
            {suggestions.length > 0 && (
              <div className="px-5 pt-4 pb-2">
                <Text
                  as="p"
                  size="xs"
                  weight="bold"
                  className="uppercase tracking-widest mb-3"
                  style={{ color: "var(--t-accent2)" }}
                >
                  You Might Also Like
                </Text>
                <div className="space-y-2.5">
                  {suggestions.map((s) => (
                    <MenuItemCard key={s._id} item={s} currencySymbol={currencySymbol} size="sm" />
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="mx-5 my-2 border-t border-white/10" />

            {/* Bill breakdown */}
            <div className="px-5">
              <BillRow label="Subtotal" value={formatCurrency(subtotal, currencySymbol, 2)} muted />
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
            onClick={() => onPlaceOrder(orderNote.trim())}
            className="uppercase tracking-widest shadow-[0_8px_32px_-4px_var(--t-accent-40)]"
          >
            Place Order
            <span className="text-base ml-1">→</span>
          </Button>
        </div>
      )}
    </Drawer>
  );
}
