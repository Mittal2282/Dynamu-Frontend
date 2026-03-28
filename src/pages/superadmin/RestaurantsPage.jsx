import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCaller } from '../../api/apiCaller';
import { ENDPOINTS } from '../../utils/endpoints';
import { getRestaurants } from '../../services/adminService';
import { formatCurrency } from '../../utils/formatters';

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-slate-900 rounded-xl p-5 border border-white/10">
      <p className="text-slate-400 text-sm">{label}</p>
      <div className="flex items-end gap-2 mt-2">
        <span className="text-3xl font-bold text-white">{value ?? '—'}</span>
        <span className="text-2xl mb-0.5">{icon}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    trial:   'bg-yellow-500/20 text-yellow-400',
    active:  'bg-green-500/20 text-green-400',
    suspended: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-slate-500/20 text-slate-400',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || map.trial}`}>
      {status}
    </span>
  );
}

export default function RestaurantsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      apiCaller({ method: 'GET', endpoint: '/api/superadmin/stats', useAdmin: true }),
      getRestaurants(),
    ])
      .then(([statsData, restaurantList]) => {
        setStats(statsData?.data);
        setRestaurants(restaurantList);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Restaurants</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage all onboarded restaurants</p>
        </div>
        <button
          onClick={() => navigate('/superadmin/onboard')}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
        >
          ➕ Onboard Restaurant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Restaurants" value={stats?.total_restaurants} icon="🏪" />
        <StatCard label="Active" value={stats?.active_restaurants} icon="✅" />
        <StatCard label="Orders Today" value={stats?.orders_today} icon="📋" />
        <StatCard label="Revenue Today" value={stats?.revenue_today ? `₹${Math.round(stats.revenue_today)}` : '₹0'} icon="💰" />
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name or slug…"
        className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
      />

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Restaurant</th>
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Owner</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium">Tables</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium">Orders Today</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 py-12">
                    {search ? 'No restaurants match your search.' : 'No restaurants yet. Onboard your first one!'}
                  </td>
                </tr>
              ) : filtered.map(r => (
                <tr key={r._id} className="hover:bg-white/3 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white">{r.name}</div>
                    <div className="text-slate-500 text-xs mt-0.5">/{r.slug}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-slate-300">{r.owner?.name || '—'}</div>
                    <div className="text-slate-500 text-xs">{r.owner?.email}</div>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-300">{r.table_count ?? 0}</td>
                  <td className="px-4 py-4 text-center text-slate-300">{r.orders_today ?? 0}</td>
                  <td className="px-4 py-4 text-center">
                    <StatusBadge status={r.subscription_status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => navigate(`/superadmin/restaurants/${r._id}/orders`)}
                      className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      View Orders →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
