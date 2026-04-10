import { useEffect, useState, useRef, useCallback } from 'react';
import { getDashOrders, closeTableSession } from '../../services/adminService';
import { apiCaller } from '../../api/apiCaller';
import { getOrderStatusConfig, DASHBOARD_COLUMNS } from '../../constants/orderStatusConfig';

/* ─── Status group constants ────────────────────────────────────────────────── */
const ALLOCATED  = ['pending', 'confirmed'];
const IN_PROGRESS = ['preparing', 'ready'];
const TERMINAL   = ['served', 'completed', 'cancelled'];

function getSessionColumn(orders) {
  // Primary order drives the column. Add-ons don't hold the card in Allocated
  // once the main order has moved to In Progress.
  const primary = orders.find(o => !o.is_addon) ?? orders[0];
  if (ALLOCATED.includes(primary?.status))   return 'allocated';
  if (IN_PROGRESS.includes(primary?.status)) return 'inprogress';
  // Primary is terminal — check if any add-on is still active
  if (orders.some(o => IN_PROGRESS.includes(o.status))) return 'inprogress';
  if (orders.some(o => ALLOCATED.includes(o.status)))   return 'inprogress';
  return 'completed';
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ─── Inline veg/non-veg badge ──────────────────────────────────────────────── */
function VegBadgeInline({ isVeg }) {
  const color = isVeg ? '#22c55e' : '#ef4444';
  const label = isVeg ? 'Veg' : 'Non-Veg';
  return (
    <span className="inline-flex items-center gap-1 shrink-0">
      <span
        className="w-2.5 h-2.5 rounded-sm border-[1.5px] flex items-center justify-center shrink-0"
        style={{ borderColor: color }}
      >
        <span className="w-1 h-1 rounded-full block" style={{ background: color }} />
      </span>
      <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
    </span>
  );
}

/* ─── Single item row: image + name + qty/price ──────────────────────────────── */
function OrderItemRow({ item }) {
  const imageUrl  = item.image_url ?? item.menu_item?.image_url;
  const isVeg     = item.is_veg    ?? item.menu_item?.is_veg;
  const vegColor  = isVeg === false ? '#ef4444' : '#22c55e';
  const unitPrice = item.unit_price ?? 0;
  const total     = Math.round(unitPrice * (item.quantity ?? 1));

  return (
    <div
      className="flex items-center gap-3 py-2 px-3 rounded-xl"
      style={{
        borderLeft: `2.5px solid ${vegColor}`,
        background: isVeg === false ? 'rgba(239,68,68,0.04)' : 'rgba(34,197,94,0.04)',
      }}
    >
      {/* Image */}
      <div
        className="w-10 h-10 rounded-lg overflow-hidden shrink-0"
        style={{ background: 'var(--t-float)' }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-base">
            {isVeg === false ? '🍗' : '🥗'}
          </div>
        )}
      </div>

      {/* Name + variant + instructions */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-semibold text-white leading-snug line-clamp-1">{item.name}</p>
          {isVeg !== undefined && isVeg !== null && <VegBadgeInline isVeg={isVeg} />}
        </div>
        {item.variant_name && (
          <p className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--t-accent)' }}>
            {item.variant_group ? `${item.variant_group}: ` : ''}{item.variant_name}
          </p>
        )}
        {item.special_instructions && (
          <p className="text-[11px] font-medium mt-1 px-2 py-1 rounded-md leading-snug"
            style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
            📝 {item.special_instructions}
          </p>
        )}
      </div>

      {/* Qty + total */}
      <div className="text-right shrink-0 space-y-0.5">
        <p className="text-xs text-slate-500">×{item.quantity ?? 1}</p>
        <p className="text-sm font-bold" style={{ color: 'var(--t-accent)' }}>₹{total}</p>
      </div>
    </div>
  );
}

