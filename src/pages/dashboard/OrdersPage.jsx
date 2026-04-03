import { useEffect, useState, useRef, useCallback } from 'react';
import { getDashOrders, closeTableSession } from '../../services/adminService';
import { apiCaller } from '../../api/apiCaller';
import {
  ORDER_STATUS_CONFIG as STATUS_CONFIG,
  ORDER_STATUSES as STATUSES,
  getOrderStatusConfig,
} from '../../constants/orderStatusConfig';

/* ─── Live countdown hook ─────────────────────────────────────────────────── */
function useCountdown(order) {
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    if (!order.estimated_prep_time || !order.confirmed_at) return;
    const deadline = new Date(order.confirmed_at).getTime() + order.estimated_prep_time * 60_000;
    const tick = () => setRemaining(Math.ceil((deadline - Date.now()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [order.estimated_prep_time, order.confirmed_at]);
  return remaining;
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ─── Inline status controls (used for both original + add-on batches) ── */
function OrderStatusRow({ order, onStatusChange, updating, label }) {
  const cfg = getOrderStatusConfig(order.status);
  const [showPrepInput, setShowPrepInput] = useState(false);
  const [prepTime, setPrepTime] = useState('');
  const remaining = useCountdown(order);

  const handleConfirmClick = () => {
    if (cfg.next === 'confirmed') setShowPrepInput(true);
    else onStatusChange(order._id, cfg.next);
  };

  const handleConfirmWithPrep = () => {
    const mins = prepTime ? parseInt(prepTime, 10) : undefined;
    onStatusChange(order._id, 'confirmed', mins);
    setShowPrepInput(false);
    setPrepTime('');
  };

  return (
    <div className="space-y-2.5">
      {/* Sub-header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0">
          {label && (
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/20 shrink-0">
              {label}
            </span>
          )}
          <span className="text-slate-500 text-xs font-mono">#{order.order_number}</span>
          <span className="text-slate-600 text-xs">· {formatTime(order.createdAt)} ({timeAgo(order.createdAt)} ago)</span>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>
          {order.status}
        </span>
      </div>

      {/* Items */}
      <ul className="space-y-1.5">
        {order.items?.map((item, i) => (
          <li key={i} className="flex justify-between items-baseline text-sm gap-2">
            <span className="text-slate-200 leading-tight">{item.name}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-500 text-xs">×{item.quantity}</span>
              <span className="text-slate-400 text-xs">₹{Math.round((item.unit_price ?? 0) * item.quantity)}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* Notes */}
      {order.notes && (
        <p className="text-xs text-slate-400 bg-white/5 border border-white/5 rounded-lg px-2.5 py-1.5">
          <span className="font-semibold text-slate-300">Note: </span>{order.notes}
        </p>
      )}

      {/* Prep time / live countdown */}
      {order.estimated_prep_time && ['confirmed', 'preparing'].includes(order.status) && (
        remaining === null ? (
          <p className="text-xs text-blue-400 flex items-center gap-1">
            <span>⏱</span> Est. {order.estimated_prep_time} min
          </p>
        ) : remaining > 0 ? (
          <p className={`text-xs font-mono font-semibold flex items-center gap-1 ${
            remaining < 120 ? 'text-red-400' : remaining < 300 ? 'text-orange-400' : 'text-green-400'
          }`}>
            <span>⏱</span>
            {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
          </p>
        ) : (
          <p className="text-xs font-semibold text-red-400 animate-pulse flex items-center gap-1">
            ⚠ OVERDUE
          </p>
        )
      )}

      {/* Action row */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className="font-bold text-sm" style={{ color: 'var(--color-brand-primary, #f97316)' }}>
          ₹{Math.round(order.total_amount || 0)}
        </span>
        {cfg.next && !showPrepInput && (
          <button
            onClick={handleConfirmClick}
            disabled={updating === order._id}
            className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-all duration-150 disabled:opacity-40 active:scale-95"
            style={{ background: 'var(--color-brand-primary, #f97316)' }}
          >
            {updating === order._id ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                <span>Updating</span>
              </span>
            ) : cfg.nextLabel}
          </button>
        )}
      </div>

      {/* Prep time input */}
      {showPrepInput && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
          <p className="text-xs text-slate-400">Optional: Est. prep time</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              placeholder="e.g. 15"
              value={prepTime}
              onChange={e => setPrepTime(e.target.value)}
              className="w-20 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/60 transition-colors"
            />
            <span className="text-xs text-slate-500">min</span>
            <button
              onClick={handleConfirmWithPrep}
              disabled={updating === order._id}
              className="ml-auto text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 active:scale-95"
              style={{ background: 'var(--color-brand-primary, #f97316)' }}
            >
              Confirm
            </button>
            <button onClick={() => setShowPrepInput(false)} className="text-slate-500 hover:text-slate-300 transition-colors text-sm">✕</button>
          </div>
        </div>
      )}

      {/* Cancel */}
      {['pending', 'confirmed'].includes(order.status) && (
        <button
          onClick={() => onStatusChange(order._id, 'cancelled')}
          disabled={updating === order._id}
          className="text-xs text-red-400/70 hover:text-red-400 transition-colors w-full text-right disabled:opacity-40"
        >
          Cancel order
        </button>
      )}
    </div>
  );
}

/* ─── Combined session card (original + any add-ons) ── */
function OrderCard({ order, addons, onStatusChange, onCloseTable, updating, closingTable }) {
  const cfg = getOrderStatusConfig(order.status);
  const sessionKey = String(order.session?._id ?? order.session ?? '');
  const allTerminal =
    ['served', 'completed', 'cancelled'].includes(order.status) &&
    (addons ?? []).every(a => ['served', 'completed', 'cancelled'].includes(a.status));

  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden transition-all duration-200">
      {/* Status colour stripe */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${cfg.stripe}`} />

      <div className="p-4 space-y-3">
        {/* Card header */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-white text-sm">
            Table {order.table?.table_number ?? order.table_number ?? '?'}
          </span>
          {addons?.length > 0 && (
            <span className="text-[11px] text-slate-500 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
              {1 + addons.length} batches
            </span>
          )}
        </div>

        {/* Original order */}
        <OrderStatusRow
          order={order}
          onStatusChange={onStatusChange}
          updating={updating}
          label={addons?.length > 0 ? 'Order' : null}
        />

        {/* Add-on batches */}
        {addons?.map((addon, idx) => (
          <div key={addon._id} className="pt-3 border-t border-white/5">
            <OrderStatusRow
              order={addon}
              onStatusChange={onStatusChange}
              updating={updating}
              label={`Add-on${addons.length > 1 ? ` ${idx + 1}` : ''}`}
            />
          </div>
        ))}

        {/* Close Table */}
        {allTerminal && sessionKey && (
          <button
            onClick={() => onCloseTable(sessionKey)}
            disabled={closingTable === sessionKey}
            className="w-full py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white border border-white/10 hover:border-white/20 bg-white/3 hover:bg-white/8 transition-all duration-150 mt-1 disabled:opacity-40"
          >
            {closingTable === sessionKey ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="w-3 h-3 border-2 border-slate-400/40 border-t-slate-400 rounded-full animate-spin inline-block" />
                Closing…
              </span>
            ) : '🔒 Close Table'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [updating, setUpdating] = useState(null);
  const [closingTable, setClosingTable] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [newIds, setNewIds] = useState(new Set());
  const [selectedTable, setSelectedTable] = useState(null); // null = all tables
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

  const handleStatusChange = async (orderId, status, prepTime) => {
    setUpdating(orderId);
    try {
      const payload = { status };
      if (prepTime != null) payload.estimated_prep_time = prepTime;
      await apiCaller({ method: 'PUT', endpoint: `/api/restaurant-dash/orders/${orderId}/status`, payload, useAdmin: true });
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

  // Unique sorted table numbers for the filter chips
  const tableNumbers = [...new Set(
    orders.map(o => o.table?.table_number ?? o.table_number).filter(n => n != null)
  )].sort((a, b) => Number(a) - Number(b));

  // Apply table filter
  const visibleOrders = selectedTable != null
    ? orders.filter(o => (o.table?.table_number ?? o.table_number) == selectedTable)
    : orders;

  const addonsBySession = {};
  visibleOrders.forEach(o => {
    if (!o.is_addon) return;
    const key = String(o.session?._id ?? o.session ?? '');
    if (!key) return;
    if (!addonsBySession[key]) addonsBySession[key] = [];
    addonsBySession[key].push(o);
  });

  const byStatus = (status) => visibleOrders.filter(o => o.status === status && !o.is_addon);
  const activeCount = orders.filter(o => !['served', 'completed', 'cancelled'].includes(o.status)).length;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
                style={{ background: 'var(--color-brand-primary-20, rgba(249,115,22,0.2))', color: 'var(--color-brand-primary, #f97316)' }}
              >
                {activeCount} active
              </span>
            )}
            <span className="text-slate-500 text-xs">Auto-refreshes every 10s</span>
            {lastRefresh && (
              <span className="text-slate-600 text-xs">· {lastRefresh.toLocaleTimeString()}</span>
            )}
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
            style={selectedTable === null ? { background: 'var(--color-brand-primary, #f97316)', borderColor: 'transparent' } : {}}
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
              style={selectedTable == num ? { background: 'var(--color-brand-primary, #f97316)', borderColor: 'transparent' } : {}}
            >
              Table {num}
            </button>
          ))}
        </div>
      )}

      {/* ── Kanban ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {STATUSES.map(status => {
          const cfg = STATUS_CONFIG[status];
          const cols = byStatus(status);
          return (
            <div key={status} className="space-y-3">
              {/* Column header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{cfg.label}</h2>
                </div>
                {cols.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-white/10 text-slate-400 text-[11px] font-bold flex items-center justify-center">
                    {cols.length}
                  </span>
                )}
              </div>

              {/* Cards */}
              <div className="space-y-3 min-h-[80px]">
                {cols.length === 0 ? (
                  <div className="border border-dashed border-white/8 rounded-xl h-14 flex items-center justify-center">
                    <span className="text-slate-700 text-xs">Empty</span>
                  </div>
                ) : cols.map(order => (
                  <div
                    key={order._id}
                    className={newIds.has(order._id)
                      ? 'ring-2 ring-orange-500/70 ring-offset-2 ring-offset-slate-950 rounded-xl'
                      : ''}
                  >
                    <OrderCard
                      order={order}
                      addons={addonsBySession[String(order.session?._id ?? order.session ?? '')] ?? []}
                      onStatusChange={handleStatusChange}
                      onCloseTable={handleCloseTable}
                      updating={updating}
                      closingTable={closingTable}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {orders.length === 0 && (
        <div className="bg-slate-900 border border-white/10 rounded-2xl flex flex-col items-center justify-center py-16 text-center gap-3">
          <span className="text-5xl">🍽️</span>
          <p className="text-white font-semibold">No orders yet</p>
          <p className="text-slate-500 text-sm">Waiting for customers to place orders…</p>
        </div>
      )}
    </div>
  );
}
