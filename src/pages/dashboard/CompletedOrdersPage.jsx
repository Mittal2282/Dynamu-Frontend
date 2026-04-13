import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import * as XLSX from 'xlsx';
import {
  getCompletedOrders,
  createManualOrder,
  createBulkOrders,
  getDashMenu,
  getDashTables,
} from '../../services/adminService';

// ── Helpers ───────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split('T')[0];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function fmtCurrency(n) {
  if (n == null) return '—';
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

// ── Source badge ──────────────────────────────────────────────────────────────

function SourceBadge({ source }) {
  if (!source || source === 'platform') return null;
  const cfg = source === 'bulk'
    ? { label: 'Bulk', bg: 'rgba(168,85,247,0.12)', color: '#a855f7', border: 'rgba(168,85,247,0.25)' }
    : { label: 'Manual', bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: 'rgba(59,130,246,0.25)' };
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfgMap = {
    completed: { label: 'Completed', bg: 'rgba(34,197,94,0.1)',  color: '#22c55e', border: 'rgba(34,197,94,0.2)'  },
    served:    { label: 'Served',    bg: 'rgba(34,197,94,0.07)', color: '#4ade80', border: 'rgba(34,197,94,0.15)' },
    cancelled: { label: 'Cancelled', bg: 'rgba(239,68,68,0.1)',  color: '#ef4444', border: 'rgba(239,68,68,0.2)'  },
  };
  const cfg = cfgMap[status] ?? cfgMap.completed;
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}

// ── Order Detail Drawer ───────────────────────────────────────────────────────