/* ─── Single order batch (original or add-on) ────────────────────────────────── */
function OrderBatch({ order, sessionOrders, onStatusChange, updating }) {
  const cfg = getOrderStatusConfig(order.status);

  // Determine CTA
  let ctaLabel    = null;
  let ctaStatus   = null;
  let ctaDisabled = false;
  let ctaTooltip  = null;
  let ctaBg       = 'var(--t-accent)';

  if (ALLOCATED.includes(order.status)) {
    ctaLabel  = 'Start Preparing';
    ctaStatus = 'preparing';
  } else if (IN_PROGRESS.includes(order.status)) {
    ctaLabel  = 'Mark Complete';
    ctaStatus = 'served';
    const hasAllocatedSibling = sessionOrders.some(
      s => s._id !== order._id && ALLOCATED.includes(s.status)
    );
    if (hasAllocatedSibling) {
      ctaDisabled = true;
      ctaTooltip  = 'Accept all orders for this table first';
      ctaBg       = '#475569';
    }
  }

  return (
    <div className="space-y-2">
      {/* Batch header row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          {order.is_addon && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0"
              style={{ background: 'rgba(249,115,22,0.12)', color: '#fb923c', borderColor: 'rgba(249,115,22,0.2)' }}>
              + ADD-ON
            </span>
          )}
          <span className="text-xs text-slate-500 font-mono">#{order.order_number}</span>
          <span className="text-slate-600 text-[11px]">
            {formatTime(order.createdAt)} · {timeAgo(order.createdAt)}
          </span>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>

      {/* Item rows — veg first, with section divider if mixed */}
      {(() => {
        const rawItems = order.items ?? [];
        const vegItems    = rawItems.filter(it => (it.is_veg ?? it.menu_item?.is_veg) !== false);
        const nonVegItems = rawItems.filter(it => (it.is_veg ?? it.menu_item?.is_veg) === false);
        const hasBoth = vegItems.length > 0 && nonVegItems.length > 0;
        const sorted = [...vegItems, ...nonVegItems];
        return (
          <div className="space-y-1.5">
            {sorted.map((item, i) => {
              const isVeg = (item.is_veg ?? item.menu_item?.is_veg) !== false;
              const showDivider = hasBoth && i === vegItems.length;
              return (
                <div key={i}>
                  {showDivider && (
                    <div className="flex items-center gap-2 my-1.5">
                      <div className="flex-1 h-px" style={{ background: 'rgba(239,68,68,0.2)' }} />
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
                        Non-Veg
                      </span>
                      <div className="flex-1 h-px" style={{ background: 'rgba(239,68,68,0.2)' }} />
                    </div>
                  )}
                  <OrderItemRow item={item} />
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Notes */}
      {order.notes && (
        <p className="text-xs text-slate-400 rounded-lg px-2.5 py-1.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="font-semibold text-slate-300">Note: </span>{order.notes}
        </p>
      )}

      {/* Batch footer: subtotal + CTA */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="font-bold text-sm" style={{ color: 'var(--t-accent)' }}>
          ₹{Math.round(order.total_amount || 0)}
        </span>
        {ctaLabel && (
          <button
            onClick={() => !ctaDisabled && onStatusChange(order._id, ctaStatus)}
            disabled={updating === order._id || ctaDisabled}
            title={ctaTooltip ?? undefined}
            className={`text-xs font-semibold text-white px-3.5 py-1.5 rounded-lg transition-all duration-150 active:scale-95 ${
              ctaDisabled ? 'cursor-not-allowed' : ''
            }`}
            style={{ background: updating === order._id ? 'var(--t-accent)' : ctaBg, opacity: ctaDisabled ? 0.45 : 1 }}
          >
            {updating === order._id ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                Updating…
              </span>
            ) : ctaLabel}
          </button>
        )}
      </div>

      {/* Cancel (allocated orders only) */}
      {ALLOCATED.includes(order.status) && (
        <button
          onClick={() => onStatusChange(order._id, 'cancelled')}
          disabled={updating === order._id}
          className="text-[11px] text-red-400/60 hover:text-red-400 transition-colors w-full text-right disabled:opacity-40"
        >
          Cancel order
        </button>
      )}
    </div>
  );
}

/* ─── Full session card ────────────────────────────────────────────────────────── */
function TableOrderCard({ session, column, onStatusChange, onCloseTable, updating, closingTable, isNew }) {
  const { sessionId, tableNumber, orders: sessionOrders } = session;
  const allTerminal = sessionOrders.every(o => TERMINAL.includes(o.status));
  const grandTotal  = sessionOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const columnColor = DASHBOARD_COLUMNS.find(c => c.key === column)?.color ?? '#64748b';

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all duration-300 ${
        isNew ? 'ring-2 ring-orange-500/70 ring-offset-2 ring-offset-slate-950' : ''
      }`}
      style={{ background: 'var(--t-surface)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Top accent stripe */}
      <div className="h-1 w-full" style={{ background: columnColor }} />

      {/* Card header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
            style={{ background: `${columnColor}18`, color: columnColor }}
          >
            {tableNumber ?? '?'}
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Table {tableNumber ?? '?'}</p>
            <p className="text-[11px] text-slate-500 leading-tight">
              {sessionOrders.length} order{sessionOrders.length !== 1 ? 's' : ''}
              {isNew && <span className="ml-1.5 text-orange-400 font-semibold">· NEW</span>}
            </p>
          </div>
        </div>
        <p className="text-base font-black tabular-nums" style={{ color: columnColor }}>
          ₹{Math.round(grandTotal)}
        </p>
      </div>

      {/* Order batches */}
      <div className="px-4 py-4 space-y-5">
        {sessionOrders.map((order, idx) => (
          <div key={order._id}>
            {idx > 0 && (
              <div className="border-t border-white/[0.06] mb-5" />
            )}
            <OrderBatch
              order={order}
              sessionOrders={sessionOrders}
              onStatusChange={onStatusChange}
              updating={updating}
            />
          </div>
        ))}
      </div>

      {/* Close Table footer */}
      {allTerminal && sessionId && (
        <div className="px-4 pb-4">
          <button
            onClick={() => onCloseTable(sessionId)}
            disabled={closingTable === sessionId}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all duration-150 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {closingTable === sessionId ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="w-3 h-3 border-2 border-slate-400/40 border-t-slate-400 rounded-full animate-spin inline-block" />
                Closing…
              </span>
            ) : '🔒 Close Table'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────────── */
export default function OrdersPage() {
  const [orders, setOrders]           = useState([]);
  const [updating, setUpdating]       = useState(null);
  const [closingTable, setClosingTable] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [newIds, setNewIds]           = useState(new Set());
  const [selectedTable, setSelectedTable] = useState(null);
  const prevIdsRef = useRef(new Set());

  const fetchOrders = useCallback(async (quiet = false) => {
    try {
      const incoming = await getDashOrders();
      const incomingIds = new Set(incoming.map(o => o._id));
      const brandNew = [...incomingIds].filter(id => !prevIdsRef.current.has(id));
      if (brandNew.length > 0 && prevIdsRef.current.size > 0) {
        setNewIds(new Set(brandNew));
        setTimeout(() => setNewIds(new Set()), 4000);
      }
      prevIdsRef.current = incomingIds;
      setOrders(incoming);
      if (!quiet) setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await apiCaller({
        method: 'PUT',
        endpoint: `/api/restaurant-dash/orders/${orderId}/status`,
        payload: { status },
        useAdmin: true,
      });
      await fetchOrders(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  const handleCloseTable = async (sessionId) => {
    setClosingTable(sessionId);
    try {
      await closeTableSession(sessionId);
      await fetchOrders(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close table session.');
    } finally {
      setClosingTable(null);
    }
  };

  /* ── Derived data ── */
  const tableNumbers = [...new Set(
    orders.map(o => o.table?.table_number ?? o.table_number).filter(n => n != null)
  )].sort((a, b) => Number(a) - Number(b));

  const visibleOrders = selectedTable != null
    ? orders.filter(o => (o.table?.table_number ?? o.table_number) == selectedTable)
    : orders;

  // Group by session
  const sessionMap = {};
  visibleOrders.forEach(o => {
    const key = String(o.session?._id ?? o.session ?? o._id);
    if (!sessionMap[key]) {
      sessionMap[key] = { sessionId: key, tableNumber: o.table?.table_number ?? o.table_number, orders: [], latestAt: new Date(0) };
    }
    sessionMap[key].orders.push(o);
    const t = new Date(o.createdAt);
    if (t > sessionMap[key].latestAt) sessionMap[key].latestAt = t;
  });

  // Sort within session: original first, then add-ons by time
  Object.values(sessionMap).forEach(s => {
    s.orders.sort((a, b) => {
      if (!a.is_addon && b.is_addon) return -1;
      if (a.is_addon && !b.is_addon) return 1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  });

  const sessions = Object.values(sessionMap).sort((a, b) => b.latestAt - a.latestAt);

  const columnSessions = {
    allocated:  sessions.filter(s => getSessionColumn(s.orders) === 'allocated'),
    inprogress: sessions.filter(s => getSessionColumn(s.orders) === 'inprogress'),
    completed:  sessions.filter(s => getSessionColumn(s.orders) === 'completed'),
  };

  const isSessionNew = (session) => session.orders.some(o => newIds.has(o._id));
  const activeCount  = orders.filter(o => !TERMINAL.includes(o.status)).length;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ background: 'linear-gradient(90deg, #fff 30%, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Live Orders
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {activeCount > 0 && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--t-accent-20)', color: 'var(--t-accent)' }}
              >
                {activeCount} active
              </span>
            )}
            <span className="text-slate-500 text-xs">Auto-refreshes every 10s</span>
            {lastRefresh && <span className="text-slate-600 text-xs">· {lastRefresh.toLocaleTimeString()}</span>}
          </div>
        </div>
        <button
          onClick={() => fetchOrders()}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl transition-all duration-150 shrink-0"
        >
          <span>↻</span> Refresh
        </button>
      </div>

      {/* ── Table filter chips ──────────────────────────────────────────────── */}
      {tableNumbers.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedTable(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
              selectedTable === null
                ? 'text-white border-transparent'
                : 'text-slate-400 bg-white/5 border-white/10 hover:bg-white/10 hover:text-slate-200'
            }`}
            style={selectedTable === null ? { background: 'var(--t-accent)', borderColor: 'transparent' } : {}}
          >
            All Tables
          </button>
          {tableNumbers.map(num => (
            <button
              key={num}
              onClick={() => setSelectedTable(selectedTable == num ? null : num)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                selectedTable == num
                  ? 'text-white border-transparent'
                  : 'text-slate-400 bg-white/5 border-white/10 hover:bg-white/10 hover:text-slate-200'
              }`}
              style={selectedTable == num ? { background: 'var(--t-accent)', borderColor: 'transparent' } : {}}
            >
              Table {num}
            </button>
          ))}
        </div>
      )}

      {/* ── 3-Column Kanban ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {DASHBOARD_COLUMNS.map(({ key, label, color }) => {
          const cols = columnSessions[key] ?? [];
          return (
            <div key={key} className="space-y-4">
              {/* Column header */}
              <div
                className="flex items-center justify-between px-1 pb-3 border-b"
                style={{ borderColor: `${color}28` }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color }}>
                    {label}
                  </h2>
                </div>
                <div
                  className="min-w-[24px] h-6 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center"
                  style={{ background: `${color}18`, color }}
                >
                  {cols.length}
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-4 min-h-[80px]">
                {cols.length === 0 ? (
                  <div
                    className="rounded-2xl h-20 flex items-center justify-center"
                    style={{ border: `1px dashed ${color}20` }}
                  >
                    <span className="text-slate-700 text-xs">No orders</span>
                  </div>
                ) : (
                  cols.map(session => (
                    <TableOrderCard
                      key={session.sessionId}
                      session={session}
                      column={key}
                      onStatusChange={handleStatusChange}
                      onCloseTable={handleCloseTable}
                      updating={updating}
                      closingTable={closingTable}
                      isNew={isSessionNew(session)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Empty state ──────────────────────────────────────────────────────── */}
      {orders.length === 0 && (
        <div
          className="border border-white/10 rounded-2xl flex flex-col items-center justify-center py-16 text-center gap-3"
          style={{ background: 'var(--t-surface)' }}
        >
          <span className="text-5xl">🍽️</span>
          <p className="text-white font-semibold">No orders yet</p>
          <p className="text-slate-500 text-sm">Waiting for customers to place orders…</p>
        </div>
      )}
    </div>
  );
}
