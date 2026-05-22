import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRestaurantOrders } from "../../../services/superAdminService";
import { apiCaller } from "../../../api/apiCaller";
import type { Order } from "../../../types/order";

const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  pending: { color: "#eab308", bg: "rgba(234,179,8,0.15)" },
  confirmed: { color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  preparing: { color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
  ready: { color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  served: { color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
  completed: { color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
  cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
};

const ALL_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "completed",
  "cancelled",
];

interface RestaurantInfo {
  name?: string;
  slug?: string;
}

function timeAgo(date: string | Date): string {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function RestaurantOrdersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Reset loading when URL ID changes (set state during render pattern)
  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setLoading(true);
  }

  // Helper to trigger loading when filters change
  const handleFilterChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    setLoading(true);
    setter(value);
  };

  useEffect(() => {
    apiCaller<{ data?: { restaurant?: RestaurantInfo } }>({
      method: "GET",
      endpoint: `/api/superadmin/restaurants/${id}`,
      useAdmin: true,
    })
      .then((data) => setRestaurant(data?.data?.restaurant ?? null))
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    // setLoading(true) is now handled by event handlers for filters or the id-change effect above.
    getRestaurantOrders(id!)
      .then((data) => setOrders(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, statusFilter, dateFrom, dateTo]);

  const isFiltering = statusFilter || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate("/superadmin")}
          className="btn btn-sm btn-ghost gap-1.5 shrink-0 mt-0.5"
        >
          ← Back
        </button>
        <div>
          <h1
            className="text-2xl font-bold"
            style={
              {
                background: "linear-gradient(90deg, #fff 30%, #94a3b8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              } as React.CSSProperties
            }
          >
            {restaurant?.name || "Restaurant"} — Orders
          </h1>
          {restaurant?.slug && (
            <p className="text-slate-300 text-sm mt-0.5 font-mono">/{restaurant.slug}</p>
          )}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Status */}
        <div className="space-y-1">
          <label className="text-[11px] text-slate-300 uppercase tracking-wider block">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
            className="select select-bordered select-sm text-sm"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* From */}
        <div className="space-y-1">
          <label className="text-[11px] text-slate-300 uppercase tracking-wider block">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleFilterChange(setDateFrom, e.target.value)}
            className="input input-bordered input-sm text-sm"
          />
        </div>

        {/* To */}
        <div className="space-y-1">
          <label className="text-[11px] text-slate-300 uppercase tracking-wider block">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleFilterChange(setDateTo, e.target.value)}
            className="input input-bordered input-sm text-sm"
          />
        </div>

        {isFiltering && (
          <button
            onClick={() => {
              setLoading(true);
              setStatusFilter("");
              setDateFrom("");
              setDateTo("");
            }}
            className="text-xs text-slate-400 hover:text-white transition-colors pb-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Orders table ───────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Orders</p>
          {!loading && <span className="text-xs text-slate-300">{orders.length} total</span>}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 h-40">
            <span className="loading loading-spinner loading-md" />
            <span className="text-slate-300 text-sm">Loading orders…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm w-full">
              <thead>
                <tr>
                  <th className="text-xs font-semibold uppercase tracking-wider">Order #</th>
                  <th className="text-xs font-semibold uppercase tracking-wider">Table</th>
                  <th className="text-xs font-semibold uppercase tracking-wider">Items</th>
                  <th className="text-right text-xs font-semibold uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-center text-xs font-semibold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right text-xs font-semibold uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <p className="text-3xl mb-3">📋</p>
                      <p className="text-slate-300 text-sm">No orders found.</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="hover cursor-pointer">
                      <td className="font-mono text-xs text-slate-400">{order.order_number}</td>
                      <td>
                        Table{" "}
                        {(typeof order.table === "object"
                          ? order.table?.table_number
                          : undefined) ??
                          order.table_number ??
                          "—"}
                      </td>
                      <td className="max-w-55">
                        <span className="truncate block text-xs">
                          {order.items?.map((i) => `${i.name} ×${i.quantity}`).join(", ") || "—"}
                        </span>
                      </td>
                      <td className="text-right font-semibold" style={{ color: "var(--t-accent)" }}>
                        ₹{Math.round(order.total_amount || 0)}
                      </td>
                      <td className="text-center">
                        <span
                          className="badge badge-sm font-semibold"
                          style={{
                            color: STATUS_COLOR[order.status]?.color ?? "#94a3b8",
                            background: STATUS_COLOR[order.status]?.bg ?? "rgba(148,163,184,0.15)",
                            borderColor: "transparent",
                          }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="text-right text-xs whitespace-nowrap">
                        {order.createdAt ? timeAgo(order.createdAt) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
