import { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  createManualOrder,
  getDashMenu,
  getDashTables,
} from '../../../../services/dashboardService';
import { todayStr, fmtCurrency } from './helpers';

export default function ManualOrderModal({ onClose, onSaved }) {
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
              <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-1"
                style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)', colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t-dim)' }}>Customer</label>
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Optional"
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-1"
                style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)' }} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t-dim)' }}>Table</label>
              <select value={tableId} onChange={(e) => setTableId(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)', colorScheme: 'dark' }}>
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
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu items..."
              className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none mb-2"
              style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)' }} />
            <div className="rounded-xl overflow-hidden flex flex-col divide-y"
              style={{ border: '1px solid var(--t-line)', divideColor: 'var(--t-line)', maxHeight: 240, overflowY: 'auto' }}>
              {filteredItems.length === 0 ? (
                <p className="text-center py-6 text-sm" style={{ color: 'var(--t-dim)' }}>No items found</p>
              ) : filteredItems.map((item) => {
                const availVariants = (item.variants ?? []).filter((v) => v.isAvailable !== false);
                return (
                  <div key={item._id} style={{ borderBottom: '1px solid var(--t-line)' }}>
                    <div className="flex items-center gap-3 px-3 py-2.5" style={{ background: 'var(--t-surface)' }}>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.is_veg !== false ? '#22c55e' : '#ef4444' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.name}</p>
                        <p className="text-[10px]" style={{ color: 'var(--t-dim)' }}>{item.category}</p>
                      </div>
                      <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--t-accent)' }}>₹{item.price}</span>
                      {!item.has_variants ? (
                        <button type="button" onClick={() => addLine(item)}
                          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-sm transition-colors"
                          style={{ background: 'var(--t-accent)' }}>+</button>
                      ) : (
                        <button type="button" onClick={() => setExpandedItemId(expandedItemId === item._id ? null : item._id)}
                          className="shrink-0 text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors"
                          style={{
                            background: expandedItemId === item._id ? 'var(--t-accent)' : 'var(--t-accent-10)',
                            color: expandedItemId === item._id ? '#fff' : 'var(--t-accent)',
                          }}>
                          {expandedItemId === item._id ? 'Close' : 'Choose'}
                        </button>
                      )}
                    </div>
                    {item.has_variants && expandedItemId === item._id && (
                      <div className="flex flex-wrap gap-1.5 px-3 pb-2.5 pt-1" style={{ background: 'var(--t-float)' }}>
                        {availVariants.map((v) => (
                          <button key={v.name} type="button" onClick={() => addLine(item, v)}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors"
                            style={{ background: 'var(--t-surface)', borderColor: 'var(--t-accent-40)', color: 'var(--t-text)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--t-accent-10)'; e.currentTarget.style.color = 'var(--t-accent)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--t-surface)'; e.currentTarget.style.color = 'var(--t-text)'; }}>
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
                  <div key={line.key} className="flex items-center gap-3 rounded-xl px-3 py-2"
                    style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{line.menuItem.name}</p>
                      {line.selectedVariant && (
                        <p className="text-[11px]" style={{ color: 'var(--t-dim)' }}>{line.selectedVariant.name}</p>
                      )}
                    </div>
                    <div className="flex items-center rounded-lg overflow-hidden shrink-0" style={{ border: '1.5px solid var(--t-accent-40)', height: 28 }}>
                      <button type="button" onClick={() => updateQty(line.key, -1)} className="w-7 flex items-center justify-center font-bold" style={{ color: 'var(--t-accent)' }}>−</button>
                      <span className="px-2 text-sm font-bold text-white tabular-nums" style={{ borderLeft: '1px solid var(--t-accent-40)', borderRight: '1px solid var(--t-accent-40)' }}>{line.qty}</span>
                      <button type="button" onClick={() => updateQty(line.key, 1)} className="w-7 flex items-center justify-center font-bold" style={{ color: 'var(--t-accent)' }}>+</button>
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
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" rows={2}
              className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
              style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)' }} />
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
          <button type="button" onClick={handleSave} disabled={saving || !orderLines.length}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: orderLines.length ? 'var(--t-accent)' : 'var(--t-line)',
              opacity: saving ? 0.7 : 1,
              cursor: saving || !orderLines.length ? 'not-allowed' : 'pointer',
            }}>
            {saving ? 'Saving…' : 'Save Order'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
