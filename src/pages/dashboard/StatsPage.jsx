import { useEffect, useState } from "react";
import { getDashOrders } from "../../services/adminService";
import { apiCaller } from "../../api/apiCaller";

const RANGES = [
  { label: "Today",      value: "today" },
  { label: "This Week",  value: "week" },
  { label: "This Month", value: "month" },
];

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)"  },
  confirmed: { label: "Confirmed", color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.2)"  },
  preparing: { label: "Preparing", color: "#a855f7", bg: "rgba(168,85,247,0.1)",  border: "rgba(168,85,247,0.2)"  },
  ready:     { label: "Ready",     color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.2)"   },
  served:    { label: "Served",    color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.15)" },
  completed: { label: "Completed", color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.15)" },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)"   },
};

/* ─── Stat Card ──────────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, accentColor, icon }) {
  return (
    <div
      className="relative rounded-2xl p-5 flex flex-col gap-4 overflow-hidden group transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--t-surface)",
        border: "1px solid var(--t-line)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07] blur-xl pointer-events-none group-hover:opacity-[0.12] transition-opacity duration-300"
        style={{ background: accentColor }}
      />
      {/* Top stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
      />

      {/* Icon + sub */}
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}25` }}
        >
          {icon}
        </div>
        {sub && (
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "var(--t-float)", color: "var(--t-dim)" }}
          >
            {sub}
          </span>
        )}
      </div>

      {/* Value + label */}
      <div>
        <p
          className="text-2xl font-bold tracking-tight leading-none"
          style={{ color: "var(--t-text)" }}
        >
          {value ?? "—"}
        </p>
        <p className="text-[11px] font-medium mt-1.5" style={{ color: "var(--t-dim)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

/* ─── Status Bar Chart ───────────────────────────────────────────────────────── */
function StatusBreakdown({ data }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (!total) return null;

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>
          Orders by Status
        </p>
        <span className="text-xs font-bold" style={{ color: "var(--t-accent)" }}>
          {total} total
        </span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        {entries.map(([status, count]) => {
          const cfg = STATUS_CONFIG[status];
          return (
            <div
              key={status}
              className="rounded-full transition-all duration-500"
              style={{
                width: `${(count / total) * 100}%`,
                background: cfg?.color ?? "#64748b",
                minWidth: "2px",
              }}
              title={`${status}: ${count}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {entries.map(([status, count]) => {
          const cfg = STATUS_CONFIG[status];
          const pct = Math.round((count / total) * 100);
          return (
            <div
              key={status}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl"
              style={{ background: cfg?.bg ?? "rgba(255,255,255,0.04)", border: `1px solid ${cfg?.border ?? "rgba(255,255,255,0.1)"}` }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: cfg?.color ?? "#64748b" }}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold capitalize truncate" style={{ color: cfg?.color ?? "#94a3b8" }}>
                  {cfg?.label ?? status}
                </p>
                <p className="text-[10px]" style={{ color: "var(--t-dim)" }}>
                  {count} · {pct}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Orders Table ───────────────────────────────────────────────────────────── */
function OrdersTable({ orders }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--t-line)" }}
      >
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>
            Order Log
          </p>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "var(--t-accent-20)", color: "var(--t-accent)" }}
          >
            {orders.length}
          </span>
        </div>
        <p className="text-[11px]" style={{ color: "var(--t-dim)" }}>
          Today's activity
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: "var(--t-float)" }}
          >
            📋
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--t-dim)" }}>
            No orders yet today
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--t-line)" }}>
                {["Order #", "Table", "Items", "Amount", "Status"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${i === 3 ? "text-right" : i === 4 ? "text-center" : "text-left"}`}
                    style={{ color: "var(--t-dim)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 50).map((order, idx) => {
                const cfg = STATUS_CONFIG[order.status];
                const itemSummary = order.items?.map((i) => i.name).join(", ") || "—";
                return (
                  <tr
                    key={order._id}
                    className="transition-colors duration-100"
                    style={{
                      borderBottom: idx < orders.length - 1 ? "1px solid var(--t-line)" : "none",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Order # */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        className="font-mono text-xs font-semibold"
                        style={{ color: "var(--t-accent)" }}
                      >
                        #{order.order_number}
                      </span>
                    </td>

                    {/* Table */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-lg"
                        style={{
                          background: "var(--t-float)",
                          color: "var(--t-text)",
                          border: "1px solid var(--t-line)",
                        }}
                      >
                        T{order.table?.table_number ?? order.table_number ?? "—"}
                      </span>
                    </td>

                    {/* Items */}
                    <td className="px-5 py-3 max-w-[200px]">
                      <p
                        className="text-xs truncate"
                        style={{ color: "var(--t-dim)" }}
                        title={itemSummary}
                      >
                        {itemSummary}
                      </p>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <span className="text-sm font-bold" style={{ color: "var(--t-text)" }}>
                        ₹{Math.round(order.total_amount || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3 text-center">
                      <span
                        className="inline-block text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{
                          background: cfg?.bg ?? "rgba(255,255,255,0.06)",
                          color: cfg?.color ?? "#94a3b8",
                          border: `1px solid ${cfg?.border ?? "rgba(255,255,255,0.1)"}`,
                        }}
                      >
                        {cfg?.label ?? order.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
export default function StatsPage() {
  const [range, setRange] = useState("today");
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setStats(null);
    Promise.all([
      apiCaller({ method: "GET", endpoint: `/api/restaurant-dash/stats?range=${range}`, useAdmin: true }),
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
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0);

  const revenue = Math.round(stats?.total_revenue ?? 0);
  const avgOrder = Math.round(stats?.average_order_value ?? 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-white"
          >
            Stats & Reports
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--t-dim)" }}>
            Performance overview for your restaurant
          </p>
        </div>

        {/* Range selector */}
        <div
          className="flex gap-1 p-1 rounded-xl self-start sm:self-auto"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
        >
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={
                range === r.value
                  ? {
                      background: "var(--t-accent)",
                      color: "#fff",
                      boxShadow: "0 2px 8px var(--t-accent-20)",
                    }
                  : { color: "var(--t-dim)" }
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--t-accent-20)", borderTopColor: "var(--t-accent)" }}
          />
          <p className="text-sm" style={{ color: "var(--t-dim)" }}>
            Loading stats…
          </p>
        </div>
      ) : (
        <>
          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Total Orders"
              value={stats?.total_orders ?? 0}
              sub={`${stats?.pending_orders ?? 0} pending`}
              accentColor="#3b82f6"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <path d="M9 12h6M9 16h4" />
                </svg>
              }
            />
            <StatCard
              label="Revenue"
              value={`₹${revenue.toLocaleString()}`}
              sub={`${stats?.paid_orders ?? 0} paid`}
              accentColor="var(--t-accent)"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="var(--t-accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              }
            />
            <StatCard
              label="Items Sold"
              value={itemsTotal}
              accentColor="#a855f7"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M3 10h18M12 6v14M9 20h6" />
                </svg>
              }
            />
            <StatCard
              label="Avg Order Value"
              value={`₹${avgOrder.toLocaleString()}`}
              accentColor="#22c55e"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20V10M12 20V4M6 20v-6" />
                </svg>
              }
            />
          </div>

          {/* ── Status breakdown ── */}
          {stats?.orders_by_status && Object.keys(stats.orders_by_status).length > 0 && (
            <StatusBreakdown data={stats.orders_by_status} />
          )}

          {/* ── Orders table ── */}
          <OrdersTable orders={orders} />
        </>
      )}
    </div>
  );
}
