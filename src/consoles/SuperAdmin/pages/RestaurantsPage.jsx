import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiCaller } from "../../../api/apiCaller";
import { getRestaurants } from "../../../services/superAdminService";

/* ─── Status config ──────────────────────────────────────────────────────────── */
const SUB_CONFIG = {
  active: {
    label: "Active",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.2)",
  },
  trial: {
    label: "Trial",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.2)",
  },
  suspended: {
    label: "Suspended",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.2)",
  },
  cancelled: {
    label: "Cancelled",
    color: "#64748b",
    bg: "rgba(100,116,139,0.08)",
    border: "rgba(100,116,139,0.15)",
  },
};

/* ─── Metric Card ────────────────────────────────────────────────────────────── */
function MetricCard({ label, value, sub, accentColor, icon }) {
  return (
    <div className="relative rounded-2xl p-5 flex flex-col gap-3 overflow-hidden group transition-all duration-200 hover:-translate-y-0.5 bg-slate-900 border border-white/10 hover:border-white/15">
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
      />
      {/* Ambient glow */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-xl pointer-events-none opacity-[0.08] group-hover:opacity-[0.14] transition-opacity duration-300"
        style={{ background: accentColor }}
      />
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}25` }}
      >
        {icon}
      </div>
      {/* Value + label */}
      <div>
        <p className="text-2xl font-bold tracking-tight leading-none text-white">{value ?? "—"}</p>
        <p className="text-[11px] font-medium mt-1.5 text-slate-400">{label}</p>
      </div>
      {/* Sub-label */}
      {sub && (
        <p className="text-[11px] font-semibold px-2 py-0.5 rounded-full self-start bg-white/5 text-slate-400">
          {sub}
        </p>
      )}
    </div>
  );
}

/* ─── Status Badge ───────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = SUB_CONFIG[status] ?? SUB_CONFIG.trial;
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}

/* ─── Subscription Health ────────────────────────────────────────────────────── */
function SubscriptionHealth({ restaurants }) {
  const counts = {
    active: restaurants.filter((r) => r.subscription_status === "active").length,
    trial: restaurants.filter((r) => r.subscription_status === "trial").length,
    suspended: restaurants.filter((r) => r.subscription_status === "suspended").length,
    cancelled: restaurants.filter((r) => r.subscription_status === "cancelled").length,
  };
  const total = restaurants.length;
  const entries = Object.entries(counts).filter(([, v]) => v > 0);

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4 bg-slate-900 border border-white/10 h-full">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Subscription Health</p>
        <span className="text-xs font-bold text-slate-400">{total} total</span>
      </div>

      {total === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-300 text-sm">
          No restaurants yet
        </div>
      ) : (
        <>
          {/* Stacked bar */}
          <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
            {entries.map(([status, count]) => {
              const cfg = SUB_CONFIG[status];
              return (
                <div
                  key={status}
                  className="rounded-full transition-all duration-500"
                  style={{
                    width: `${(count / total) * 100}%`,
                    background: cfg.color,
                    minWidth: "2px",
                  }}
                  title={`${cfg.label}: ${count}`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(counts).map(([status, count]) => {
              const cfg = SUB_CONFIG[status];
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div
                  key={status}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: cfg.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold" style={{ color: cfg.color }}>
                      {cfg.label}
                    </p>
                    <p className="text-[10px] text-slate-300">
                      {count} · {pct}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Top Restaurants ────────────────────────────────────────────────────────── */
function TopRestaurants({ restaurants }) {
  const top = [...restaurants]
    .sort((a, b) => (b.orders_today ?? 0) - (a.orders_today ?? 0))
    .slice(0, 5);
  const maxOrders = top[0]?.orders_today ?? 0;

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4 bg-slate-900 border border-white/10 h-full">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Most Active Today</p>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
          By orders
        </span>
      </div>

      {maxOrders === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
          <span className="text-2xl">📋</span>
          <p className="text-sm text-slate-300">No orders placed today yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {top.map((r, idx) => {
            const orders = r.orders_today ?? 0;
            const barPct = maxOrders > 0 ? (orders / maxOrders) * 100 : 0;
            const rankColors = ["#f59e0b", "#94a3b8", "#b45309", "#64748b", "#64748b"];
            return (
              <div key={r._id} className="flex items-center gap-3">
                {/* Rank */}
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                  style={{
                    background: `${rankColors[idx]}15`,
                    color: rankColors[idx],
                    border: `1px solid ${rankColors[idx]}30`,
                  }}
                >
                  {idx + 1}
                </span>
                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="text-xs font-semibold text-white truncate">{r.name}</span>
                    <span className="text-xs font-bold text-slate-300 shrink-0">{orders}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${barPct}%`, background: rankColors[idx] }}
                    />
                  </div>
                </div>
                {/* Badge */}
                <StatusBadge status={r.subscription_status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
export default function RestaurantsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      apiCaller({ method: "GET", endpoint: "/api/superadmin/stats", useAdmin: true }),
      getRestaurants(),
    ])
      .then(([statsData, restaurantList]) => {
        setStats(statsData?.data);
        setRestaurants(restaurantList);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.slug.toLowerCase().includes(search.toLowerCase()),
  );

  // Derived metrics
  const restaurantsActiveToday = restaurants.filter((r) => (r.orders_today ?? 0) > 0).length;
  const avgOrdersPerRestaurant =
    (stats?.active_restaurants ?? 0) > 0
      ? ((stats?.orders_today ?? 0) / stats.active_restaurants).toFixed(1)
      : "—";
  const avgRevenuePerRestaurant =
    (stats?.active_restaurants ?? 0) > 0
      ? `₹${Math.round((stats?.revenue_today ?? 0) / stats.active_restaurants).toLocaleString()}`
      : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3">
        <div className="w-7 h-7 border-[3px] border-white/10 border-t-orange-500 rounded-full animate-spin" />
        <span className="text-slate-300 text-sm">Loading…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              background: "linear-gradient(90deg, #fff 30%, #94a3b8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Platform Overview
          </h1>
          <p className="text-slate-300 text-sm mt-0.5">
            Business stats & all onboarded restaurants
          </p>
        </div>
        <button
          onClick={() => navigate("/superadmin/onboard")}
          className="inline-flex items-center gap-2 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-150 text-sm shrink-0 active:scale-95"
          style={{ background: "var(--t-accent)", boxShadow: "0 4px 14px rgba(0,0,0,0.3)" }}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Onboard Restaurant
        </button>
      </div>

      {/* ── Platform Metric Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Restaurants"
          value={stats?.total_restaurants ?? 0}
          sub={`${stats?.active_restaurants ?? 0} marked active`}
          accentColor="#3b82f6"
          icon={
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          }
        />
        <MetricCard
          label="Active Today"
          value={restaurantsActiveToday}
          sub="Restaurants with orders"
          accentColor="#22c55e"
          icon={
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
        />
        <MetricCard
          label="Orders Today"
          value={stats?.orders_today ?? 0}
          sub={`${avgOrdersPerRestaurant} avg / restaurant`}
          accentColor="#a855f7"
          icon={
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a855f7"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12h6M9 16h4" />
            </svg>
          }
        />
        <MetricCard
          label="Revenue Today"
          value={
            stats?.revenue_today ? `₹${Math.round(stats.revenue_today).toLocaleString()}` : "₹0"
          }
          sub={`${avgRevenuePerRestaurant} avg / restaurant`}
          accentColor="#f59e0b"
          icon={
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        />
      </div>

      {/* ── Business Insights ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SubscriptionHealth restaurants={restaurants} />
        <TopRestaurants restaurants={restaurants} />
      </div>

      {/* ── Restaurant Table ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden bg-slate-900 border border-white/10">
        {/* Table header with search */}
        <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-white">All Restaurants</p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
              {search ? `${filtered.length} / ${restaurants.length}` : restaurants.length}
            </span>
          </div>
          {/* Search */}
          <div className="relative sm:w-64">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or slug…"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Restaurant
                </th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Owner
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Tables
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Orders Today
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Onboarded
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Status
                </th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <p className="text-3xl mb-3">{search ? "🔍" : "🏪"}</p>
                    <p className="text-slate-300 text-sm">
                      {search
                        ? "No restaurants match your search."
                        : "No restaurants yet. Onboard your first one!"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isActiveToday = (r.orders_today ?? 0) > 0;
                  const onboarded = r.createdAt
                    ? new Date(r.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";
                  return (
                    <tr key={r._id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {/* Activity dot */}
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              background: isActiveToday ? "#22c55e" : "rgba(255,255,255,0.1)",
                            }}
                            title={isActiveToday ? "Has orders today" : "No orders today"}
                          />
                          <div>
                            <div className="font-semibold text-white group-hover:text-orange-400/90 transition-colors text-sm">
                              {r.name}
                            </div>
                            <div className="text-slate-300 text-xs mt-0.5 font-mono">/{r.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-slate-200 text-sm">{r.owner?.name || "—"}</div>
                        <div className="text-slate-300 text-xs mt-0.5">{r.owner?.email}</div>
                      </td>
                      <td className="px-4 py-4 text-center text-slate-300 text-sm">
                        {r.table_count ?? 0}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className="text-sm font-bold"
                          style={{ color: isActiveToday ? "#22c55e" : "#475569" }}
                        >
                          {r.orders_today ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-400 text-xs">{onboarded}</td>
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={r.subscription_status} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => navigate(`/superadmin/restaurants/${r._id}/orders`)}
                          className="text-xs font-semibold text-slate-300 hover:text-orange-400 transition-colors whitespace-nowrap"
                        >
                          View Orders →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
