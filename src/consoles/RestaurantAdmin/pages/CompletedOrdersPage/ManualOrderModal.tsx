import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Spin } from 'antd';
import {
  createManualOrder,
  getDashMenu,
  getDashTables,
} from '../../../../services/dashboardService';
import { todayStr, fmtCurrency } from './helpers';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Variant {
  name: string;
  price?: number;
  groupName?: string;
  isAvailable?: boolean;
  isVeg?: boolean | null;
  discount_percentage?: number;
}

interface MenuItem {
  _id: string;
  name: string;
  price?: number;
  category?: string;
  is_veg?: boolean | null;
  has_variants?: boolean;
  variants?: Variant[];
  discount_percentage?: number;
}

interface TableItem {
  _id: string;
  table_number?: number | string;
  name?: string;
}

interface OrderLine {
  key: string;
  menuItem: MenuItem;
  selectedVariant: Variant | null;
  qty: number;
}

interface ManualOrderModalProps {
  onClose: () => void;
  onSaved: (order: unknown) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type VegStatus = 'veg' | 'non-veg' | 'mixed';

function getVegStatus(item: MenuItem): VegStatus {
  if (item.has_variants && item.variants?.length) {
    const hasVeg    = item.variants.some((v) => v.isVeg !== false);
    const hasNonVeg = item.variants.some((v) => v.isVeg === false);
    if (hasVeg && hasNonVeg) return 'mixed';
    return hasNonVeg ? 'non-veg' : 'veg';
  }
  return item.is_veg !== false ? 'veg' : 'non-veg';
}

function VegDot({ status }: { status: VegStatus }) {
  const bg =
    status === 'mixed'   ? 'linear-gradient(135deg, #22c55e 50%, #ef4444 50%)' :
    status === 'veg'     ? '#22c55e' : '#ef4444';
  return (
    <div
      className="w-2 h-2 rounded-full shrink-0"
      style={{ background: bg }}
      title={status === 'mixed' ? 'Veg & non-veg variants' : undefined}
    />
  );
}

const CATALOG_LIMIT = 15;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ManualOrderModal({ onClose, onSaved }: ManualOrderModalProps) {
  // meta
  const [date,         setDate]         = useState(todayStr());
  const [customerName, setCustomerName] = useState('');
  const [notes,        setNotes]        = useState('');
  const [tableId,      setTableId]      = useState('');
  const [tables,       setTables]       = useState<TableItem[]>([]);

  // order lines
  const [orderLines,     setOrderLines]     = useState<OrderLine[]>([]);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // catalog
  const [searchInput,        setSearchInput]        = useState('');
  const [debouncedSearch,    setDebouncedSearch]    = useState('');
  const [catalogItems,       setCatalogItems]       = useState<MenuItem[]>([]);
  const [catalogHasMore,     setCatalogHasMore]     = useState(false);
  const [catalogLoading,     setCatalogLoading]     = useState(true);
  const [catalogLoadingMore, setCatalogLoadingMore] = useState(false);
  const catalogPageRef = useRef(1);
  const loadingMoreRef = useRef(false);

  // submit
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    getDashTables().then((d) => setTables(d.map((t) => ({ _id: t._id ?? t.id ?? '', table_number: t.table_number, name: t.name })))).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Catalog fetch ─────────────────────────────────────────────────────────────

  const loadCatalog = useCallback(async (query: string, page: number, append: boolean) => {
    if (append) {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setCatalogLoadingMore(true);
    } else {
      setCatalogLoading(true);
    }
    try {
      const result = await getDashMenu({ search: query || undefined, page, limit: CATALOG_LIMIT });
      setCatalogItems((prev) => append ? [...prev, ...result.items] : result.items);
      setCatalogHasMore(result.hasMore);
      catalogPageRef.current = page;
    } catch { /* silent */ } finally {
      if (append) { loadingMoreRef.current = false; setCatalogLoadingMore(false); }
      else setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    catalogPageRef.current = 1;
    loadCatalog(debouncedSearch, 1, false);
  }, [debouncedSearch, loadCatalog]);

  const handleCatalogScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80 && catalogHasMore && !loadingMoreRef.current) {
      loadCatalog(debouncedSearch, catalogPageRef.current + 1, true);
    }
  }, [catalogHasMore, debouncedSearch, loadCatalog]);

  // ── Order line helpers ────────────────────────────────────────────────────────

  const addLine = (menuItem: MenuItem, variant: Variant | null = null) => {
    const key = variant ? `${menuItem._id}__${variant.name}` : menuItem._id;
    setOrderLines((prev) => {
      const idx = prev.findIndex((l) => l.key === key);
      if (idx > -1) return prev.map((l, i) => i === idx ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { key, menuItem, selectedVariant: variant, qty: 1 }];
    });
    setExpandedItemId(null);
  };

  const updateQty = (key: string, delta: number) => {
    setOrderLines((prev) =>
      prev.flatMap((l) => {
        if (l.key !== key) return [l];
        const next = l.qty + delta;
        return next <= 0 ? [] : [{ ...l, qty: next }];
      })
    );
  };

  const removeLine = (key: string) => setOrderLines((prev) => prev.filter((l) => l.key !== key));

  const linePrice = (line: OrderLine) => {
    const base = line.menuItem.price ?? 0;
    const up   = line.selectedVariant?.price ?? 0;
    const disc = line.selectedVariant?.discount_percentage ?? line.menuItem.discount_percentage ?? 0;
    return (base + up) * (1 - disc / 100) * line.qty;
  };

  const total        = orderLines.reduce((s, l) => s + linePrice(l), 0);
  const totalItems   = orderLines.reduce((s, l) => s + l.qty, 0);

  // ── Save ──────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!orderLines.length) return;
    setSaving(true); setError('');
    try {
      const order = await createManualOrder({
        items: orderLines.map((l) => ({
          menu_item_id:  l.menuItem._id,
          quantity:      l.qty,
          ...(l.selectedVariant ? { variant_name: l.selectedVariant.name, variant_group: l.selectedVariant.groupName ?? null } : {}),
        })),
        customer_name: customerName.trim() || undefined,
        notes:         notes.trim()        || undefined,
        table_id:      tableId             || undefined,
        order_date:    date,
      });
      onSaved(order);
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message ?? e.message ?? 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal shell — grows rightward to fit the summary panel */}
      <div
        className="relative w-full flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background:  'var(--t-bg)',
          border:      '1px solid var(--t-line)',
          maxWidth:    760,
          maxHeight:   '90vh',
          minHeight:   520,
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ borderBottom: '1px solid var(--t-line)' }}
        >
          <p className="font-bold text-white text-sm">Add Manual Order</p>
          <button
            type="button" onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--t-dim)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t-dim)'; }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Two-panel body ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* LEFT — meta fields + catalog */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ borderRight: '1px solid var(--t-line)' }}>

            {/* Meta fields */}
            <div className="px-5 pt-4 pb-3 shrink-0">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--t-dim)' }}>Date *</label>
                  <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)', colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--t-dim)' }}>Customer</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Optional"
                    className="w-full rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)' }} />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--t-dim)' }}>Table</label>
                  <select value={tableId} onChange={(e) => setTableId(e.target.value)}
                    className="w-full rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)', colorScheme: 'dark' }}>
                    <option value="">— None —</option>
                    {tables.map((t) => (
                      <option key={t._id} value={t._id}>#{t.table_number}{t.name ? ` · ${t.name}` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Catalog section — fills remaining height */}
            <div className="flex flex-col flex-1 min-h-0 px-5 pb-4">
              <p className="text-[9px] font-bold uppercase tracking-widest mb-2 shrink-0" style={{ color: 'var(--t-dim)' }}>Menu Items</p>

              {/* Search */}
              <div className="relative mb-2 shrink-0">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--t-dim)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search items…"
                  className="w-full rounded-lg pl-7 pr-7 py-1.5 text-xs text-white outline-none"
                  style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)' }}
                />
                {searchInput && searchInput === debouncedSearch && (
                  <button type="button" onClick={() => setSearchInput('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 flex items-center justify-center"
                    style={{ color: 'var(--t-dim)' }}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
                {searchInput !== debouncedSearch && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <Spin size="small" />
                  </span>
                )}
              </div>

              {/* Catalog list — fills remaining, handles infinite scroll */}
              <div
                className="flex-1 min-h-0 overflow-y-auto rounded-xl"
                style={{ border: '1px solid var(--t-line)' }}
                onScroll={handleCatalogScroll}
              >
                {catalogLoading ? (
                  <div className="flex items-center justify-center h-full min-h-30">
                    <Spin size="small" />
                  </div>
                ) : catalogItems.length === 0 ? (
                  <div className="flex items-center justify-center h-full min-h-30">
                    <p className="text-xs" style={{ color: 'var(--t-dim)' }}>
                      {debouncedSearch ? `No results for "${debouncedSearch}"` : 'No items found'}
                    </p>
                  </div>
                ) : (
                  <>
                    {catalogItems.map((item) => {
                      const availVariants = (item.variants ?? []).filter((v) => v.isAvailable !== false);
                      // qty tracking for visual feedback
                      const itemQty = !item.has_variants
                        ? (orderLines.find((l) => l.key === item._id)?.qty ?? 0)
                        : orderLines.filter((l) => l.key.startsWith(item._id + '__')).reduce((s, l) => s + l.qty, 0);
                      const isInCart = itemQty > 0;

                      return (
                        <div key={item._id} style={{ borderBottom: '1px solid var(--t-line)' }}>
                          <div
                            className="flex items-center gap-2.5 px-3 py-2"
                            style={{
                              background: isInCart ? 'color-mix(in srgb, var(--t-accent) 6%, var(--t-surface))' : 'var(--t-surface)',
                              borderLeft: isInCart ? '2px solid var(--t-accent)' : '2px solid transparent',
                            }}
                          >
                            <VegDot status={getVegStatus(item)} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white truncate">{item.name}</p>
                              <p className="text-[9px]" style={{ color: 'var(--t-dim)' }}>{item.category}</p>
                            </div>
                            <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--t-accent)' }}>₹{item.price}</span>

                            {/* Non-variant: inline stepper when in cart, + button otherwise */}
                            {!item.has_variants ? (
                              itemQty > 0 ? (
                                <div className="flex items-center rounded-lg overflow-hidden shrink-0"
                                  style={{ border: '1.5px solid var(--t-accent)', height: 26 }}>
                                  <button type="button" onClick={() => updateQty(item._id, -1)}
                                    className="w-6 flex items-center justify-center text-sm font-bold"
                                    style={{ color: 'var(--t-accent)' }}>−</button>
                                  <span className="px-1.5 text-xs font-bold tabular-nums"
                                    style={{ color: 'var(--t-accent)', borderLeft: '1px solid var(--t-accent)', borderRight: '1px solid var(--t-accent)' }}>
                                    {itemQty}
                                  </span>
                                  <button type="button" onClick={() => addLine(item)}
                                    className="w-6 flex items-center justify-center text-sm font-bold"
                                    style={{ color: 'var(--t-accent)' }}>+</button>
                                </div>
                              ) : (
                                <button type="button" onClick={() => addLine(item)}
                                  className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                                  style={{ background: 'var(--t-accent)' }}>
                                  +
                                </button>
                              )
                            ) : (
                              /* Variant item: Choose button with total-added badge */
                              <div className="flex items-center gap-1 shrink-0">
                                {isInCart && (
                                  <span
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                                    style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
                                  >
                                    ×{itemQty}
                                  </span>
                                )}
                                <button type="button" onClick={() => setExpandedItemId(expandedItemId === item._id ? null : item._id)}
                                  className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors"
                                  style={{
                                    background: expandedItemId === item._id ? 'var(--t-accent)' : 'var(--t-accent-10)',
                                    color:      expandedItemId === item._id ? '#fff' : 'var(--t-accent)',
                                  }}>
                                  {expandedItemId === item._id ? 'Close' : 'Choose'}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Variant picker */}
                          {item.has_variants && expandedItemId === item._id && (
                            <div className="flex flex-wrap gap-1.5 px-3 pb-2.5 pt-1.5" style={{ background: 'var(--t-float)' }}>
                              {availVariants.map((v) => {
                                const vKey = `${item._id}__${v.name}`;
                                const vQty = orderLines.find((l) => l.key === vKey)?.qty ?? 0;
                                return (
                                  <button key={v.name} type="button" onClick={() => addLine(item, v)}
                                    className="relative text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors"
                                    style={{
                                      background:   vQty > 0 ? 'rgba(34,197,94,0.1)'    : 'var(--t-surface)',
                                      borderColor:  vQty > 0 ? 'rgba(34,197,94,0.4)'    : 'var(--t-accent-40)',
                                      color:        vQty > 0 ? '#22c55e'                : 'var(--t-text)',
                                    }}>
                                    {v.name}{v.price ? ` +₹${v.price}` : ''}
                                    {vQty > 0 && (
                                      <span className="ml-1 font-bold" style={{ color: '#22c55e' }}>×{vQty}</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {catalogLoadingMore && (
                      <div className="flex items-center justify-center py-3" style={{ background: 'var(--t-surface)' }}>
                        <Spin size="small" />
                      </div>
                    )}
                    {!catalogHasMore && !catalogLoadingMore && catalogItems.length >= CATALOG_LIMIT && (
                      <p className="text-center py-2 text-[10px]" style={{ color: 'var(--t-dim)', background: 'var(--t-surface)' }}>
                        All {catalogItems.length} items shown
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — order summary */}
          <div className="flex flex-col shrink-0 overflow-hidden" style={{ width: 256 }}>

            {/* Panel header */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ borderBottom: '1px solid var(--t-line)' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--t-dim)' }}>Order</p>
              {totalItems > 0 && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums"
                  style={{ background: 'var(--t-accent)', color: '#fff' }}
                >
                  {totalItems} item{totalItems !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {orderLines.length === 0 ? (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--t-surface)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--t-dim)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold" style={{ color: 'var(--t-dim)' }}>No items yet</p>
                <p className="text-[10px] text-center" style={{ color: 'var(--t-dim)' }}>Pick from the menu on the left</p>
              </div>
            ) : (
              <>
                {/* Order lines — scrollable */}
                <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2.5 flex flex-col gap-1.5">
                  {orderLines.map((line) => (
                    <div key={line.key}
                      className="flex items-center gap-2 rounded-xl px-2.5 py-2"
                      style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate leading-tight">{line.menuItem.name}</p>
                        {line.selectedVariant && (
                          <p className="text-[10px] leading-tight" style={{ color: 'var(--t-dim)' }}>{line.selectedVariant.name}</p>
                        )}
                      </div>
                      {/* Qty stepper */}
                      <div className="flex items-center rounded-lg overflow-hidden shrink-0" style={{ border: '1.5px solid var(--t-accent-40)', height: 24 }}>
                        <button type="button" onClick={() => updateQty(line.key, -1)}
                          className="w-6 flex items-center justify-center font-bold text-sm" style={{ color: 'var(--t-accent)' }}>−</button>
                        <span className="px-1 text-xs font-bold text-white tabular-nums"
                          style={{ borderLeft: '1px solid var(--t-accent-40)', borderRight: '1px solid var(--t-accent-40)', minWidth: 20, textAlign: 'center' }}>
                          {line.qty}
                        </span>
                        <button type="button" onClick={() => updateQty(line.key, 1)}
                          className="w-6 flex items-center justify-center font-bold text-sm" style={{ color: 'var(--t-accent)' }}>+</button>
                      </div>
                      {/* Remove */}
                      <button type="button" onClick={() => removeLine(line.key)}
                        className="w-5 h-5 flex items-center justify-center shrink-0 rounded transition-colors"
                        style={{ color: 'var(--t-dim)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t-dim)'; }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Notes + total */}
                <div className="shrink-0 px-3 pb-3 pt-2.5 flex flex-col gap-2" style={{ borderTop: '1px solid var(--t-line)' }}>
                  <textarea
                    value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes (optional)" rows={2}
                    className="w-full rounded-xl px-2.5 py-2 text-xs text-white outline-none resize-none"
                    style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)' }}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--t-dim)' }}>Estimated Total</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--t-accent)' }}>{fmtCurrency(total)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-between gap-3 px-5 py-3 shrink-0"
          style={{ borderTop: '1px solid var(--t-line)' }}
        >
          <div className="flex-1 min-w-0">
            {error && (
              <p className="text-xs px-3 py-1.5 rounded-xl truncate"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-medium transition-colors"
              style={{ color: 'var(--t-dim)', background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving || !orderLines.length}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
              style={{
                background: orderLines.length ? 'var(--t-accent)' : 'var(--t-line)',
                opacity:    saving ? 0.7 : 1,
                cursor:     saving || !orderLines.length ? 'not-allowed' : 'pointer',
              }}>
              {saving ? 'Saving…' : 'Save Order'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
