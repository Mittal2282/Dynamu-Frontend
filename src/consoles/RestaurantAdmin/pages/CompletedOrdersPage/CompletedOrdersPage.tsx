import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatePicker, Spin, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { getCompletedOrders } from '../../../../services/dashboardService';
import { todayStr, fmtDate, fmtTime, fmtCurrency, downloadSampleSheet } from './helpers';
import { StatusBadge, SourceBadge } from './badges';
import OrderDetailDrawer from './OrderDetailDrawer';
import type { CompletedOrder } from './OrderDetailDrawer';
import ManualOrderModal from './ManualOrderModal';
import BulkUploadModal from './BulkUploadModal';
import ExportModal from './ExportModal';

type StatusFilter = 'all' | 'completed' | 'served' | 'cancelled';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'completed', label: 'Completed' },
  { key: 'served',    label: 'Served'    },
  { key: 'cancelled', label: 'Cancelled' },
];

const ORDER_COLUMNS: ColumnsType<CompletedOrder> = [
  {
    title: 'Date & Time',
    key: 'datetime',
    width: 120,
    render: (_, o) => (
      <>
        <p className="text-xs font-semibold" style={{ color: 'var(--t-text)' }}>{fmtDate(o.createdAt)}</p>
        <p className="text-[10px] mt-0.5 tabular-nums" style={{ color: 'var(--t-dim)' }}>{fmtTime(o.createdAt)}</p>
      </>
    ),
  },
  {
    title: 'Order #',
    key: 'order_number',
    width: 145,
    render: (_, o) => (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-mono text-xs font-bold tracking-tight" style={{ color: 'var(--t-accent)' }}>#{o.order_number}</span>
        <SourceBadge source={o.source} />
      </div>
    ),
  },
  {
    title: 'Customer',
    key: 'customer',
    width: 110,
    render: (_, o) => (
      <p className="text-xs truncate" style={{ color: o.customer_name ? 'var(--t-text)' : 'var(--t-dim)' }}>
        {o.customer_name ?? '—'}
      </p>
    ),
  },
  {
    title: 'Items',
    key: 'items',
    render: (_, o) => {
      const itemsArr = o.items ?? [];
      const totalItemCount = itemsArr.reduce((s, i) => s + (i.quantity ?? 0), 0);
      const itemSummary = itemsArr
        .map((i) => `${i.name}${i.variant_name ? ` (${i.variant_name})` : ''} ×${i.quantity}`)
        .join(' · ');
      return (
        <>
          <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--t-dim)' }}>{itemSummary || '—'}</p>
          {totalItemCount > 0 && (
            <p className="text-[10px] mt-0.5 font-semibold" style={{ color: 'var(--t-dim)' }}>
              {totalItemCount} item{totalItemCount !== 1 ? 's' : ''}
            </p>
          )}
        </>
      );
    },
  },
  {
    title: 'Table',
    key: 'table',
    width: 60,
    render: (_, o) => o.table?.table_number ? (
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-bold"
        style={{ background: 'var(--t-float)', color: 'var(--t-text)', border: '1px solid var(--t-line)' }}
      >
        {o.table.table_number}
      </span>
    ) : (
      <span className="text-xs" style={{ color: 'var(--t-dim)' }}>—</span>
    ),
  },
  {
    title: 'Total',
    key: 'total',
    width: 85,
    align: 'right',
    render: (_, o) => (
      <p className="text-xs font-bold tabular-nums" style={{ color: 'var(--t-text)' }}>{fmtCurrency(o.total_amount)}</p>
    ),
  },
  {
    title: 'Status',
    key: 'status',
    width: 95,
    render: (_, o) => <StatusBadge status={o.status} />,
  },
];

