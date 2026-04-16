import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCompletedOrders } from '../../../../services/dashboardService';
import { todayStr, fmtDate, fmtTime, fmtCurrency, downloadSampleSheet } from './helpers';
import { StatusBadge, SourceBadge } from './badges';
import OrderDetailDrawer from './OrderDetailDrawer';
import ManualOrderModal from './ManualOrderModal';
import BulkUploadModal from './BulkUploadModal';
import ExportModal from './ExportModal';

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
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-xs font-semibold text-white">{fmtDate(order.createdAt)}</p>
                        <p className="text-[10px] mt-0.5 tabular-nums" style={{ color: 'var(--t-dim)' }}>{fmtTime(order.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold tracking-tight" style={{ color: 'var(--t-accent)' }}>
                            #{order.order_number}
                          </span>
                          <SourceBadge source={order.source} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-[120px]">
                        <p className="text-sm truncate" style={{ color: order.customer_name ? 'var(--t-text)' : 'var(--t-dim)' }}>
                          {order.customer_name ?? '—'}
                        </p>
                      </td>
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
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-sm font-bold text-white tabular-nums">{fmtCurrency(order.total_amount)}</p>
                        {(order.tax_amount > 0 || order.service_charge > 0) && (
                          <p className="text-[10px] mt-0.5 tabular-nums" style={{ color: 'var(--t-dim)' }}>
                            +{fmtCurrency((order.tax_amount ?? 0) + (order.service_charge ?? 0))} tax
                          </p>
                        )}
                      </td>
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
