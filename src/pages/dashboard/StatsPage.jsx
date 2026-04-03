import { useEffect, useState } from 'react';
import { getDashOrders } from '../../services/adminService';
import { apiCaller } from '../../api/apiCaller';

const RANGES = [
  { label: 'Today',      value: 'today' },
  { label: 'This Week',  value: 'week' },
  { label: 'This Month', value: 'month' },
];

const STATUS_BADGE = {
  pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  preparing: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  ready:     'bg-green-500/15 text-green-400 border-green-500/20',
  served:    'bg-slate-500/15 text-slate-300 border-slate-500/20',
  completed: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const STAT_ICONS = {
  orders:  { icon: '📋', gradient: 'from-blue-500 to-blue-400' },
  revenue: { icon: '💰', gradient: 'from-orange-500 to-orange-400' },
  items:   { icon: '🍽️', gradient: 'from-purple-500 to-purple-400' },
  avg:     { icon: '📈', gradient: 'from-green-500 to-green-400' },
};

function StatCard({ label, value, iconKey, sub }) {
  const meta = STAT_ICONS[iconKey] ?? STAT_ICONS.orders;
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 overflow-hidden relative group hover:border-white/15 transition-colors duration-200">
      {/* Subtle ambient glow */}
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity"
        style={{ background: 'var(--t-accent)' }}
      />
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 bg-gradient-to-br ${meta.gradient} bg-opacity-15`}
        style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))`, border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {meta.icon}
      </div>
      {/* Value */}
      <p className="text-3xl font-bold text-white tracking-tight relative">{value ?? '—'}</p>
      {/* Label */}
      <p className="text-xs text-slate-400 mt-1.5 font-medium">{label}</p>
      {sub && <p className="text-[11px] text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function StatsPage() {
  const [range, setRange] = useState('today');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiCaller({ method: 'GET', endpoint: `/api/restaurant-dash/stats?range=${range}`, useAdmin: true }),
      getDashOrders(),
    ])
      .then(([statsData, orderList]) => {
        setStats(statsData?.data);
        setOrders(orderList);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

  const itemsTotal = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ background: 'linear-gradient(90deg, #fff 30%, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Stats
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Performance overview</p>
        </div>

        {/* Range selector */}
        <div className="flex gap-0.5 bg-slate-900 border border-white/10 rounded-xl p-1">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                range === r.value
                  ? 'text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              style={range === r.value ? { background: 'var(--t-accent)' } : {}}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div
            className="w-8 h-8 border-[3px] border-white/10 border-t-orange-500 rounded-full animate-spin"
          />
        </div>
      ) : (
        <>
          {/* ── Stat cards ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Orders"
              value={stats?.total_orders ?? 0}
              iconKey="orders"
              sub={`${stats?.pending_orders ?? 0} pending`}
            />
            <StatCard
              label="Revenue"
              value={`₹${Math.round(stats?.total_revenue ?? 0).toLocaleString()}`}
              iconKey="revenue"
              sub={`${stats?.paid_orders ?? 0} paid`}
            />
            <StatCard
              label="Items Sold"
              value={itemsTotal}
              iconKey="items"
            />
            <StatCard
              label="Avg Order Value"
              value={`₹${Math.round(stats?.average_order_value ?? 0)}`}
              iconKey="avg"
            />
          </div>

          {/* ── Orders by status ───────────────────────────────────────────── */}
          {stats?.orders_by_status && Object.keys(stats.orders_by_status).length > 0 && (
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Orders by Status</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.orders_by_status).map(([status, count]) => (
                  <span
                    key={status}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${STATUS_BADGE[status] ?? 'bg-white/10 text-white border-white/10'}`}
                  >
                    {status} · {count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Orders table ───────────────────────────────────────────────── */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Today's Orders</p>
              <span className="text-xs text-slate-500">{orders.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order #</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Table</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-600 py-12 text-sm">No orders today.</td>
                    </tr>
                  ) : orders.slice(0, 50).map(order => (
                    <tr key={order._id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-5 py-3 font-mono text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                        {order.order_number}
                      </td>
                      <td className="px-5 py-3 text-slate-200 text-sm">
                        Table {order.table?.table_number ?? order.table_number ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-slate-500 max-w-[180px]">
                        <span className="truncate block text-xs">
                          {order.items?.map(i => i.name).join(', ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-sm" style={{ color: 'var(--t-accent)' }}>
                        ₹{Math.round(order.total_amount || 0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_BADGE[order.status] ?? 'bg-white/10 text-white border-white/10'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
