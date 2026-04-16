import { useEffect, useState, useRef, useCallback } from "react";
import { getDashOrders, closeTableSession } from "../../../services/dashboardService";
import { apiCaller } from "../../../api/apiCaller";
import { getOrderStatusConfig, DASHBOARD_COLUMNS } from "../../../constants/orderStatusConfig";

/* ─── Status group constants ────────────────────────────────────────────────── */
const ALLOCATED = ["pending", "confirmed"];
const IN_PROGRESS = ["preparing", "ready"];
const TERMINAL = ["served", "completed", "cancelled"];

function getSessionColumn(orders) {
  // Primary order drives the column. Add-ons don't hold the card in Allocated
  // once the main order has moved to In Progress.
  const primary = orders.find((o) => !o.is_addon) ?? orders[0];
  if (ALLOCATED.includes(primary?.status)) return "allocated";
  if (IN_PROGRESS.includes(primary?.status)) return "inprogress";
  // Primary is terminal — check if any add-on is still active
  if (orders.some((o) => IN_PROGRESS.includes(o.status))) return "inprogress";
  if (orders.some((o) => ALLOCATED.includes(o.status))) return "inprogress";
  return "completed";
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ─── Veg indicator (compact: letter + dot) ───────────────────────────────────── */
function VegDot({ isVeg }) {
  const color = isVeg ? "#22c55e" : "#ef4444";
  const letter = isVeg ? "V" : "N";
  return (
    <span
      className="w-4 h-4 rounded text-[9px] font-black flex items-center justify-center shrink-0 leading-none"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
      title={isVeg ? "Veg" : "Non-Veg"}
    >
      {letter}
    </span>
  );
}

/* ─── Single item row (compact) ─────────────────────────────────────────────── */
function OrderItemRow({ item }) {
  const imageUrl = item.image_url ?? item.menu_item?.image_url;
  const isVeg = item.is_veg ?? item.menu_item?.is_veg;
  const vegColor = isVeg === false ? "#ef4444" : "#22c55e";
  const unitPrice = item.unit_price ?? 0;
  const total = Math.round(unitPrice * (item.quantity ?? 1));
  const variantBit =
    item.variant_name &&
    `${item.variant_group ? `${item.variant_group}: ` : ""}${item.variant_name}`;
  const instruct = item.special_instructions?.trim();

  return (
    <div
      className="flex items-center gap-2 py-1 px-2 rounded-lg"
      style={{
        borderLeft: `2px solid ${vegColor}`,
        background: isVeg === false ? "rgba(239,68,68,0.04)" : "rgba(34,197,94,0.04)",
      }}
    >
      {isVeg !== undefined && isVeg !== null && <VegDot isVeg={isVeg} />}
      <div
        className="w-7 h-7 rounded-md overflow-hidden shrink-0 hidden sm:block"
        style={{ background: "var(--t-float)" }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] opacity-70">
            {isVeg === false ? "🍗" : "🥗"}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white leading-tight line-clamp-1">
          {item.name}
          {variantBit && <span className="font-medium text-slate-400"> · {variantBit}</span>}
        </p>
        {instruct && (
          <p
            className="text-[10px] font-medium mt-0.5 leading-tight line-clamp-1 text-amber-400/90"
            title={instruct}
            style={{ background: "rgba(251,191,36,0.08)" }}
          >
            📝 {instruct}
          </p>
        )}
      </div>

      <div className="text-right shrink-0 leading-tight">
        <p className="text-[10px] text-slate-300 tabular-nums">×{item.quantity ?? 1}</p>
        <p className="text-xs font-bold tabular-nums" style={{ color: "var(--t-accent)" }}>
          ₹{total}
        </p>
      </div>
    </div>
  );
}

/* ─── Single order batch (original or add-on) ────────────────────────────────── */
function OrderBatch({ order, sessionOrders, onStatusChange, updating }) {
  const cfg = getOrderStatusConfig(order.status);

  // Determine CTA
  let ctaLabel = null;
  let ctaStatus = null;
  let ctaDisabled = false;
  let ctaTooltip = null;
  let ctaBg = "var(--t-accent)";

  if (ALLOCATED.includes(order.status)) {
    ctaLabel = "Start Preparing";
    ctaStatus = "preparing";
  } else if (IN_PROGRESS.includes(order.status)) {
    ctaLabel = "Mark Complete";
    ctaStatus = "served";
    const hasAllocatedSibling = sessionOrders.some(
      (s) => s._id !== order._id && ALLOCATED.includes(s.status),
    );
    if (hasAllocatedSibling) {
      ctaDisabled = true;
      ctaTooltip = "Accept all orders for this table first";
      ctaBg = "#475569";
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-1.5 min-h-[22px]">
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
          {order.is_addon && (
            <span
              className="text-[9px] font-bold px-1 py-0.5 rounded border shrink-0"
              style={{
                background: "rgba(249,115,22,0.12)",
                color: "#fb923c",
                borderColor: "rgba(249,115,22,0.2)",
              }}
            >
              +ADD
            </span>
          )}
          <span className="text-[10px] text-slate-300 font-mono shrink-0">
            #{order.order_number}
          </span>
          <span className="text-[10px] text-slate-600 truncate">
            {formatTime(order.createdAt)} · {timeAgo(order.createdAt)}
          </span>
        </div>
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${cfg.badge}`}
        >
          {cfg.label}
        </span>
      </div>

      {(() => {
        const rawItems = order.items ?? [];
        const vegItems = rawItems.filter((it) => (it.is_veg ?? it.menu_item?.is_veg) !== false);
        const nonVegItems = rawItems.filter((it) => (it.is_veg ?? it.menu_item?.is_veg) === false);
        const hasBoth = vegItems.length > 0 && nonVegItems.length > 0;
        const sorted = [...vegItems, ...nonVegItems];
        return (
          <div className="space-y-1">
            {sorted.map((item, i) => {
              const showDivider = hasBoth && i === vegItems.length;
              return (
                <div key={i}>
                  {showDivider && (
                    <div className="flex items-center gap-1.5 my-0.5">
                      <div className="flex-1 h-px" style={{ background: "rgba(239,68,68,0.2)" }} />
                      <span
                        className="text-[9px] font-bold px-1 rounded"
                        style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)" }}
                      >
                        Non-Veg
                      </span>
                      <div className="flex-1 h-px" style={{ background: "rgba(239,68,68,0.2)" }} />
                    </div>
                  )}
                  <OrderItemRow item={item} />
                </div>
              );
            })}
          </div>
        );
      })()}

      {order.notes && (
        <p
          className="text-[10px] text-slate-400 rounded-md px-2 py-1 line-clamp-2 leading-snug"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
          title={order.notes}
        >
          <span className="font-semibold text-slate-300">Note: </span>
          {order.notes}
        </p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 pt-0.5">
        <span className="text-xs font-bold tabular-nums" style={{ color: "var(--t-accent)" }}>
          ₹{Math.round(order.total_amount || 0)}
        </span>
        {ctaLabel && (
          <button
            onClick={() => !ctaDisabled && onStatusChange(order._id, ctaStatus)}
            disabled={updating === order._id || ctaDisabled}
            title={ctaTooltip ?? undefined}
            className={`w-full sm:w-auto text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.98] ${
              ctaDisabled ? "cursor-not-allowed" : ""
            }`}
            style={{
              background: updating === order._id ? "var(--t-accent)" : ctaBg,
              opacity: ctaDisabled ? 0.45 : 1,
            }}
          >
            {updating === order._id ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                Updating…
              </span>
            ) : (
              ctaLabel
            )}
          </button>
        )}
      </div>

      {ALLOCATED.includes(order.status) && (
        <button
          onClick={() => onStatusChange(order._id, "cancelled")}
          disabled={updating === order._id}
          className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors w-full text-right disabled:opacity-40"
        >
          Cancel order
        </button>
      )}
    </div>
  );
}

/* ─── Full session card ────────────────────────────────────────────────────────── */
function TableOrderCard({
  session,
  column,
  onStatusChange,
  onCloseTable,
  updating,
  closingTable,
  isNew,
}) {
  const { sessionId, tableNumber, orders: sessionOrders } = session;
  const allTerminal = sessionOrders.every((o) => TERMINAL.includes(o.status));
  const grandTotal = sessionOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const columnColor = DASHBOARD_COLUMNS.find((c) => c.key === column)?.color ?? "#64748b";

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300 relative"
      style={{
        background: "var(--t-surface)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: isNew ? "0 0 0 1px rgba(249,115,22,0.45)" : undefined,
      }}
    >
      <div className="h-0.5 w-full" style={{ background: columnColor }} />

      <div
        className="px-2.5 py-2 flex items-center justify-between gap-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
            style={{ background: `${columnColor}22`, color: columnColor }}
          >
            {tableNumber ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs font-bold text-white leading-none">
                Table {tableNumber ?? "?"}
              </p>
              <span className="text-[10px] text-slate-300">
                {sessionOrders.length} order{sessionOrders.length !== 1 ? "s" : ""}
              </span>
              {isNew && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                  NEW
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="text-sm font-black tabular-nums shrink-0" style={{ color: columnColor }}>
          ₹{Math.round(grandTotal)}
        </p>
      </div>

      <div className="px-2.5 py-2 space-y-3">
        {sessionOrders.map((order, idx) => (
          <div key={order._id}>
            {idx > 0 && <div className="border-t border-white/[0.06] mb-3 pt-1" />}
            <OrderBatch
              order={order}
              sessionOrders={sessionOrders}
              onStatusChange={onStatusChange}
              updating={updating}
            />
          </div>
        ))}
      </div>

      {allTerminal && sessionId && (
        <div className="px-2.5 pb-2.5">
          <button
            onClick={() => onCloseTable(sessionId)}
            disabled={closingTable === sessionId}
            className="w-full py-2 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white transition-all duration-150 disabled:opacity-40"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {closingTable === sessionId ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="w-3 h-3 border-2 border-slate-400/40 border-t-slate-400 rounded-full animate-spin inline-block" />
                Closing…
              </span>
            ) : (
              "Close table"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────────── */
export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [updating, setUpdating] = useState(null);
  const [closingTable, setClosingTable] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [newIds, setNewIds] = useState(new Set());
  const [selectedTable, setSelectedTable] = useState(null);
  const prevIdsRef = useRef(new Set());

  const fetchOrders = useCallback(async (quiet = false) => {
    try {
      const incoming = await getDashOrders();
      const incomingIds = new Set(incoming.map((o) => o._id));
      const brandNew = [...incomingIds].filter((id) => !prevIdsRef.current.has(id));
      if (brandNew.length > 0 && prevIdsRef.current.size > 0) {
        setNewIds(new Set(brandNew));
        setTimeout(() => setNewIds(new Set()), 4000);
      }
      prevIdsRef.current = incomingIds;
      setOrders(incoming);
      if (!quiet) setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await apiCaller({
        method: "PUT",
        endpoint: `/api/restaurant-dash/orders/${orderId}/status`,
        payload: { status },
        useAdmin: true,
      });
      await fetchOrders(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status.");
    } finally {
      setUpdating(null);
    }
  };

  const handleCloseTable = async (sessionId) => {
    setClosingTable(sessionId);
    try {
      await closeTableSession(sessionId);
      await fetchOrders(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to close table session.");
    } finally {
      setClosingTable(null);
    }
  };

  /* ── Derived data ── */
  const tableNumbers = [
    ...new Set(orders.map((o) => o.table?.table_number ?? o.table_number).filter((n) => n != null)),
  ].sort((a, b) => Number(a) - Number(b));

  const visibleOrders =
    selectedTable != null
      ? orders.filter((o) => (o.table?.table_number ?? o.table_number) == selectedTable)
      : orders;

  // Group by session
  const sessionMap = {};
  visibleOrders.forEach((o) => {
    const key = String(o.session?._id ?? o.session ?? o._id);
    if (!sessionMap[key]) {
      sessionMap[key] = {
        sessionId: key,
        tableNumber: o.table?.table_number ?? o.table_number,
        orders: [],
        latestAt: new Date(0),
      };
    }
    sessionMap[key].orders.push(o);
    const t = new Date(o.createdAt);
    if (t > sessionMap[key].latestAt) sessionMap[key].latestAt = t;
  });

  // Sort within session: original first, then add-ons by time
  Object.values(sessionMap).forEach((s) => {
    s.orders.sort((a, b) => {
      if (!a.is_addon && b.is_addon) return -1;
      if (a.is_addon && !b.is_addon) return 1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  });

  const sessions = Object.values(sessionMap).sort((a, b) => b.latestAt - a.latestAt);

  const columnSessions = {
    allocated: sessions.filter((s) => getSessionColumn(s.orders) === "allocated"),
    inprogress: sessions.filter((s) => getSessionColumn(s.orders) === "inprogress"),
    completed: sessions.filter((s) => getSessionColumn(s.orders) === "completed"),
  };

  const isSessionNew = (session) => session.orders.some((o) => newIds.has(o._id));
  const activeCount = orders.filter((o) => !TERMINAL.includes(o.status)).length;
  const showTableFilter = orders.length > 0 && tableNumbers.length > 0;
  const useTableSelect = tableNumbers.length > 8;

  return (
    <div className="flex flex-col gap-3 min-h-0">
      {orders.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 gap-y-2">
          {showTableFilter && useTableSelect && (
            <label className="flex items-center gap-2 text-[11px] text-slate-300 shrink-0">
              <span className="sr-only">Table</span>
              <select
                value={selectedTable == null ? "" : String(selectedTable)}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedTable(v === "" ? null : v);
                }}
                className="rounded-lg border border-white/10 bg-white/5 text-white text-xs font-semibold py-1.5 pl-2 pr-8 min-w-[8.5rem] cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                style={{ colorScheme: "dark" }}
              >
                <option value="">All tables</option>
                {tableNumbers.map((num) => (
                  <option key={String(num)} value={String(num)}>
                    Table {num}
                  </option>
                ))}
              </select>
            </label>
          )}

          {showTableFilter && !useTableSelect && (
            <div className="flex gap-1.5 flex-wrap items-center min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all duration-150 ${
                  selectedTable === null
                    ? "text-white border-transparent"
                    : "text-slate-400 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
                style={
                  selectedTable === null
                    ? { background: "var(--t-accent)", borderColor: "transparent" }
                    : {}
                }
              >
                All
              </button>
              {tableNumbers.map((num) => (
                <button
                  type="button"
                  key={String(num)}
                  onClick={() => setSelectedTable(selectedTable == num ? null : num)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all duration-150 ${
                    selectedTable == num
                      ? "text-white border-transparent"
                      : "text-slate-400 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                  style={
                    selectedTable == num
                      ? { background: "var(--t-accent)", borderColor: "transparent" }
                      : {}
                  }
                >
                  T{num}
                </button>
              ))}
            </div>
          )}

          {activeCount > 0 && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: "var(--t-accent-20)", color: "var(--t-accent)" }}
            >
              {activeCount} active
            </span>
          )}

          <span className="text-[10px] text-slate-300 shrink-0">
            Auto 10s
            {lastRefresh && (
              <span className="text-slate-600">
                {" "}
                ·{" "}
                {lastRefresh.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            )}
          </span>

          <button
            type="button"
            onClick={() => fetchOrders()}
            className="ml-auto flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-lg transition-all duration-150 shrink-0"
          >
            <span aria-hidden>↻</span> Refresh
          </button>
        </div>
      )}

      {orders.length === 0 && (
        <div
          className="border border-white/10 rounded-xl flex flex-col items-center justify-center py-12 text-center gap-2"
          style={{ background: "var(--t-surface)" }}
        >
          <span className="text-4xl">🍽️</span>
          <p className="text-white text-sm font-semibold">No orders yet</p>
          <p className="text-slate-300 text-xs">Waiting for customers to place orders…</p>
          <button
            type="button"
            onClick={() => fetchOrders()}
            className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-lg transition-all duration-150"
          >
            <span aria-hidden>↻</span> Refresh
          </button>
        </div>
      )}

      {orders.length > 0 && (
        <div className="flex flex-col flex-1 min-h-0 md:h-[calc(100dvh-10rem)] md:min-h-[260px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:h-full md:min-h-0 md:grid-rows-1">
            {DASHBOARD_COLUMNS.map(({ key, label, color }) => {
              const cols = columnSessions[key] ?? [];
              return (
                <div key={key} className="flex flex-col min-h-0 md:h-full md:min-h-0">
                  <div
                    className="flex items-center justify-between px-0.5 pb-1.5 mb-1 border-b shrink-0"
                    style={{ borderColor: `${color}28` }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: color }}
                      />
                      <h2
                        className="text-[11px] font-bold uppercase tracking-wide truncate"
                        style={{ color }}
                      >
                        {label}
                      </h2>
                    </div>
                    <div
                      className="min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                      style={{ background: `${color}18`, color }}
                    >
                      {cols.length}
                    </div>
                  </div>

                  <div
                    className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5 min-h-[72px]
                      max-h-[min(40vh,calc(100dvh-12rem))] md:max-h-none"
                  >
                    {cols.length === 0 ? (
                      <div
                        className="rounded-xl h-14 flex items-center justify-center"
                        style={{ border: `1px dashed ${color}20` }}
                      >
                        <span className="text-slate-600 text-[10px]">No orders</span>
                      </div>
                    ) : (
                      cols.map((session) => (
                        <TableOrderCard
                          key={session.sessionId}
                          session={session}
                          column={key}
                          onStatusChange={handleStatusChange}
                          onCloseTable={handleCloseTable}
                          updating={updating}
                          closingTable={closingTable}
                          isNew={isSessionNew(session)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
