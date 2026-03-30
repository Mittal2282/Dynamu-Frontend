import { useEffect, useState, useRef, useCallback } from 'react';
import { getDashOrders, closeTableSession } from '../../services/adminService';
import { apiCaller } from '../../api/apiCaller';

const STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'served'];

const STATUS_CONFIG = {
  pending:   { label: 'New',       color: 'border-yellow-500/50 bg-yellow-500/5',  badge: 'bg-yellow-500/20 text-yellow-400',  next: 'confirmed',  nextLabel: 'Confirm' },
  confirmed: { label: 'Confirmed', color: 'border-blue-500/50 bg-blue-500/5',      badge: 'bg-blue-500/20 text-blue-400',      next: 'preparing',  nextLabel: 'Start Preparing' },
  preparing: { label: 'Preparing', color: 'border-purple-500/50 bg-purple-500/5',  badge: 'bg-purple-500/20 text-purple-400',  next: 'ready',      nextLabel: 'Mark Ready' },
  ready:     { label: 'Ready',     color: 'border-green-500/50 bg-green-500/5',    badge: 'bg-green-500/20 text-green-400',    next: 'served',     nextLabel: 'Mark Served' },
  served:    { label: 'Served',    color: 'border-slate-500/50 bg-slate-500/5',    badge: 'bg-slate-500/20 text-slate-300',    next: null,         nextLabel: null },
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ─── Inline status controls for a single order (used for both original + addons) ── */
function OrderStatusRow({ order, onStatusChange, updating, label }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.served;
  const [showPrepInput, setShowPrepInput] = useState(false);
  const [prepTime, setPrepTime] = useState('');

  const handleConfirmClick = () => {
    if (cfg.next === 'confirmed') {
      setShowPrepInput(true);
    } else {
      onStatusChange(order._id, cfg.next);
    }
  };

  const handleConfirmWithPrep = () => {
    const mins = prepTime ? parseInt(prepTime, 10) : undefined;
    onStatusChange(order._id, 'confirmed', mins);
    setShowPrepInput(false);
    setPrepTime('');
  };

  return (
    <div className="space-y-2">
      {/* Sub-header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {label && <span className="text-xs font-semibold text-orange-300">{label}</span>}
          <span className="text-slate-500 text-xs">#{order.order_number}</span>
          <span className="text-slate-600 text-xs">· {formatTime(order.createdAt)} ({timeAgo(order.createdAt)})</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>
          {order.status}
        </span>
      </div>

      {/* Items */}
      <ul className="space-y-1">
        {order.items?.map((item, i) => (
          <li key={i} className="flex justify-between text-sm">
            <span className="text-slate-300">{item.name}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-500">×{item.quantity}</span>
              <span className="text-slate-400 text-xs">₹{Math.round((item.unit_price ?? 0) * item.quantity)}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* Notes */}
      {order.notes && (
        <p className="text-xs text-slate-400 bg-white/5 rounded px-2 py-1">
          <span className="font-semibold text-slate-300">Note:</span> {order.notes}
        </p>
      )}

      {/* Prep time */}
      {order.estimated_prep_time && (
        <p className="text-xs text-blue-300">Est. prep time: {order.estimated_prep_time} min</p>
      )}

      {/* Action row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-orange-400 font-bold text-sm">₹{Math.round(order.total_amount || 0)}</span>
        {cfg.next && !showPrepInput && (
          <button
            onClick={handleConfirmClick}
            disabled={updating === order._id}
            className="text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {updating === order._id ? '…' : cfg.nextLabel}
          </button>
        )}
      </div>

      {/* Prep time inline input */}
      {showPrepInput && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Est. prep time (optional):</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              placeholder="e.g. 15"
              value={prepTime}
              onChange={e => setPrepTime(e.target.value)}
              className="w-20 bg-slate-800 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-orange-500"
            />
            <span className="text-xs text-slate-400">min</span>
            <button
              onClick={handleConfirmWithPrep}
              disabled={updating === order._id}
              className="text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ml-auto"
            >
              {updating === order._id ? '…' : 'Confirm Order'}
            </button>
            <button onClick={() => setShowPrepInput(false)} className="text-xs text-slate-500 hover:text-slate-300">✕</button>
          </div>
        </div>
      )}

      {/* Cancel */}
      {['pending', 'confirmed'].includes(order.status) && (
        <button
          onClick={() => onStatusChange(order._id, 'cancelled')}
          disabled={updating === order._id}
          className="text-xs text-red-400 hover:text-red-300 transition-colors w-full text-right"
        >
          Cancel order
        </button>
      )}
    </div>
  );
}

function OrderCard({ order, addons, onStatusChange, onCloseTable, updating, closingTable }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.served;
  const sessionKey = String(order.session?._id ?? order.session ?? '');

  // Determine if all orders in this card are served/terminal so Close Table can show
  const allTerminal = ['served', 'completed', 'cancelled'].includes(order.status) &&
    (addons ?? []).every(a => ['served', 'completed', 'cancelled'].includes(a.status));

  return (
    <div className={`border rounded-xl p-4 space-y-3 ${cfg.color} transition-all`}>
      {/* Card header */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-white text-base">
          Table {order.table?.table_number ?? order.table_number ?? '?'}
        </span>
        {addons?.length > 0 && (
          <span className="text-xs text-slate-400">{1 + addons.length} batches</span>
        )}
      </div>

      {/* Original order */}
      <OrderStatusRow
        order={order}
        onStatusChange={onStatusChange}
        updating={updating}
        label={addons?.length > 0 ? 'Order' : null}
      />

      {/* Add-on orders */}
      {addons?.map((addon, idx) => (
        <div key={addon._id} className="pt-3 border-t border-white/10">
          <OrderStatusRow
            order={addon}
            onStatusChange={onStatusChange}
            updating={updating}
            label={`Add-on${addons.length > 1 ? ` ${idx + 1}` : ''}`}
          />
        </div>
      ))}

      {/* Close Table — only when all orders in the session are terminal */}
      {allTerminal && sessionKey && (
        <button
          onClick={() => onCloseTable(sessionKey)}
          disabled={closingTable === sessionKey}
          className="text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 transition-colors w-full py-1.5 rounded-lg mt-1"
        >
          {closingTable === sessionKey ? 'Closing…' : '🔒 Close Table'}
        </button>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [updating, setUpdating] = useState(null);
  const [closingTable, setClosingTable] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [newIds, setNewIds] = useState(new Set());
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
      await apiCaller({
        method:   'PUT',
        endpoint: `/api/restaurant-dash/orders/${orderId}/status`,
        payload,
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

  // Build a session → add-ons map so add-ons are embedded in the original order's card
  const addonsBySession = {};
  orders.forEach(o => {
    if (!o.is_addon) return;
    const key = String(o.session?._id ?? o.session ?? '');
    if (!key) return;
    if (!addonsBySession[key]) addonsBySession[key] = [];
    addonsBySession[key].push(o);
  });

  // Only original (non-addon) orders appear as standalone cards in the Kanban
  const byStatus = (status) => orders.filter(o => o.status === status && !o.is_addon);
  const activeCount = orders.filter(o => !['served', 'completed', 'cancelled'].includes(o.status)).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Orders</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {activeCount} active · auto-refreshes every 10s
            {lastRefresh && <span className="ml-2 text-slate-600">· last at {lastRefresh.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button
          onClick={() => fetchOrders()}
          className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {STATUSES.map(status => {
          const cfg = STATUS_CONFIG[status];
          const cols = byStatus(status);
          return (
            <div key={status} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-300">{cfg.label}</h2>
                {cols.length > 0 && (
                  <span className="text-xs bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">{cols.length}</span>
                )}
              </div>
              <div className="space-y-3 min-h-[80px]">
                {cols.length === 0 ? (
                  <div className="border border-dashed border-white/10 rounded-xl h-16 flex items-center justify-center">
                    <span className="text-slate-600 text-xs">Empty</span>
                  </div>
                ) : cols.map(order => (
                  <div
                    key={order._id}
                    className={newIds.has(order._id) ? 'ring-2 ring-orange-500 ring-offset-1 ring-offset-slate-950 rounded-xl animate-pulse' : ''}
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

      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-slate-400">No orders today yet. Waiting for customers…</p>
        </div>
      )}
    </div>
  );
}
