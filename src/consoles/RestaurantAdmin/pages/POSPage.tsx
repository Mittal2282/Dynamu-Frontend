import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  getDashMenu,
  getDashCategories,
  getDashTables,
  createManualOrder,
} from "../../../services/dashboardService";
import type { MenuItem, Variant } from "../../../types/menu";
import type { TableData } from "../../../types/restaurant";
import type { Order } from "../../../types/order";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PosCartItem {
  key: string;
  menuItem: MenuItem;
  quantity: number;
  variantName?: string;
  variantGroup?: string;
  unitPrice: number;
  note?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcUnitPrice(item: MenuItem, variant?: Variant): number {
  const base = item.price ?? 0;
  const upcharge = variant?.price ?? 0;
  const disc = variant?.discount_percentage ?? item.discount_percentage ?? 0;
  return (base + upcharge) * (1 - disc / 100);
}

function fmtPrice(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

// ─── MenuCard ─────────────────────────────────────────────────────────────────

interface MenuCardProps {
  item: MenuItem;
  cartQty: number;
  onAdd: () => void;
  onInc: () => void;
  onDec: () => void;
  cartItemsForId: PosCartItem[];
  onAddVariant: (variant: Variant) => void;
  onIncKey: (key: string) => void;
  onDecKey: (key: string) => void;
}

function MenuCard({
  item,
  cartQty,
  onAdd,
  onInc,
  onDec,
  cartItemsForId,
  onAddVariant,
  onIncKey,
  onDecKey,
}: MenuCardProps) {
  const unavailable =
    item.stock_status === "out_of_stock" || item.is_available === false;
  const hasVariants = !!item.has_variants && (item.variants?.length ?? 0) > 0;
  const displayPrice = calcUnitPrice(item);
  const hasDiscount = !hasVariants && (item.discount_percentage ?? 0) > 0;
  const [expanded, setExpanded] = useState(false);
  const allVariants: Variant[] = item.variants ?? [];
  const inCart = hasVariants ? cartItemsForId.length > 0 : cartQty > 0;

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col transition-all duration-200"
      style={{
        background: "var(--t-float)",
        border: `1px solid ${inCart ? "var(--t-accent)" : "var(--t-line)"}`,
        opacity: unavailable ? 0.55 : 1,
        boxShadow: inCart ? "0 0 0 1px var(--t-accent)" : undefined,
      }}
    >
      {/* Image */}
      <div
        className="aspect-[4/3] relative overflow-hidden shrink-0"
        style={{ background: "var(--t-line)" }}
      >
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ color: "var(--t-dim)" }}
          >
            <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        )}
        {unavailable && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.55)" }}
          >
            <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-black/60">
              Out of Stock
            </span>
          </div>
        )}
        {/* In-cart badge */}
        {inCart && (
          <div
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: "var(--t-accent)" }}
          >
            {hasVariants
              ? cartItemsForId.reduce((s, c) => s + c.quantity, 0)
              : cartQty}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-2.5 pt-2 pb-1 flex flex-col gap-0.5 flex-1">
        <div className="flex items-start gap-1.5">
          <span
            className="mt-0.5 w-2 h-2 rounded-sm shrink-0"
            style={{
              background: item.is_veg !== false ? "#22c55e" : "#ef4444",
            }}
          />
          <p
            className="text-xs font-semibold leading-tight line-clamp-2"
            style={{ color: "var(--t-text)" }}
          >
            {item.name}
          </p>
        </div>
        {item.description && (
          <p
            className="text-[10px] leading-relaxed line-clamp-2 pl-3.5"
            style={{ color: "var(--t-dim)" }}
          >
            {item.description}
          </p>
        )}
        <div className="flex items-baseline gap-1.5 pl-3.5 flex-wrap">
          <p
            className="text-sm font-bold tabular-nums"
            style={{ color: "var(--t-accent)" }}
          >
            {hasVariants
              ? `From ${fmtPrice(Math.min(...allVariants.map((v) => calcUnitPrice(item, v)), displayPrice))}`
              : fmtPrice(displayPrice)}
          </p>
          {hasDiscount && (
            <p
              className="text-[10px] line-through tabular-nums"
              style={{ color: "var(--t-dim)" }}
            >
              {fmtPrice(item.price)}
            </p>
          )}
        </div>
      </div>

      {/* Controls */}
      {hasVariants ? (
        <div className="px-2.5 pb-2.5">
          {!expanded && cartItemsForId.length === 0 ? (
            <button
              disabled={unavailable}
              onClick={() => setExpanded(true)}
              className="w-full py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={{
                background: "var(--t-accent)",
                color: "#fff",
                opacity: unavailable ? 0.4 : 1,
              }}
            >
              + Add
            </button>
          ) : (
            <div>
              {cartItemsForId.length === 0 && (
                <div className="flex justify-end mb-1">
                  <button
                    onClick={() => setExpanded(false)}
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ color: "var(--t-dim)" }}
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="space-y-1.5">
                {allVariants.map((v) => {
                  const vPrice = calcUnitPrice(item, v);
                  const vKey = `${item._id}-${v.name}`;
                  const ci = cartItemsForId.find((c) => c.variantName === v.name);
                  const qty = ci?.quantity ?? 0;
                  return (
                    <div
                      key={v.name}
                      className="flex items-center justify-between gap-1.5 rounded-lg px-2 py-1.5"
                      style={{
                        background:
                          qty > 0
                            ? "rgba(var(--t-accent-rgb,249,115,22),0.08)"
                            : "var(--t-surface)",
                        border: `1px solid ${qty > 0 ? "var(--t-accent)" : "var(--t-line)"}`,
                      }}
                    >
                      <div className="min-w-0">
                        <p
                          className="text-[11px] font-semibold truncate"
                          style={{ color: "var(--t-text)" }}
                        >
                          {v.name}
                        </p>
                        <p
                          className="text-[10px] tabular-nums"
                          style={{ color: "var(--t-accent)" }}
                        >
                          {fmtPrice(vPrice)}
                        </p>
                      </div>
                      {qty === 0 ? (
                        <button
                          onClick={() => onAddVariant(v)}
                          className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold"
                          style={{ background: "var(--t-accent)", color: "#fff" }}
                        >
                          +
                        </button>
                      ) : (
                        <div
                          className="shrink-0 flex items-center gap-0.5 rounded-md overflow-hidden"
                          style={{ background: "var(--t-accent)" }}
                        >
                          <button
                            onClick={() => onDecKey(vKey)}
                            className="w-6 h-6 flex items-center justify-center text-white text-sm font-bold"
                          >
                            −
                          </button>
                          <span className="text-xs font-bold text-white tabular-nums w-4 text-center">
                            {qty}
                          </span>
                          <button
                            onClick={() => onIncKey(vKey)}
                            className="w-6 h-6 flex items-center justify-center text-white text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="px-2.5 pb-2.5">
          {cartQty === 0 ? (
            <button
              disabled={unavailable}
              onClick={onAdd}
              className="w-full py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={{
                background: "var(--t-accent)",
                color: "#fff",
                opacity: unavailable ? 0.4 : 1,
              }}
            >
              + Add
            </button>
          ) : (
            <div
              className="flex items-center justify-between rounded-lg overflow-hidden"
              style={{ background: "var(--t-accent)" }}
            >
              <button
                onClick={onDec}
                className="w-9 h-8 flex items-center justify-center text-white font-bold text-lg"
              >
                −
              </button>
              <span className="text-sm font-bold text-white tabular-nums">
                {cartQty}
              </span>
              <button
                onClick={onInc}
                className="w-9 h-8 flex items-center justify-center text-white font-bold text-lg"
              >
                +
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CustomerModal ────────────────────────────────────────────────────────────

interface CustomerModalProps {
  tables: TableData[];
  customerName: string;
  setCustomerName: (v: string) => void;
  selectedTable: string;
  setSelectedTable: (v: string) => void;
  orderNotes: string;
  setOrderNotes: (v: string) => void;
  placing: boolean;
  subtotal: number;
  itemCount: number;
  onConfirm: () => void;
  onClose: () => void;
}

function CustomerModal({
  tables,
  customerName,
  setCustomerName,
  selectedTable,
  setSelectedTable,
  orderNotes,
  setOrderNotes,
  placing,
  subtotal,
  itemCount,
  onConfirm,
  onClose,
}: CustomerModalProps) {
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 80);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && !placing && onClose()}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
      >
        {/* Header */}
        <div
          className="px-5 pt-5 pb-4"
          style={{ borderBottom: "1px solid var(--t-line)" }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(var(--t-accent-rgb,249,115,22),0.1)", border: "1px solid rgba(var(--t-accent-rgb,249,115,22),0.2)" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: "var(--t-accent)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--t-text)" }}>
                  Confirm Order
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--t-dim)" }}>
                  {itemCount} {itemCount === 1 ? "item" : "items"} · {fmtPrice(subtotal)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={placing}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0"
              style={{ color: "var(--t-dim)", background: "var(--t-float)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="p-5 space-y-4">
          {/* Customer Name */}
          <div>
            <label
              className="flex items-center gap-1.5 text-[11px] font-semibold mb-2 uppercase tracking-wide"
              style={{ color: "var(--t-dim)" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
              </svg>
              Customer Name
            </label>
            <input
              ref={nameRef}
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in customer"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "var(--t-float)",
                border: "1px solid var(--t-line)",
                color: "var(--t-text)",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--t-accent)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--t-line)")
              }
            />
          </div>

          {/* Table + Notes row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="flex items-center gap-1.5 text-[11px] font-semibold mb-2 uppercase tracking-wide"
                style={{ color: "var(--t-dim)" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 10h18M3 14h18M10 6v12M14 6v12" />
                </svg>
                Table
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
                style={{
                  background: "var(--t-float)",
                  border: "1px solid var(--t-line)",
                  color: selectedTable ? "var(--t-text)" : "var(--t-dim)",
                }}
              >
                <option value="">Takeaway</option>
                {tables.map((t) => (
                  <option key={t._id} value={t._id}>
                    Table {t.table_number}
                    {t.name ? ` — ${t.name}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="flex items-center gap-1.5 text-[11px] font-semibold mb-2 uppercase tracking-wide"
                style={{ color: "var(--t-dim)" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Notes
              </label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="e.g. No onion"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: "var(--t-float)",
                  border: "1px solid var(--t-line)",
                  color: "var(--t-text)",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--t-accent)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--t-line)")
                }
              />
            </div>
          </div>

          {/* Order summary strip */}
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: "rgba(var(--t-accent-rgb,249,115,22),0.06)", border: "1px solid rgba(var(--t-accent-rgb,249,115,22),0.15)" }}
          >
            <p className="text-xs font-semibold" style={{ color: "var(--t-dim)" }}>
              Order Total
            </p>
            <p className="text-base font-bold tabular-nums" style={{ color: "var(--t-accent)" }}>
              {fmtPrice(subtotal)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 pb-5 flex items-center gap-3"
        >
          <button
            onClick={onClose}
            disabled={placing}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: "var(--t-float)",
              color: "var(--t-text)",
              border: "1px solid var(--t-line)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={placing}
            className="flex-[2] py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity"
            style={{
              background: "var(--t-accent)",
              color: "#fff",
              opacity: placing ? 0.7 : 1,
            }}
          >
            {placing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending…
              </>
            ) : (
              <>
                Send to Kitchen
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CartItemRow ──────────────────────────────────────────────────────────────

interface CartItemRowProps {
  item: PosCartItem;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}

function CartItemRow({ item, onInc, onDec, onRemove }: CartItemRowProps) {
  const lineTotal = item.unitPrice * item.quantity;

  return (
    <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--t-line)" }}>
      {/* Top row: name + price + remove */}
      <div className="flex items-start gap-2.5">
        {/* Veg indicator */}
        <span
          className="mt-1 w-2 h-2 rounded-sm shrink-0"
          style={{
            background: item.menuItem.is_veg !== false ? "#22c55e" : "#ef4444",
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className="text-xs font-semibold leading-snug"
                style={{ color: "var(--t-text)" }}
              >
                {item.menuItem.name}
              </p>
              {item.variantName && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded mt-0.5 inline-block font-medium"
                  style={{
                    background: "rgba(var(--t-accent-rgb,249,115,22),0.1)",
                    color: "var(--t-accent)",
                  }}
                >
                  {item.variantName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <p
                className="text-sm font-bold tabular-nums"
                style={{ color: "var(--t-text)" }}
              >
                {fmtPrice(lineTotal)}
              </p>
              <button
                onClick={onRemove}
                className="w-5 h-5 rounded-md flex items-center justify-center transition-colors"
                style={{ color: "var(--t-dim)", background: "var(--t-float)" }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Qty controls */}
      <div className="flex items-center justify-between mt-2.5 pl-4">
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--t-line)" }}
        >
          <button
            onClick={onDec}
            className="w-8 h-7 flex items-center justify-center font-bold text-base transition-colors"
            style={{ color: "var(--t-accent)", background: "var(--t-float)" }}
          >
            −
          </button>
          <span
            className="w-8 text-center text-xs font-bold tabular-nums"
            style={{
              color: "var(--t-text)",
              background: "var(--t-surface)",
              lineHeight: "1.75rem",
            }}
          >
            {item.quantity}
          </span>
          <button
            onClick={onInc}
            className="w-8 h-7 flex items-center justify-center font-bold text-base transition-colors"
            style={{ color: "var(--t-accent)", background: "var(--t-float)" }}
          >
            +
          </button>
        </div>
        <p className="text-[11px]" style={{ color: "var(--t-dim)" }}>
          {fmtPrice(item.unitPrice)} each
        </p>
      </div>
    </div>
  );
}

// ─── POSPage ──────────────────────────────────────────────────────────────────

export default function POSPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);

  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  const [placing, setPlacing] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const sentinelRef = useRef<HTMLDivElement>(null);
  const menuLoadingRef = useRef(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getDashCategories().then(setCategories).catch(() => {});
    getDashTables()
      .then((ts) => setTables(ts.filter((t) => t.is_active !== false)))
      .catch(() => {});
  }, []);

  const loadMenu = useCallback(
    async (page: number, reset: boolean, cat: string, q: string) => {
      if (menuLoadingRef.current) return;
      menuLoadingRef.current = true;
      setMenuLoading(true);
      try {
        const result = await getDashMenu({
          search: q || undefined,
          category: cat || undefined,
          page,
          limit: 24,
        });
        setMenuItems((prev) =>
          reset ? result.items : [...prev, ...result.items]
        );
        setHasMore(result.hasMore);
        if (!reset) setCurrentPage(page + 1);
        else setCurrentPage(2);
      } catch {
        // ignore
      } finally {
        menuLoadingRef.current = false;
        setMenuLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadMenu(1, true, "", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filterRef = useRef({ category: "", search: "" });
  useEffect(() => {
    filterRef.current = { category: activeCategory, search };
    setMenuItems([]);
    setCurrentPage(1);
    setHasMore(true);
    loadMenu(1, true, activeCategory, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, search]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !menuLoadingRef.current) {
          loadMenu(
            currentPage,
            false,
            filterRef.current.category,
            filterRef.current.search
          );
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, currentPage, loadMenu]);

  function handleSearchChange(val: string) {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setSearch(val), 320);
  }

  function addToCart(
    item: MenuItem,
    variantName?: string,
    variantGroup?: string,
    unitPrice?: number
  ) {
    const key = `${item._id}-${variantName || "base"}`;
    const price = unitPrice ?? item.price;
    setCart((prev) => {
      const existing = prev.find((c) => c.key === key);
      if (existing)
        return prev.map((c) =>
          c.key === key ? { ...c, quantity: c.quantity + 1 } : c
        );
      return [
        ...prev,
        { key, menuItem: item, quantity: 1, variantName, variantGroup, unitPrice: price },
      ];
    });
  }

  function removeFromCart(key: string) {
    setCart((prev) => prev.filter((c) => c.key !== key));
  }

  function updateQty(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => (c.key === key ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  }

  function updateNote(key: string, note: string) {
    setCart((prev) => prev.map((c) => (c.key === key ? { ...c, note } : c)));
  }

  function cartQtyFor(item: MenuItem): number {
    return cart
      .filter((c) => c.menuItem._id === item._id)
      .reduce((s, c) => s + c.quantity, 0);
  }

  function cartItemsForId(itemId: string): PosCartItem[] {
    return cart.filter((c) => c.menuItem._id === itemId);
  }

  const subtotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);

  async function handlePlaceOrder() {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      const placed = await createManualOrder({
        items: cart.map((ci) => ({
          menu_item: ci.menuItem._id,
          quantity: ci.quantity,
          ...(ci.variantName ? { variant_name: ci.variantName } : {}),
          ...(ci.variantGroup ? { variant_group: ci.variantGroup } : {}),
          ...(ci.note ? { special_instructions: ci.note } : {}),
        })),
        customer_name: customerName || undefined,
        notes: orderNotes || undefined,
        table_id: selectedTable || undefined,
        source: "pos",
      });
      setLastOrder(placed);
      setCart([]);
      setCustomerName("");
      setOrderNotes("");
      setSelectedTable("");
      setShowCustomerModal(false);
    } catch {
      setToastMsg("Failed to place order. Please try again.");
      setTimeout(() => setToastMsg(""), 3000);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="flex h-full gap-4 min-h-0">
      {/* ── MENU PANEL ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Search + categories — single row */}
        <div
          className="shrink-0 flex items-center gap-2 pb-3"
          style={{ borderBottom: "1px solid var(--t-line)" }}
        >
          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0"
            style={{
              background: "var(--t-surface)",
              border: "1px solid var(--t-line)",
              width: "220px",
            }}
          >
            <svg
              className="w-3.5 h-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: "var(--t-dim)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search menu…"
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none min-w-0"
              style={{ color: "var(--t-text)" }}
            />
          </div>

          {/* Category pills — scrollable */}
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide min-w-0 py-0.5">
            {["", ...categories].map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
                  style={{
                    background: isActive ? "var(--t-accent)" : "var(--t-surface)",
                    color: isActive ? "#fff" : "var(--t-dim)",
                    border: `1px solid ${isActive ? "var(--t-accent)" : "var(--t-line)"}`,
                  }}
                >
                  {cat === "" ? "All" : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu grid */}
        <div className="flex-1 overflow-y-auto pt-3">
          {menuItems.length === 0 && menuLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: "var(--t-float)",
                    border: "1px solid var(--t-line)",
                  }}
                >
                  <div
                    className="aspect-[4/3] animate-pulse"
                    style={{ background: "var(--t-line)" }}
                  />
                  <div className="p-2.5 space-y-2">
                    <div
                      className="h-3 rounded animate-pulse"
                      style={{ background: "var(--t-line)", width: "70%" }}
                    />
                    <div
                      className="h-3 rounded animate-pulse"
                      style={{ background: "var(--t-line)", width: "40%" }}
                    />
                    <div
                      className="h-7 rounded-lg animate-pulse mt-2"
                      style={{ background: "var(--t-line)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : menuItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--t-float)", border: "1px solid var(--t-line)" }}
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: "var(--t-dim)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 0 1 5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--t-dim)" }}>
                No items found
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
                {menuItems.map((item) => {
                  const qty = cartQtyFor(item);
                  const ciForId = cartItemsForId(item._id);
                  return (
                    <MenuCard
                      key={item._id}
                      item={item}
                      cartQty={qty}
                      onAdd={() =>
                        addToCart(
                          item,
                          undefined,
                          undefined,
                          calcUnitPrice(item)
                        )
                      }
                      onInc={() => {
                        const ci = cart.find(
                          (c) => c.menuItem._id === item._id
                        );
                        if (ci) updateQty(ci.key, 1);
                        else
                          addToCart(
                            item,
                            undefined,
                            undefined,
                            calcUnitPrice(item)
                          );
                      }}
                      onDec={() => {
                        const ci = cart.find(
                          (c) => c.menuItem._id === item._id
                        );
                        if (ci) updateQty(ci.key, -1);
                      }}
                      cartItemsForId={ciForId}
                      onAddVariant={(v) =>
                        addToCart(
                          item,
                          v.name,
                          v.groupName,
                          calcUnitPrice(item, v)
                        )
                      }
                      onIncKey={(key) => updateQty(key, 1)}
                      onDecKey={(key) => updateQty(key, -1)}
                    />
                  );
                })}
              </div>
              <div ref={sentinelRef} className="h-8 flex items-center justify-center">
                {menuLoading && (
                  <span
                    className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: "var(--t-accent)" }}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── CART PANEL ──────────────────────────────────────────────────── */}
      <div
        className="w-[340px] xl:w-[380px] shrink-0 flex flex-col min-h-0 rounded-2xl overflow-hidden"
        style={{
          background: "var(--t-surface)",
          border: "1px solid var(--t-line)",
        }}
      >
        {lastOrder ? (
          /* ── Success state ── */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.25)",
              }}
            >
              <svg className="w-8 h-8" fill="none" stroke="#22c55e" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: "#22c55e" }}>
                Order #{lastOrder.order_number} Sent!
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--t-dim)" }}>
                Kitchen has been notified
              </p>
            </div>

            <div
              className="w-full rounded-xl overflow-hidden text-left"
              style={{ border: "1px solid var(--t-line)" }}
            >
              {lastOrder.items?.slice(0, 4).map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2 text-xs"
                  style={{
                    borderBottom:
                      idx < Math.min((lastOrder.items?.length ?? 0) - 1, 3)
                        ? "1px solid var(--t-line)"
                        : undefined,
                  }}
                >
                  <span style={{ color: "var(--t-text)" }}>
                    {it.name}
                    {it.variant_name ? ` (${it.variant_name})` : ""}
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: "var(--t-dim)" }}
                  >
                    ×{it.quantity}
                  </span>
                </div>
              ))}
              {(lastOrder.items?.length ?? 0) > 4 && (
                <div
                  className="px-3 py-2 text-xs"
                  style={{ color: "var(--t-dim)" }}
                >
                  +{(lastOrder.items?.length ?? 0) - 4} more items
                </div>
              )}
            </div>

            {lastOrder.total_amount != null && (
              <div
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl"
                style={{ background: "var(--t-float)", border: "1px solid var(--t-line)" }}
              >
                <span className="text-xs font-semibold" style={{ color: "var(--t-dim)" }}>
                  Total
                </span>
                <span className="text-sm font-bold tabular-nums" style={{ color: "var(--t-text)" }}>
                  {fmtPrice(lastOrder.total_amount)}
                </span>
              </div>
            )}

            <button
              onClick={() => setLastOrder(null)}
              className="w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: "var(--t-accent)", color: "#fff" }}
            >
              + New Order
            </button>
          </div>
        ) : (
          <>
            {/* ── Cart header ── */}
            <div
              className="shrink-0 px-4 py-3.5 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--t-line)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--t-float)", border: "1px solid var(--t-line)" }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    style={{ color: "var(--t-dim)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight" style={{ color: "var(--t-text)" }}>
                    Order Summary
                  </p>
                  {totalItems > 0 && (
                    <p className="text-[11px] leading-tight" style={{ color: "var(--t-dim)" }}>
                      {totalItems} {totalItems === 1 ? "item" : "items"}
                    </p>
                  )}
                </div>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                  style={{
                    color: "var(--t-dim)",
                    background: "var(--t-float)",
                    border: "1px solid var(--t-line)",
                  }}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* ── Cart items ── */}
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "var(--t-float)", border: "1px solid var(--t-line)" }}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    style={{ color: "var(--t-dim)", opacity: 0.5 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>
                    Cart is empty
                  </p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--t-dim)" }}>
                    Add items from the menu to begin a new order
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {cart.map((item) => (
                  <CartItemRow
                    key={item.key}
                    item={item}
                    onInc={() => updateQty(item.key, 1)}
                    onDec={() => updateQty(item.key, -1)}
                    onRemove={() => removeFromCart(item.key)}
                  />
                ))}
              </div>
            )}

            {/* ── Cart footer ── */}
            <div
              className="shrink-0 px-4 pt-3.5 pb-4 space-y-3"
              style={{
                borderTop:
                  cart.length > 0 ? "1px solid var(--t-line)" : undefined,
              }}
            >
              {cart.length > 0 && (
                <div
                  className="rounded-xl px-3.5 py-3 space-y-2"
                  style={{ background: "var(--t-float)", border: "1px solid var(--t-line)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--t-dim)" }}>
                      {totalItems} {totalItems === 1 ? "item" : "items"}
                    </span>
                    <span
                      className="text-xs font-semibold tabular-nums"
                      style={{ color: "var(--t-text)" }}
                    >
                      {fmtPrice(subtotal)}
                    </span>
                  </div>
                  <div
                    className="border-t"
                    style={{ borderColor: "var(--t-line)" }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: "var(--t-text)" }}>
                      Subtotal
                    </span>
                    <span
                      className="text-base font-bold tabular-nums"
                      style={{ color: "var(--t-text)" }}
                    >
                      {fmtPrice(subtotal)}
                    </span>
                  </div>
                  <p className="text-[10px]" style={{ color: "var(--t-dim)" }}>
                    Tax &amp; service charge applied at checkout
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowCustomerModal(true)}
                disabled={cart.length === 0}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{
                  background:
                    cart.length === 0 ? "var(--t-float)" : "var(--t-accent)",
                  color: cart.length === 0 ? "var(--t-dim)" : "#fff",
                  border:
                    cart.length === 0 ? "1px solid var(--t-line)" : undefined,
                }}
              >
                {cart.length === 0 ? (
                  "Place Order"
                ) : (
                  <>
                    Place Order
                    <span
                      className="px-2 py-0.5 rounded-lg text-xs font-bold tabular-nums"
                      style={{ background: "rgba(255,255,255,0.2)" }}
                    >
                      {fmtPrice(subtotal)}
                    </span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Customer modal ────────────────────────────────────────────── */}
      {showCustomerModal && (
        <CustomerModal
          tables={tables}
          customerName={customerName}
          setCustomerName={setCustomerName}
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
          orderNotes={orderNotes}
          setOrderNotes={setOrderNotes}
          placing={placing}
          subtotal={subtotal}
          itemCount={totalItems}
          onConfirm={handlePlaceOrder}
          onClose={() => !placing && setShowCustomerModal(false)}
        />
      )}

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toastMsg && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg"
          style={{ background: "#ef4444", color: "#fff" }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
