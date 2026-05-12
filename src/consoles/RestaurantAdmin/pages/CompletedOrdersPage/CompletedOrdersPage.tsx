import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCompletedOrders } from '../../../../services/dashboardService';
import { todayStr, fmtDate, fmtTime, fmtCurrency, downloadSampleSheet } from './helpers';
import { StatusBadge, SourceBadge } from './badges';
import OrderDetailDrawer from './OrderDetailDrawer';
import ManualOrderModal from './ManualOrderModal';
import BulkUploadModal from './BulkUploadModal';
import ExportModal from './ExportModal';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItemSummary {
  name: string;
  variant_name?: string;
  quantity?: number;
}

interface CompletedOrder {
  _id: string;
  order_number?: string | number;
  createdAt?: string;
  customer_name?: string;
  table?: { table_number?: number | string };
  items?: OrderItemSummary[];
  total_amount?: number;
  status?: string;
  source?: string;
  subtotal?: number;
  service_charge?: number;
  payment_status?: string;
  notes?: string;
}

export default function CompletedOrdersPage() {
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(todayStr());
  const [dateTo,   setDateTo]   = useState(todayStr());
  const [search,   setSearch]   = useState('');
  const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [showBulk,   setShowBulk]   = useState(false);
  const [showExport, setShowExport] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCompletedOrders({ dateFrom, dateTo }) as CompletedOrder[];
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = useMemo<CompletedOrder[]>(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        String(o.order_number ?? '').toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        (o.items ?? []).some((i) => i.name?.toLowerCase().includes(q))
    );
  }, [orders, search]);

  const handleManualSaved = (order: unknown) => {
    setOrders((prev) => [order as CompletedOrder, ...prev]);
  };

  const handleBulkSaved = () => {
    fetchOrders();
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--t-text)' }}>Order History</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--t-dim)' }}>
            Completed &amp; served orders · {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <button type="button" onClick={downloadSampleSheet} className="btn btn-sm btn-ghost gap-1.5 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Sample Sheet
          </button>
          <button type="button" onClick={() => setShowExport(true)} className="btn btn-sm btn-ghost gap-1.5 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export
          </button>
          <button type="button" onClick={() => setShowBulk(true)} className="btn btn-sm btn-ghost gap-1.5 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            Bulk Upload
          </button>
          <button type="button" onClick={() => setShowManual(true)} className="btn btn-sm btn-primary gap-1.5 text-xs">
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
            className="input input-bordered input-sm text-sm"
          />
          <label className="text-[10px] font-semibold uppercase tracking-wider shrink-0" style={{ color: 'var(--t-dim)' }}>To</label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            max={todayStr()}
            onChange={(e) => setDateTo(e.target.value)}
            className="input input-bordered input-sm text-sm"
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
            className="input input-bordered input-sm w-full pl-9 text-sm"
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
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <span className="text-3xl">📋</span>
            <p className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>No orders found</p>
            <p className="text-xs" style={{ color: 'var(--t-dim)' }}>
              {search ? 'Try a different search term' : 'Try adjusting the date range or add a manual order'}
            </p>
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="table table-zebra table-sm w-full" style={{ minWidth: 720 }}>
              <thead className="sticky top-0">
                <tr>
                  {[
                    { label: 'Date & Time',   w: '130px' },
                    { label: 'Order #',        w: '140px' },
                    { label: 'Customer',       w: '120px' },
                    { label: 'Items',          w: 'auto'  },
                    { label: 'Table',          w: '70px'  },
                    { label: 'Total',          w: '90px'  },
                    { label: 'Status',         w: '100px' },
                  ].map(({ label, w }) => (
                    <th key={label} className="text-[10px] font-bold uppercase tracking-widest select-none whitespace-nowrap" style={{ width: w, color: 'var(--t-dim)' }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const itemSummary = (order.items ?? [])
                    .map((i) => `${i.name}${i.variant_name ? ` (${i.variant_name})` : ''} ×${i.quantity}`)
                    .join(' · ');
                  const itemsArr = order.items ?? [];
                  const totalItemCount = itemsArr.reduce((s, i) => s + (i.quantity ?? 0), 0);

                  return (
                    <tr
                      key={order._id}
                      className="cursor-pointer hover"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-xs font-semibold" style={{ color: 'var(--t-text)' }}>{fmtDate(order.createdAt)}</p>
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
                        {itemsArr.length > 0 && (
                          <p className="text-[10px] mt-0.5 font-semibold" style={{ color: 'var(--t-dim)' }}>
                            {totalItemCount} item{totalItemCount !== 1 ? 's' : ''}
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
                        <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--t-text)' }}>{fmtCurrency(order.total_amount)}</p>
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
