import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRestaurantOrders } from "../../../services/superAdminService";
import { apiCaller } from "../../../api/apiCaller";

const STATUS_BADGE = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  preparing: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  ready: "bg-green-500/15 text-green-400 border-green-500/20",
  served: "bg-slate-500/15 text-slate-300 border-slate-500/20",
  completed: "bg-slate-500/15 text-slate-300 border-slate-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
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
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Reset loading when URL ID changes (Set state during render pattern)
  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setLoading(true);
  }

  // Helper to trigger loading when filters change
  const handleFilterChange = (setter, value) => {
    setLoading(true);
    setter(value);
  };

  useEffect(() => {
    apiCaller({ method: "GET", endpoint: `/api/superadmin/restaurants/${id}`, useAdmin: true })
      .then((data) => setRestaurant(data?.data?.restaurant))
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    // setLoading(true) is now handled by event handlers for filters or the id-change effect above.
    getRestaurantOrders(id)
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
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl transition-all duration-150 shrink-0 mt-0.5"
        >
          ← Back
        </button>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              background: "linear-gradient(90deg, #fff 30%, #94a3b8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
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
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none transition-colors"
            onFocus={(e) => (e.target.style.borderColor = "var(--t-accent)")}
            onBlur={(e) => (e.target.style.borderColor = "")}
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
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none transition-colors"
            onFocus={(e) => (e.target.style.borderColor = "var(--t-accent)")}
            onBlur={(e) => (e.target.style.borderColor = "")}
          />
        </div>

        {/* To */}
        <div className="space-y-1">
          <label className="text-[11px] text-slate-300 uppercase tracking-wider block">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleFilterChange(setDateTo, e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none transition-colors"
            onFocus={(e) => (e.target.style.borderColor = "var(--t-accent)")}
            onBlur={(e) => (e.target.style.borderColor = "")}
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
            <div className="w-6 h-6 border-[3px] border-white/10 border-t-orange-500 rounded-full animate-spin" />
            <span className="text-slate-300 text-sm">Loading orders…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <p className="text-3xl mb-3">📋</p>
                      <p className="text-slate-300 text-sm">No orders found.</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-5 py-4 font-mono text-xs text-slate-400 group-hover:text-white transition-colors">
                        {order.order_number}
                      </td>
                      <td className="px-5 py-4 text-slate-200">
                        Table {order.table?.table_number ?? order.table_number ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-300 max-w-[220px]">
                        <span className="truncate block text-xs">
                          {order.items?.map((i) => `${i.name} ×${i.quantity}`).join(", ") || "—"}
                        </span>
                      </td>
                      <td
                        className="px-5 py-4 text-right font-semibold"
                        style={{ color: "var(--t-accent)" }}
                      >
                        ₹{Math.round(order.total_amount || 0)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_BADGE[order.status] ?? "bg-white/10 text-white border-white/10"}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-slate-300 text-xs whitespace-nowrap">
                        {timeAgo(order.createdAt)}
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
