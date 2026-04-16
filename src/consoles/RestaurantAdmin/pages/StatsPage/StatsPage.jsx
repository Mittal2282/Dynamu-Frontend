import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { getDashOrders } from "../../../../services/dashboardService";
import { apiCaller } from "../../../../api/apiCaller";

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

/* ─── Order Detail Panel (right slide-over) ──────────────────────────────────── */
function OrderDetailPanel({ order, onClose }) {
  const open = !!order;

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const cfg = order ? STATUS_CONFIG[order.status] : null;
  const tableNum = order?.table?.table_number ?? order?.table_number;
  const dateStr = order?.createdAt
    ? new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "—";

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: "rgba(0,0,0,0.55)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s",
        }}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md flex flex-col"
        style={{
          background: "var(--t-bg)",
          borderLeft: "1px solid var(--t-line)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease-out",
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--t-line)" }}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold" style={{ color: "var(--t-accent)" }}>
              #{order?.order_number}
            </span>
            {cfg && (
              <span
                className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
              >
                {cfg.label}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer transition-colors"
            style={{ color: "var(--t-dim)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-float)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Meta row */}
        <div
          className="px-5 py-3 flex items-center gap-3 shrink-0"
          style={{ borderBottom: "1px solid var(--t-line)" }}
        >
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={{ background: "var(--t-float)", color: "var(--t-text)", border: "1px solid var(--t-line)" }}
          >
            {tableNum != null ? `T${tableNum}` : "Take-away"}
          </span>
          <span className="text-xs" style={{ color: "var(--t-dim)" }}>{dateStr}</span>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--t-dim)" }}>
            Items ({order?.items?.length ?? 0})
          </p>

          {order?.items?.map((item, i) => {
            const isVeg = item.menu_item?.is_veg ?? item.is_veg;
            const imageUrl = item.menu_item?.image_url;
            const variantLabel = item.variant_name
              ? (item.variant_group ? `${item.variant_group} · ${item.variant_name}` : item.variant_name)
              : null;
            return (
              <div
                key={i}
                className="flex items-start gap-3 py-2.5 px-3 rounded-xl"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
              >
                {/* Thumbnail with veg/non-veg dot overlay */}
                <div className="relative shrink-0" style={{ width: 52, height: 52 }}>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  )}
                  {!imageUrl && (
                    <div
                      className="w-full h-full rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: "var(--t-float)" }}
                    >
                      {isVeg ? "🥗" : "🍗"}
                    </div>
                  )}
                  <span
                    className="absolute bottom-0.5 left-0.5 w-2.5 h-2.5 rounded-full border-2"
                    style={{
                      background: isVeg ? "#22c55e" : "#ef4444",
                      borderColor: "var(--t-bg)",
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-snug">{item.name}</p>
                      {variantLabel && (
                        <p className="text-[11px]" style={{ color: "var(--t-dim)" }}>{variantLabel}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: "var(--t-text)" }}>
                        ₹{Math.round((item.unit_price ?? 0) * item.quantity).toLocaleString()}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--t-dim)" }}>
                        {item.quantity} × ₹{Math.round(item.unit_price ?? 0)}
                      </p>
                    </div>
                  </div>
                  {item.special_instructions && (
                    <p
                      className="mt-1 text-[11px] px-2 py-1 rounded-lg"
                      style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}
                    >
                      {item.special_instructions}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Order notes */}
          {order?.notes && (
            <div
              className="px-3 py-2.5 rounded-xl"
              style={{ background: "var(--t-float)", border: "1px solid var(--t-line)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--t-dim)" }}>
                Order Note
              </p>
              <p className="text-xs italic" style={{ color: "var(--t-dim)" }}>{order.notes}</p>
            </div>
          )}
        </div>

        {/* Total footer */}
        <div
          className="px-5 py-4 flex items-center justify-between shrink-0"
          style={{ borderTop: "1px solid var(--t-line)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--t-dim)" }}>Total</p>
          <p className="text-2xl font-bold" style={{ color: "var(--t-text)" }}>
            ₹{Math.round(order?.total_amount ?? 0).toLocaleString()}
          </p>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ─── Orders Table ───────────────────────────────────────────────────────────── */
function OrdersTable({ orders, onOrderClick }) {
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
                    className="transition-colors duration-100 cursor-pointer"
                    style={{
                      borderBottom: idx < orders.length - 1 ? "1px solid var(--t-line)" : "none",
                    }}
                    onClick={() => onOrderClick(order)}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
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
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    let ignore = false;

    // Fetch data whenever range changes.
    // Note: setLoading(true) is called in the event handler (handleRangeChange)
    // to avoid synchronous state updates within the effect body.
    Promise.all([
      apiCaller({ method: "GET", endpoint: `/api/restaurant-dash/stats?range=${range}`, useAdmin: true }),
      getDashOrders(),
    ])
      .then(([statsData, orderList]) => {
        if (!ignore) {
          setStats(statsData?.data);
          setOrders(orderList);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => { ignore = true; };
  }, [range]);

  const handleRangeChange = (newRange) => {
    if (newRange === range) return;
    setRange(newRange);
    setLoading(true);
    setStats(null);
  };

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
              onClick={() => handleRangeChange(r.value)}
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
          <OrdersTable orders={orders} onOrderClick={setSelectedOrder} />
        </>
      )}

      {/* ── Order detail slide-over ── */}
      <OrderDetailPanel order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
