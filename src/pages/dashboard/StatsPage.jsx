import { useEffect, useState } from 'react';
import { getDashOrders } from '../../services/adminService';
import { apiCaller } from '../../api/apiCaller';

const RANGES = [
  { label: 'Today',     value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
];

function StatCard({ label, value, icon, sub }) {
  return (
    <div className="bg-slate-900 rounded-xl p-5 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <p className="text-slate-400 text-sm">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

const STATUS_COLORS = {
  pending:   'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  preparing: 'bg-purple-500/20 text-purple-400',
  ready:     'bg-green-500/20 text-green-400',
  served:    'bg-slate-500/20 text-slate-300',
  completed: 'bg-slate-500/20 text-slate-300',
  cancelled: 'bg-red-500/20 text-red-400',
};

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Stats</h1>
          <p className="text-slate-400 text-sm mt-0.5">Performance overview</p>
        </div>
        {/* Range tabs */}
        <div className="flex gap-1 bg-slate-900 border border-white/10 rounded-lg p-1">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${range === r.value ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Orders"
              value={stats?.total_orders ?? 0}
              icon="📋"
              sub={`${stats?.pending_orders ?? 0} pending`}
            />
            <StatCard
              label="Revenue"
              value={`₹${Math.round(stats?.total_revenue ?? 0).toLocaleString()}`}
              icon="💰"
              sub={`${stats?.paid_orders ?? 0} paid`}
            />
            <StatCard
              label="Items Sold"
              value={itemsTotal}
              icon="🍽️"
            />
            <StatCard
              label="Avg Order Value"
              value={`₹${Math.round(stats?.average_order_value ?? 0)}`}
              icon="📈"
            />
          </div>

          {/* Orders by status */}
          {stats?.orders_by_status && Object.keys(stats.orders_by_status).length > 0 && (
            <div className="bg-slate-900 rounded-xl border border-white/10 p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Orders by Status</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(stats.orders_by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[status] || 'bg-white/10 text-white'}`}>
                      {status}: {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's orders table */}
          <div className="bg-slate-900 rounded-xl border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h2 className="text-sm font-semibold text-slate-300">Today's Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-5 py-3 text-slate-400 font-medium">Order #</th>
                    <th className="text-left px-5 py-3 text-slate-400 font-medium">Table</th>
                    <th className="text-left px-5 py-3 text-slate-400 font-medium">Items</th>
                    <th className="text-right px-5 py-3 text-slate-400 font-medium">Total</th>
                    <th className="text-center px-4 py-3 text-slate-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-500 py-10">No orders today.</td>
                    </tr>
                  ) : orders.slice(0, 50).map(order => (
                    <tr key={order._id} className="hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-slate-300">{order.order_number}</td>
                      <td className="px-5 py-3 text-white">Table {order.table?.table_number ?? order.table_number ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-400 max-w-[180px]">
                        <span className="truncate block text-xs">
                          {order.items?.map(i => i.name).join(', ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-orange-400 font-semibold">
                        ₹{Math.round(order.total_amount || 0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || ''}`}>
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
