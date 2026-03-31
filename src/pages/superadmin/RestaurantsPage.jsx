import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCaller } from '../../api/apiCaller';
import { getRestaurants } from '../../services/adminService';

const ICON_MAP = {
  total:   { icon: '🏪', gradient: 'from-blue-500 to-blue-400' },
  active:  { icon: '✅', gradient: 'from-green-500 to-green-400' },
  orders:  { icon: '📋', gradient: 'from-purple-500 to-purple-400' },
  revenue: { icon: '💰', gradient: 'from-orange-500 to-orange-400' },
};

function StatCard({ label, value, iconKey }) {
  const meta = ICON_MAP[iconKey] ?? ICON_MAP.total;
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 overflow-hidden relative group hover:border-white/15 transition-colors duration-200">
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity"
        style={{ background: 'var(--color-brand-primary, #f97316)' }}
      />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {meta.icon}
      </div>
      <p className="text-3xl font-bold text-white tracking-tight">{value ?? '—'}</p>
      <p className="text-xs text-slate-400 mt-1.5 font-medium">{label}</p>
    </div>
  );
}

const STATUS_BADGE = {
  trial:     'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  active:    'bg-green-500/15 text-green-400 border-green-500/20',
  suspended: 'bg-red-500/15 text-red-400 border-red-500/20',
  cancelled: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

function StatusBadge({ status }) {
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_BADGE[status] ?? STATUS_BADGE.trial}`}>
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
      <div className="flex items-center justify-center h-64 gap-3">
        <div className="w-7 h-7 border-[3px] border-white/10 border-t-orange-500 rounded-full animate-spin" />
        <span className="text-slate-500 text-sm">Loading…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ background: 'linear-gradient(90deg, #fff 30%, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Restaurants
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage all onboarded restaurants</p>
        </div>
        <button
          onClick={() => navigate('/superadmin/onboard')}
          className="inline-flex items-center gap-2 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-150 text-sm shrink-0 active:scale-95"
          style={{ background: 'var(--color-brand-primary, #f97316)' }}
        >
          ➕ Onboard Restaurant
        </button>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Restaurants" value={stats?.total_restaurants}                                     iconKey="total" />
        <StatCard label="Active"            value={stats?.active_restaurants}                                    iconKey="active" />
        <StatCard label="Orders Today"      value={stats?.orders_today}                                          iconKey="orders" />
        <StatCard label="Revenue Today"     value={stats?.revenue_today ? `₹${Math.round(stats.revenue_today)}` : '₹0'} iconKey="revenue" />
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or slug…"
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
          onFocus={e => e.target.style.borderColor = 'var(--color-brand-primary, #f97316)'}
          onBlur={e => e.target.style.borderColor = ''}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs">
            ✕
          </button>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">All Restaurants</p>
          {search && (
            <span className="text-xs text-slate-500">{filtered.length} of {restaurants.length}</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Restaurant</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tables</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Orders Today</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <p className="text-3xl mb-3">{search ? '🔍' : '🏪'}</p>
                    <p className="text-slate-500 text-sm">
                      {search ? 'No restaurants match your search.' : 'No restaurants yet. Onboard your first one!'}
                    </p>
                  </td>
                </tr>
              ) : filtered.map(r => (
                <tr key={r._id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white group-hover:text-orange-400/90 transition-colors">{r.name}</div>
                    <div className="text-slate-500 text-xs mt-0.5 font-mono">/{r.slug}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-slate-200">{r.owner?.name || '—'}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{r.owner?.email}</div>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-300">{r.table_count ?? 0}</td>
                  <td className="px-4 py-4 text-center text-slate-300">{r.orders_today ?? 0}</td>
                  <td className="px-4 py-4 text-center">
                    <StatusBadge status={r.subscription_status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => navigate(`/superadmin/restaurants/${r._id}/orders`)}
                      className="text-xs font-semibold text-slate-400 hover:text-orange-400 transition-colors whitespace-nowrap"
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