export default function CompletedOrdersPage() {
  const [orders,        setOrders]        = useState<CompletedOrder[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [dateFrom,      setDateFrom]      = useState(todayStr());
  const [dateTo,        setDateTo]        = useState(todayStr());
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(null);
  const [showManual,    setShowManual]    = useState(false);
  const [showBulk,      setShowBulk]      = useState(false);
  const [showExport,    setShowExport]    = useState(false);

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

  const searchFiltered = useMemo<CompletedOrder[]>(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        String(o.order_number ?? '').toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        (o.items ?? []).some((i) => i.name?.toLowerCase().includes(q))
    );
  }, [orders, search]);

  const filtered = useMemo<CompletedOrder[]>(() => {
    if (statusFilter === 'all') return searchFiltered;
    return searchFiltered.filter((o) => o.status === statusFilter);
  }, [searchFiltered, statusFilter]);

  const tabCount = (key: StatusFilter) =>
    key === 'all' ? searchFiltered.length : searchFiltered.filter((o) => o.status === key).length;

  const revenue = filtered.reduce((s, o) => s + (o.total_amount ?? 0), 0);

  const handleManualSaved = (order: unknown) => {
    setOrders((prev) => [order as CompletedOrder, ...prev]);
  };

  return (
    <div className="flex flex-col gap-3 h-full">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--t-text)' }}>Order History</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--t-dim)' }}>Completed &amp; served orders</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button type="button" onClick={downloadSampleSheet}
            className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[11px] font-medium transition-colors"
            style={{ background: 'var(--t-surface)', color: 'var(--t-dim)', border: '1px solid var(--t-line)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--t-text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t-dim)'; }}>
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Sample
          </button>
          <button type="button" onClick={() => setShowExport(true)}
            className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[11px] font-medium transition-colors"
            style={{ background: 'var(--t-surface)', color: 'var(--t-dim)', border: '1px solid var(--t-line)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--t-text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t-dim)'; }}>
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export
          </button>
          <button type="button" onClick={() => setShowBulk(true)}
            className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[11px] font-medium transition-colors"
            style={{ background: 'var(--t-surface)', color: 'var(--t-dim)', border: '1px solid var(--t-line)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--t-text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t-dim)'; }}>
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            Bulk
          </button>
          <button type="button" onClick={() => setShowManual(true)}
            className="h-7 px-3 rounded-lg flex items-center gap-1.5 text-[11px] font-bold text-white transition-opacity"
            style={{ background: 'var(--t-accent)' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Add Order
          </button>
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Date range picker */}
        <DatePicker.RangePicker
          value={[dayjs(dateFrom), dayjs(dateTo)]}
          maxDate={dayjs()}
          size="small"
          allowClear={false}
          onChange={(dates) => {
            if (dates?.[0] && dates?.[1]) {
              setDateFrom(dates[0].format('YYYY-MM-DD'));
              setDateTo(dates[1].format('YYYY-MM-DD'));
            }
          }}
        />

        {/* Search */}
        <div className="relative flex-1 min-w-45" style={{ height: 32 }}>
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--t-dim)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, item…"
            className="w-full h-full rounded-xl pl-7 pr-3 text-[11px] outline-none"
            style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)', color: 'var(--t-text)' }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full flex items-center justify-center"
              style={{ color: 'var(--t-dim)' }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div
          className="flex items-center rounded-xl overflow-hidden shrink-0"
          style={{ border: '1px solid var(--t-line)', background: 'var(--t-surface)', height: 32 }}
        >
          {STATUS_TABS.map(({ key, label }, i) => {
            const count    = tabCount(key);
            const isActive = statusFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className="flex items-center gap-1 px-3 h-full text-[11px] font-semibold transition-colors whitespace-nowrap"
                style={{
                  background:  isActive ? 'var(--t-accent)' : 'transparent',
                  color:       isActive ? '#fff'            : 'var(--t-dim)',
                  borderRight: i < STATUS_TABS.length - 1 ? '1px solid var(--t-line)' : 'none',
                }}
              >
                {label}
                <span
                  className="text-[9px] font-bold px-1 py-0.5 rounded-full tabular-nums"
                  style={{ background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--t-float)', color: isActive ? '#fff' : 'var(--t-dim)' }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <style>{`
        .oh-table-wrap .ant-table-content {
          overflow: visible !important;
        }
        .oh-table-wrap .ant-table-thead > tr > th {
          position: sticky !important;
          top: 0;
          z-index: 3;
          background: var(--t-float) !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.22);
        }
        .oh-table-wrap .ant-table-tbody > tr:hover > td:first-child {
          box-shadow: inset 3px 0 0 var(--t-accent);
        }
      `}</style>
      <div
        className="flex-1 rounded-2xl overflow-hidden flex flex-col min-h-0"
        style={{
          borderTop: '2px solid var(--t-accent)',
          borderRight: '1px solid var(--t-line)',
          borderBottom: '1px solid var(--t-line)',
          borderLeft: '1px solid var(--t-line)',
          background: 'var(--t-bg)',
        }}
      >
        <div className="flex-1 min-h-0 overflow-auto oh-table-wrap">
          <Table
            columns={ORDER_COLUMNS}
            dataSource={filtered}
            rowKey="_id"
            size="small"
            bordered
            pagination={false}
            loading={loading ? { indicator: <Spin /> } : false}
            onRow={(record) => ({ onClick: () => setSelectedOrder(record), style: { cursor: 'pointer' } })}
            scroll={{ x: 700 }}
            locale={{
              emptyText: (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <span className="text-3xl">📋</span>
                  <p className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>No orders found</p>
                  <p className="text-xs" style={{ color: 'var(--t-dim)' }}>
                    {search ? 'Try a different search term' : 'Try adjusting the date range or add a manual order'}
                  </p>
                </div>
              ),
            }}
          />
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div
            className="px-4 py-2 shrink-0 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--t-line)', background: 'var(--t-surface)' }}
          >
            <p className="text-[10px]" style={{ color: 'var(--t-dim)' }}>
              {filtered.length} order{filtered.length !== 1 ? 's' : ''}
              {filtered.length !== orders.length ? ` · filtered from ${orders.length}` : ''}
            </p>
            <p className="text-[10px] font-semibold" style={{ color: 'var(--t-dim)' }}>
              Revenue:&nbsp;<span style={{ color: 'var(--t-text)' }}>{fmtCurrency(revenue)}</span>
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
        <BulkUploadModal onClose={() => setShowBulk(false)} onSaved={() => fetchOrders()} />
      )}
      {showExport && (
        <ExportModal onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}
