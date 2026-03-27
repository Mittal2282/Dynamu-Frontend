import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminApi from '../../api/adminAxios';

const STATUS_COLORS = {
  pending:   'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  preparing: 'bg-purple-500/20 text-purple-400',
  ready:     'bg-green-500/20 text-green-400',
  served:    'bg-slate-500/20 text-slate-300',
  completed: 'bg-slate-500/20 text-slate-300',
  cancelled: 'bg-red-500/20 text-red-400',
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function RestaurantOrdersPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    adminApi.get(`/api/superadmin/restaurants/${id}`)
      .then(res => setRestaurant(res.data.data.restaurant))
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);

    adminApi.get(`/api/superadmin/restaurants/${id}/orders?${params}`)
      .then(res => setOrders(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, statusFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/superadmin')} className="text-slate-400 hover:text-white transition-colors text-sm">
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-bold">{restaurant?.name || 'Restaurant'} — Orders</h1>
          <p className="text-slate-400 text-sm">/{restaurant?.slug}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
          >
            <option value="">All Statuses</option>
            {['pending','confirmed','preparing','ready','served','completed','cancelled'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
          />
        </div>
        {(statusFilter || dateFrom || dateTo) && (
          <button
            onClick={() => { setStatusFilter(''); setDateFrom(''); setDateTo(''); }}
            className="text-xs text-orange-400 hover:text-orange-300 pb-0.5"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Orders table */}
      <div className="bg-slate-900 rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Order #</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Table</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Items</th>
                  <th className="text-right px-5 py-3 text-slate-400 font-medium">Total</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium">Status</th>
                  <th className="text-right px-5 py-3 text-slate-400 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-500 py-12">No orders found.</td>
                  </tr>
                ) : orders.map(order => (
                  <tr key={order._id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-slate-300">{order.order_number}</td>
                    <td className="px-5 py-4 text-white">Table {order.table?.table_number ?? order.table_number ?? '—'}</td>
                    <td className="px-5 py-4 text-slate-400 max-w-[200px]">
                      <span className="truncate block">
                        {order.items?.map(i => `${i.name} ×${i.quantity}`).join(', ') || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-orange-400 font-semibold">
                      ₹{Math.round(order.total_amount || 0)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || ''}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-slate-500 text-xs whitespace-nowrap">
                      {timeAgo(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-slate-500 text-xs text-right">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
    </div>
  );
}