function OrderDetailDrawer({ order, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  if (!order) return null;

  const subtotal      = order.subtotal       ?? 0;
  const tax           = order.tax_amount     ?? 0;
  const svc           = order.service_charge ?? 0;
  const total         = order.total_amount   ?? 0;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex" aria-modal="true">
      {/* Backdrop */}
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="w-full max-w-md flex flex-col overflow-hidden shadow-2xl animate-slide-in-right"
        style={{ background: 'var(--t-bg)', borderLeft: '1px solid var(--t-line)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--t-line)' }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--t-accent)' }}>
              Order #{order.order_number}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--t-dim)' }}>
              {fmtDate(order.createdAt)} · {fmtTime(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <SourceBadge source={order.source} />
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--t-dim)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t-dim)'; }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="px-5 py-3 shrink-0 flex flex-wrap gap-3" style={{ borderBottom: '1px solid var(--t-line)' }}>
          {order.customer_name && (
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--t-dim)' }}>Customer</p>
              <p className="text-sm font-medium text-white">{order.customer_name}</p>
            </div>
          )}
          {order.table?.table_number && (
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--t-dim)' }}>Table</p>
              <p className="text-sm font-medium text-white">#{order.table.table_number}</p>
            </div>
          )}
          {order.payment_status && (
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--t-dim)' }}>Payment</p>
              <p className="text-sm font-medium" style={{ color: order.payment_status === 'paid' ? '#22c55e' : 'var(--t-dim)' }}>
                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </p>
            </div>
          )}
          {order.notes && (
            <div className="w-full">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--t-dim)' }}>Notes</p>
              <p className="text-sm" style={{ color: 'var(--t-text)' }}>{order.notes}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2.5">
          {(order.items ?? []).map((item, i) => {
            const isVeg    = item.menu_item?.is_veg ?? item.is_veg;
            const imageUrl = item.menu_item?.image_url;
            const variantLabel = item.variant_name
              ? (item.variant_group ? `${item.variant_group} · ${item.variant_name}` : item.variant_name)
              : null;
            return (
              <div
                key={i}
                className="flex items-start gap-3 py-2.5 px-3 rounded-xl"
                style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)' }}
              >
                {/* Thumbnail */}
                <div className="relative shrink-0" style={{ width: 52, height: 52 }}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full rounded-xl items-center justify-center text-2xl"
                    style={{ background: 'var(--t-float)', display: imageUrl ? 'none' : 'flex' }}
                  >
                    {isVeg ? '🥗' : '🍗'}
                  </div>
                  <span
                    className="absolute bottom-0.5 left-0.5 w-2.5 h-2.5 rounded-full border-2"
                    style={{ background: isVeg ? '#22c55e' : '#ef4444', borderColor: 'var(--t-bg)' }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-snug">{item.name}</p>
                      {variantLabel && (
                        <p className="text-[11px]" style={{ color: 'var(--t-dim)' }}>{variantLabel}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: 'var(--t-text)' }}>
                        {fmtCurrency((item.unit_price ?? 0) * item.quantity)}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--t-dim)' }}>
                        {item.quantity} × {fmtCurrency(item.unit_price ?? 0)}
                      </p>
                    </div>
                  </div>
                  {item.special_instructions && (
                    <p
                      className="mt-1 text-[11px] px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
                    >
                      {item.special_instructions}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer totals */}
        <div
          className="px-5 py-4 shrink-0 flex flex-col gap-1.5"
          style={{ borderTop: '1px solid var(--t-line)', background: 'var(--t-surface)' }}
        >
          {[
            { label: 'Subtotal', value: subtotal },
            ...(tax   > 0 ? [{ label: 'Tax',            value: tax }] : []),
            ...(svc   > 0 ? [{ label: 'Service Charge', value: svc }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm" style={{ color: 'var(--t-dim)' }}>
              <span>{label}</span>
              <span>{fmtCurrency(value)}</span>
            </div>
          ))}
          <div
            className="flex justify-between pt-2 mt-1 font-bold text-base text-white"
            style={{ borderTop: '1px solid var(--t-line)' }}
          >
            <span>Total</span>
            <span style={{ color: 'var(--t-accent)' }}>{fmtCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Manual Order Modal ────────────────────────────────────────────────────────

function ManualOrderModal({ onClose, onSaved }) {
  const [date, setDate] = useState(todayStr());
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [tableId, setTableId] = useState('');
  const [search, setSearch] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [orderLines, setOrderLines] = useState([]); // [{ menuItem, selectedVariant, qty }]
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    getDashMenu().then(setMenuItems).catch(() => {});
    getDashTables().then(setTables).catch(() => {});
  }, []);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return menuItems;
    const q = search.toLowerCase();
    return menuItems.filter(
      (m) => m.name?.toLowerCase().includes(q) || m.category?.toLowerCase().includes(q)
    );
  }, [menuItems, search]);

  const addLine = (menuItem, variant = null) => {
    const key = variant ? `${menuItem._id}__${variant.name}` : menuItem._id;
    setOrderLines((prev) => {
      const exists = prev.findIndex((l) => l.key === key);
      if (exists > -1) {
        return prev.map((l, i) => i === exists ? { ...l, qty: l.qty + 1 } : l);
      }
      return [...prev, { key, menuItem, selectedVariant: variant, qty: 1 }];
    });
    setExpandedItemId(null);
  };

  const updateQty = (key, delta) => {
    setOrderLines((prev) =>
      prev.map((l) => l.key === key ? { ...l, qty: Math.max(1, l.qty + delta) } : l)
    );
  };

  const removeLine = (key) => {
    setOrderLines((prev) => prev.filter((l) => l.key !== key));
  };

  const linePrice = (line) => {
    const base = line.menuItem.price ?? 0;
    const up   = line.selectedVariant?.price ?? 0;
    const disc = line.selectedVariant?.discount_percentage ?? line.menuItem.discount_percentage ?? 0;
    return (base + up) * (1 - disc / 100) * line.qty;
  };

  const total = orderLines.reduce((s, l) => s + linePrice(l), 0);

  const handleSave = async () => {
    if (!orderLines.length) return;
    setSaving(true);
    setError('');
    try {
      const items = orderLines.map((l) => ({
        menu_item_id:        l.menuItem._id,
        quantity:            l.qty,
        ...(l.selectedVariant ? {
          variant_name:  l.selectedVariant.name,
          variant_group: l.selectedVariant.groupName ?? null,
        } : {}),
      }));
      const order = await createManualOrder({
        items,
        customer_name: customerName.trim() || undefined,
        notes:         notes.trim()        || undefined,
        table_id:      tableId             || undefined,
        order_date:    date,
      });
      onSaved(order);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message ?? err.message ?? 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--t-bg)', border: '1px solid var(--t-line)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--t-line)' }}>
          <p className="font-bold text-white">Add Manual Order</p>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--t-dim)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t-dim)'; }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Meta fields */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t-dim)' }}>Date *</label>
              <input
                type="date"
                value={date}
                max={todayStr()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-1"
                style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)', colorScheme: 'dark', focusRingColor: 'var(--t-accent)' }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t-dim)' }}>Customer</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-1"
                style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)' }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t-dim)' }}>Table</label>
              <select
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)', colorScheme: 'dark' }}
              >
                <option value="">— None —</option>
                {tables.map((t) => (
                  <option key={t._id} value={t._id}>Table #{t.table_number}{t.name ? ` (${t.name})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Item catalog */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--t-dim)' }}>Add Items</p>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu items..."
              className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none mb-2"
              style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)' }}
            />
            <div
              className="rounded-xl overflow-hidden flex flex-col divide-y"
              style={{ border: '1px solid var(--t-line)', divideColor: 'var(--t-line)', maxHeight: 240, overflowY: 'auto' }}
            >
              {filteredItems.length === 0 ? (
                <p className="text-center py-6 text-sm" style={{ color: 'var(--t-dim)' }}>No items found</p>
              ) : filteredItems.map((item) => {
                const availVariants = (item.variants ?? []).filter((v) => v.isAvailable !== false);
                return (
                  <div key={item._id} style={{ borderBottom: '1px solid var(--t-line)' }}>
                    <div className="flex items-center gap-3 px-3 py-2.5" style={{ background: 'var(--t-surface)' }}>
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: item.is_veg !== false ? '#22c55e' : '#ef4444' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.name}</p>
                        <p className="text-[10px]" style={{ color: 'var(--t-dim)' }}>{item.category}</p>
                      </div>
                      <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--t-accent)' }}>₹{item.price}</span>
                      {!item.has_variants ? (
                        <button
                          type="button"
                          onClick={() => addLine(item)}
                          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-sm transition-colors"
                          style={{ background: 'var(--t-accent)' }}
                        >+</button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setExpandedItemId(expandedItemId === item._id ? null : item._id)}
                          className="shrink-0 text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors"
                          style={{
                            background: expandedItemId === item._id ? 'var(--t-accent)' : 'var(--t-accent-10)',
                            color: expandedItemId === item._id ? '#fff' : 'var(--t-accent)',
                          }}
                        >
                          {expandedItemId === item._id ? 'Close' : 'Choose'}
                        </button>
                      )}
                    </div>
                    {/* Variant selector */}
                    {item.has_variants && expandedItemId === item._id && (
                      <div className="flex flex-wrap gap-1.5 px-3 pb-2.5 pt-1" style={{ background: 'var(--t-float)' }}>
                        {availVariants.map((v) => (
                          <button
                            key={v.name}
                            type="button"
                            onClick={() => addLine(item, v)}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors"
                            style={{ background: 'var(--t-surface)', borderColor: 'var(--t-accent-40)', color: 'var(--t-text)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--t-accent-10)'; e.currentTarget.style.color = 'var(--t-accent)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--t-surface)'; e.currentTarget.style.color = 'var(--t-text)'; }}
                          >
                            {v.name}{v.price !== 0 ? ` (+₹${v.price})` : ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order lines */}
          {orderLines.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--t-dim)' }}>Order Items</p>
              <div className="flex flex-col gap-1.5">
                {orderLines.map((line) => (
                  <div
                    key={line.key}
                    className="flex items-center gap-3 rounded-xl px-3 py-2"
                    style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{line.menuItem.name}</p>
                      {line.selectedVariant && (
                        <p className="text-[11px]" style={{ color: 'var(--t-dim)' }}>{line.selectedVariant.name}</p>
                      )}
                    </div>
                    {/* Qty stepper */}
                    <div className="flex items-center rounded-lg overflow-hidden shrink-0" style={{ border: '1.5px solid var(--t-accent-40)', height: 28 }}>
                      <button type="button" onClick={() => updateQty(line.key, -1)}
                        className="w-7 flex items-center justify-center font-bold" style={{ color: 'var(--t-accent)' }}>−</button>
                      <span className="px-2 text-sm font-bold text-white tabular-nums" style={{ borderLeft: '1px solid var(--t-accent-40)', borderRight: '1px solid var(--t-accent-40)' }}>{line.qty}</span>
                      <button type="button" onClick={() => updateQty(line.key, 1)}
                        className="w-7 flex items-center justify-center font-bold" style={{ color: 'var(--t-accent)' }}>+</button>
                    </div>
                    <span className="text-sm font-semibold shrink-0 w-16 text-right" style={{ color: 'var(--t-accent)' }}>
                      {fmtCurrency(linePrice(line))}
                    </span>
                    <button type="button" onClick={() => removeLine(line.key)} className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ color: 'var(--t-dim)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t-dim)'; }}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                <div className="flex justify-between px-3 pt-1 font-bold text-sm text-white">
                  <span>Estimated Total</span>
                  <span style={{ color: 'var(--t-accent)' }}>{fmtCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t-dim)' }}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              rows={2}
              className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
              style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)' }}
            />
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 shrink-0" style={{ borderTop: '1px solid var(--t-line)' }}>
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ color: 'var(--t-dim)', background: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !orderLines.length}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: orderLines.length ? 'var(--t-accent)' : 'var(--t-line)',
              opacity: saving ? 0.7 : 1,
              cursor: saving || !orderLines.length ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : 'Save Order'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Bulk Upload Modal ─────────────────────────────────────────────────────────

function BulkUploadModal({ onClose, onSaved }) {
  const [date, setDate] = useState(todayStr());
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [preview, setPreview] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const parseFile = useCallback(async (f) => {
    setFile(f);
    setError('');
    setResult(null);
    try {
      const ab = await f.arrayBuffer();
      const wb = XLSX.read(ab, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      setRows(parsed);
      setPreview(parsed.slice(0, 10));
    } catch {
      setError('Could not parse file. Use .xlsx, .xls, or .csv format.');
    }
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) parseFile(f);
  };

  const handleSave = async () => {
    if (!rows.length) return;
    setSaving(true);
    setError('');
    try {
      const res = await createBulkOrders(rows, date);
      setResult(res);
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message ?? err.message ?? 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const COLS = ['Item Name', 'Variant Name', 'Quantity', 'Special Instructions'];

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-xl flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--t-bg)', border: '1px solid var(--t-line)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--t-line)' }}>
          <p className="font-bold text-white">Bulk Upload Orders</p>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--t-dim)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t-dim)'; }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Date */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t-dim)' }}>Order Date (applied to all items) *</label>
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => setDate(e.target.value)}
              className="w-48 rounded-xl px-3 py-2 text-sm text-white outline-none"
              style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)', colorScheme: 'dark' }}
            />
          </div>

          {/* Drop zone */}
          {!result && (
            <div>
              <div
                className="relative flex flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center transition-colors cursor-pointer"
                style={{
                  border: `2px dashed ${dragging ? 'var(--t-accent)' : 'var(--t-line)'}`,
                  background: dragging ? 'var(--t-accent-10)' : 'var(--t-surface)',
                }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: dragging ? 'var(--t-accent)' : 'var(--t-dim)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div>
                  <p className="font-semibold text-white">{file ? file.name : 'Drop your file here'}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--t-dim)' }}>
                    {file ? `${rows.length} rows parsed` : 'or click to browse — .xlsx, .xls, .csv'}
                  </p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="sr-only"
                  onChange={(e) => { if (e.target.files[0]) parseFile(e.target.files[0]); }}
                />
              </div>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && !result && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--t-dim)' }}>
                Preview (first {preview.length} rows)
              </p>
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--t-line)' }}>
                <table className="w-full text-sm min-w-max">
                  <thead>
                    <tr style={{ background: 'var(--t-float)' }}>
                      {COLS.map((c) => (
                        <th key={c} className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-dim)' }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--t-line)' }}>
                        <td className="px-3 py-2 text-white">{r['Item Name'] ?? r.item_name ?? '—'}</td>
                        <td className="px-3 py-2" style={{ color: 'var(--t-dim)' }}>{r['Variant Name'] ?? r.variant_name ?? '—'}</td>
                        <td className="px-3 py-2" style={{ color: 'var(--t-dim)' }}>{r['Quantity'] ?? r.quantity ?? '1'}</td>
                        <td className="px-3 py-2 max-w-[160px] truncate" style={{ color: 'var(--t-dim)' }}>{r['Special Instructions'] ?? r.special_instructions ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <p className="font-semibold" style={{ color: '#22c55e' }}>Upload complete!</p>
              <p className="text-sm" style={{ color: 'var(--t-text)' }}>
                {result.created} item{result.created !== 1 ? 's' : ''} saved
                {result.failed?.length > 0 ? `, ${result.failed.length} skipped` : ''}.
              </p>
              {result.failed?.length > 0 && (
                <div className="mt-1 flex flex-col gap-1">
                  {result.failed.map((f, i) => (
                    <p key={i} className="text-[11px]" style={{ color: '#f59e0b' }}>
                      Row {f.row}: {f.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm px-3 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 shrink-0" style={{ borderTop: '1px solid var(--t-line)' }}>
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ color: 'var(--t-dim)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !rows.length}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white"
              style={{
                background: rows.length ? 'var(--t-accent)' : 'var(--t-line)',
                opacity: saving ? 0.7 : 1,
                cursor: saving || !rows.length ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Uploading…' : `Save ${rows.length} Row${rows.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Export Modal ──────────────────────────────────────────────────────────────

function ExportModal({ onClose }) {
  const thirtyDaysAgo = (() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  })();

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo,   setDateTo]   = useState(todayStr());
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      const orders = await getCompletedOrders({ dateFrom, dateTo });
      const exportRows = orders.map((o) => ({
        'Order #':        o.order_number ?? '',
        'Date':           fmtDate(o.createdAt),
        'Time':           fmtTime(o.createdAt),
        'Customer':       o.customer_name ?? '—',
        'Table':          o.table?.table_number ? `#${o.table.table_number}` : '—',
        'Items':          (o.items ?? []).map((i) =>
                            `${i.name}${i.variant_name ? ` (${i.variant_name})` : ''} ×${i.quantity}`
                          ).join('; '),
        'Subtotal':       o.subtotal        ?? 0,
        'Tax':            o.tax_amount      ?? 0,
        'Service Charge': o.service_charge  ?? 0,
        'Total':          o.total_amount    ?? 0,
        'Status':         o.status          ?? '',
        'Payment':        o.payment_status  ?? '',
        'Source':         o.source          ?? 'platform',
        'Notes':          o.notes           ?? '',
      }));

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Orders');
      XLSX.writeFile(wb, `orders_${dateFrom}_${dateTo}.xlsx`);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message ?? err.message ?? 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-sm flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--t-bg)', border: '1px solid var(--t-line)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--t-line)' }}>
          <p className="font-bold text-white">Export Orders</p>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--t-dim)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t-dim)'; }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t-dim)' }}>From</label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)', colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t-dim)' }}>To</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                max={todayStr()}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)', colorScheme: 'dark' }}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>
          )}

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all"
            style={{ background: 'var(--t-accent)', opacity: exporting ? 0.7 : 1 }}
          >
            {exporting ? 'Exporting…' : 'Download Excel'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Download sample sheet ─────────────────────────────────────────────────────

function downloadSampleSheet() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Item Name', 'Variant Name', 'Quantity', 'Special Instructions'],
    ['Butter Chicken', '', '2', 'Less spicy'],
    ['Biryani', 'Chicken', '1', ''],
    ['Margherita Pizza', 'Large', '1', 'Extra cheese'],
  ]);
  ws['!cols'] = [{ wch: 24 }, { wch: 16 }, { wch: 10 }, { wch: 28 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Orders Template');
  XLSX.writeFile(wb, 'dynamu_orders_template.xlsx');
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CompletedOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(todayStr());
  const [dateTo,   setDateTo]   = useState(todayStr());
  const [search,   setSearch]   = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [showBulk,   setShowBulk]   = useState(false);
  const [showExport, setShowExport] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCompletedOrders({ dateFrom, dateTo });
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        (o.items ?? []).some((i) => i.name?.toLowerCase().includes(q))
    );
  }, [orders, search]);

  const handleManualSaved = (order) => {
    setOrders((prev) => [order, ...prev]);
  };

  const handleBulkSaved = () => {
    fetchOrders();
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Order History</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--t-dim)' }}>
            Completed &amp; served orders · {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadSampleSheet}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)', color: 'var(--t-dim)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--t-line)'; e.currentTarget.style.color = 'var(--t-dim)'; }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Sample Sheet
          </button>
          <button
            type="button"
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)', color: 'var(--t-dim)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--t-line)'; e.currentTarget.style.color = 'var(--t-dim)'; }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export
          </button>
          <button
            type="button"
            onClick={() => setShowBulk(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)', color: 'var(--t-dim)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--t-line)'; e.currentTarget.style.color = 'var(--t-dim)'; }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            Bulk Upload
          </button>
          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
            style={{ background: 'var(--t-accent)', boxShadow: '0 4px 14px var(--t-accent-40)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Add Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="flex flex-col sm:flex-row gap-3 p-3.5 rounded-2xl"
        style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)' }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-[10px] font-semibold uppercase tracking-wider shrink-0" style={{ color: 'var(--t-dim)' }}>From</label>
          <input
            type="date"
            value={dateFrom}
            max={dateTo}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl px-3 py-1.5 text-sm text-white outline-none"
            style={{ background: 'var(--t-float)', border: '1px solid var(--t-line)', colorScheme: 'dark' }}
          />
          <label className="text-[10px] font-semibold uppercase tracking-wider shrink-0" style={{ color: 'var(--t-dim)' }}>To</label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            max={todayStr()}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl px-3 py-1.5 text-sm text-white outline-none"
            style={{ background: 'var(--t-float)', border: '1px solid var(--t-line)', colorScheme: 'dark' }}
          />
        </div>
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--t-dim)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, customer, or item name…"
            className="w-full rounded-xl pl-9 pr-3 py-1.5 text-sm text-white outline-none"
            style={{ background: 'var(--t-float)', border: '1px solid var(--t-line)' }}
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="flex-1 rounded-2xl overflow-hidden flex flex-col min-h-0"
        style={{ border: '1px solid var(--t-line)', background: 'var(--t-bg)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--t-accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <span className="text-3xl">📋</span>
            <p className="text-sm font-semibold text-white">No orders found</p>
            <p className="text-xs" style={{ color: 'var(--t-dim)' }}>
              {search ? 'Try a different search term' : 'Try adjusting the date range or add a manual order'}
            </p>
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full border-collapse" style={{ minWidth: 720 }}>
              <thead>
                <tr style={{ background: 'var(--t-surface)', borderBottom: '2px solid var(--t-line)' }}>
                  {[
                    { label: 'Date & Time',   w: '130px' },
                    { label: 'Order #',        w: '140px' },
                    { label: 'Customer',       w: '120px' },
                    { label: 'Items',          w: 'auto'  },
                    { label: 'Table',          w: '70px'  },
                    { label: 'Total',          w: '90px'  },
                    { label: 'Status',         w: '100px' },
                  ].map(({ label, w }) => (
                    <th
                      key={label}
                      className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest select-none sticky top-0"
                      style={{ color: 'var(--t-dim)', width: w, background: 'var(--t-surface)', whiteSpace: 'nowrap' }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, idx) => {
                  const itemSummary = (order.items ?? [])
                    .map((i) => `${i.name}${i.variant_name ? ` (${i.variant_name})` : ''} ×${i.quantity}`)
                    .join(' · ');
                  const isEven = idx % 2 === 0;

                  return (
                    <tr
                      key={order._id}
                      className="cursor-pointer transition-colors duration-100 group"
                      style={{ background: isEven ? 'var(--t-bg)' : 'color-mix(in srgb, var(--t-surface) 50%, var(--t-bg))', borderBottom: '1px solid var(--t-line)' }}
                      onClick={() => setSelectedOrder(order)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--t-accent) 6%, var(--t-surface))'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = isEven ? 'var(--t-bg)' : 'color-mix(in srgb, var(--t-surface) 50%, var(--t-bg))'; }}
                    >
                      {/* Date / Time */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-xs font-semibold text-white">{fmtDate(order.createdAt)}</p>
                        <p className="text-[10px] mt-0.5 tabular-nums" style={{ color: 'var(--t-dim)' }}>{fmtTime(order.createdAt)}</p>
                      </td>

                      {/* Order # + source */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="font-mono text-xs font-bold tracking-tight"
                            style={{ color: 'var(--t-accent)' }}
                          >
                            #{order.order_number}
                          </span>
                          <SourceBadge source={order.source} />
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5 max-w-[120px]">
                        <p
                          className="text-sm truncate"
                          style={{ color: order.customer_name ? 'var(--t-text)' : 'var(--t-dim)' }}
                        >
                          {order.customer_name ?? '—'}
                        </p>
                      </td>

                      {/* Items summary */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--t-dim)' }}>
                          {itemSummary || '—'}
                        </p>
                        {(order.items?.length ?? 0) > 0 && (
                          <p className="text-[10px] mt-0.5 font-semibold" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            {order.items.reduce((s, i) => s + (i.quantity ?? 0), 0)} item{order.items.reduce((s, i) => s + (i.quantity ?? 0), 0) !== 1 ? 's' : ''}
                          </p>
                        )}
                      </td>

                      {/* Table # */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {order.table?.table_number ? (
                          <span
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold"
                            style={{ background: 'var(--t-float)', color: 'var(--t-text)', border: '1px solid var(--t-line)' }}
                          >
                            {order.table.table_number}
                          </span>
                        ) : (
                          <span className="text-sm" style={{ color: 'var(--t-dim)' }}>—</span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-sm font-bold text-white tabular-nums">{fmtCurrency(order.total_amount)}</p>
                        {(order.tax_amount > 0 || order.service_charge > 0) && (
                          <p className="text-[10px] mt-0.5 tabular-nums" style={{ color: 'var(--t-dim)' }}>
                            +{fmtCurrency((order.tax_amount ?? 0) + (order.service_charge ?? 0))} tax
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer row count */}
        {!loading && filtered.length > 0 && (
          <div
            className="px-4 py-2.5 shrink-0 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--t-line)', background: 'var(--t-surface)' }}
          >
            <p className="text-[11px]" style={{ color: 'var(--t-dim)' }}>
              {filtered.length} order{filtered.length !== 1 ? 's' : ''}
              {filtered.length !== orders.length ? ` (filtered from ${orders.length})` : ''}
            </p>
            <p className="text-[11px] font-semibold" style={{ color: 'var(--t-dim)' }}>
              Total revenue:&nbsp;
              <span className="text-white">{fmtCurrency(filtered.reduce((s, o) => s + (o.total_amount ?? 0), 0))}</span>
            </p>
          </div>
        )}
      </div>

      {/* Portals */}
      {selectedOrder && (
        <OrderDetailDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
      {showManual && (
        <ManualOrderModal onClose={() => setShowManual(false)} onSaved={handleManualSaved} />
      )}
      {showBulk && (
        <BulkUploadModal onClose={() => setShowBulk(false)} onSaved={handleBulkSaved} />
      )}
      {showExport && (
        <ExportModal onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}
