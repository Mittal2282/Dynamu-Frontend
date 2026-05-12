import { useEffect, useState, useRef, useCallback } from "react";
import { getDashOrders, closeTableSession } from "../../../services/dashboardService";
import { apiCaller } from "../../../api/apiCaller";
import { getOrderStatusConfig, DASHBOARD_COLUMNS } from "../../../constants/orderStatusConfig";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  name: string;
  quantity?: number;
  unit_price?: number;
  is_veg?: boolean | null;
  menu_item?: { is_veg?: boolean; image_url?: string };
  image_url?: string;
  variant_name?: string;
  variant_group?: string;
  special_instructions?: string;
}

interface Order {
  _id: string;
  order_number?: string | number;
  status: string;
  createdAt: string;
  is_addon?: boolean;
  total_amount?: number;
  notes?: string;
  items?: OrderItem[];
  session?: { _id?: string } | string;
  table?: { table_number?: number | string };
  table_number?: number | string;
}

interface SessionGroup {
  sessionId: string;
  tableNumber: number | string | undefined;
  orders: Order[];
  latestAt: Date;
}

/* ─── Status group constants ────────────────────────────────────────────────── */
const ALLOCATED = ["pending", "confirmed"];
const IN_PROGRESS = ["preparing", "ready"];
const TERMINAL = ["served", "completed", "cancelled"];

function getSessionColumn(orders: Order[]): "allocated" | "inprogress" | "completed" {
  const primary = orders.find((o) => !o.is_addon) ?? orders[0];
  if (ALLOCATED.includes(primary?.status)) return "allocated";
  if (IN_PROGRESS.includes(primary?.status)) return "inprogress";
  if (orders.some((o) => IN_PROGRESS.includes(o.status))) return "inprogress";
  if (orders.some((o) => ALLOCATED.includes(o.status))) return "inprogress";
  return "completed";
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
function timeAgo(date: string): string {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ─── Veg indicator ───────────────────────────────────────────────────────────── */
interface VegDotProps { isVeg: boolean }

function VegDot({ isVeg }: VegDotProps) {
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

/* ─── Single item row ─────────────────────────────────────────────────────────── */
interface OrderItemRowProps { item: OrderItem }

function OrderItemRow({ item }: OrderItemRowProps) {
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

/* ─── Single order batch ────────────────────────────────────────────────────────── */
interface OrderBatchProps {
  order: Order;
  sessionOrders: Order[];
  onStatusChange: (orderId: string, status: string) => void;
  updating: string | null;
}

function OrderBatch({ order, sessionOrders, onStatusChange, updating }: OrderBatchProps) {
  const cfg = getOrderStatusConfig(order.status);

  let ctaLabel: string | null = null;
  let ctaStatus: string | null = null;
  let ctaDisabled = false;
  let ctaTooltip: string | null = null;
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
        {ctaLabel && ctaStatus && (
          <button
            onClick={() => !ctaDisabled && onStatusChange(order._id, ctaStatus!)}
            disabled={updating === order._id || ctaDisabled}
            title={ctaTooltip ?? undefined}
            className={`btn btn-xs btn-primary w-full sm:w-auto ${ctaDisabled ? 'opacity-45 cursor-not-allowed' : ''}`}
            style={ctaDisabled ? { background: '#475569', borderColor: '#475569' } : undefined}
          >
            {updating === order._id ? (
              <><span className="loading loading-spinner loading-xs" />Updating…</>
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
interface TableOrderCardProps {
  session: SessionGroup;
  column: string;
  onStatusChange: (orderId: string, status: string) => void;
  onCloseTable: (sessionId: string) => void;
  updating: string | null;
  closingTable: string | null;
  isNew: boolean;
}

function TableOrderCard({
  session,
  column,
  onStatusChange,
  onCloseTable,
  updating,
  closingTable,
  isNew,
}: TableOrderCardProps) {
  const { sessionId, tableNumber, orders: sessionOrders } = session;
  const allTerminal = sessionOrders.every((o) => TERMINAL.includes(o.status));
  const grandTotal = sessionOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const columnColor = DASHBOARD_COLUMNS.find((c: { key: string }) => c.key === column)?.color ?? "#64748b";

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
            className="btn btn-sm btn-ghost w-full text-[11px]"
          >
            {closingTable === sessionId ? (
              <><span className="loading loading-spinner loading-xs" />Closing…</>
            ) : (
              "Close table"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Skeleton ─────────────────────────────────────────────────────────────────── */
const COLUMN_DEFS: Array<{ color: string; label: string; cards: Array<{ items: number }> }> = [
  { color: '#f59e0b', label: 'Allocated',   cards: [{ items: 2 }, { items: 1 }] },
  { color: '#a855f7', label: 'In Progress', cards: [{ items: 3 }, { items: 2 }] },
  { color: '#22c55e', label: 'Completed',   cards: [{ items: 1 }] },
];

interface OrderCardSkeletonProps { color: string; itemCount: number }

function OrderCardSkeleton({ color, itemCount }: OrderCardSkeletonProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--t-surface)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="h-0.5 w-full" style={{ background: color }} />
      <div className="px-2.5 py-2 flex items-center justify-between gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2">
          <div className="shimmer w-7 h-7 rounded-lg shrink-0" />
          <div className="space-y-1">
            <div className="shimmer h-3 w-20 rounded" />
            <div className="shimmer h-2.5 w-14 rounded" />
          </div>
        </div>
        <div className="shimmer h-4 w-12 rounded" />
      </div>
      <div className="px-2.5 py-2 space-y-2">
        <div className="flex items-center gap-2 justify-between">
          <div className="shimmer h-2.5 w-16 rounded" />
          <div className="shimmer h-4 w-16 rounded-full" />
        </div>
        {Array.from({ length: itemCount }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 py-1">
            <div className="shimmer w-4 h-4 rounded shrink-0" />
            <div className="shimmer h-7 w-8 rounded-md shrink-0 hidden sm:block" />
            <div className="shimmer h-3 flex-1 rounded" />
            <div className="shimmer h-3 w-8 rounded" />
          </div>
        ))}
        <div className="flex items-center justify-between pt-1">
          <div className="shimmer h-3.5 w-12 rounded" />
          <div className="shimmer h-7 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function OrdersPageSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {COLUMN_DEFS.map(({ color, label, cards }) => (
          <div key={label} className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 pb-1.5" style={{ borderBottom: `1px solid ${color}28` }}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color, opacity: 0.5 }} />
              <div className="shimmer h-3 w-24 rounded" />
              <div className="shimmer h-4 w-5 rounded-md ml-auto" />
            </div>
            {cards.map((c, i) => (
              <OrderCardSkeleton key={i} color={color} itemCount={c.items} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────────── */
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [closingTable, setClosingTable] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [selectedTable, setSelectedTable] = useState<number | string | null>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());

  const fetchOrders = useCallback(async (quiet = false) => {
    try {
      const incoming = await getDashOrders() as Order[];
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
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      await apiCaller({
        method: "PUT",
        endpoint: `/api/restaurant-dash/orders/${orderId}/status`,
        payload: { status },
        useAdmin: true,
      });
      await fetchOrders(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to update status.");
    } finally {
      setUpdating(null);
    }
  };

  const handleCloseTable = async (sessionId: string) => {
    setClosingTable(sessionId);
    try {
      await closeTableSession(sessionId);
      await fetchOrders(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to close table session.");
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
  const sessionMap: Record<string, SessionGroup> = {};
  visibleOrders.forEach((o) => {
    const session = o.session;
    const key = String(
      typeof session === "object" && session !== null ? session._id : (session ?? o._id)
    );
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
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  });

  const sessions = Object.values(sessionMap).sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime());

  const columnSessions: Record<string, SessionGroup[]> = {
    allocated: sessions.filter((s) => getSessionColumn(s.orders) === "allocated"),
    inprogress: sessions.filter((s) => getSessionColumn(s.orders) === "inprogress"),
    completed: sessions.filter((s) => getSessionColumn(s.orders) === "completed"),
  };

  const isSessionNew = (session: SessionGroup) => session.orders.some((o) => newIds.has(o._id));
  const activeCount = orders.filter((o) => !TERMINAL.includes(o.status)).length;
  const showTableFilter = orders.length > 0 && tableNumbers.length > 0;
  const useTableSelect = tableNumbers.length > 8;

  if (initialLoading) return <OrdersPageSkeleton />;

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
                className="select select-bordered select-sm min-w-[8.5rem] text-xs font-semibold"
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
            <span className="badge badge-primary badge-sm shrink-0">{activeCount} active</span>
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

          <button type="button" onClick={() => fetchOrders()} className="btn btn-sm btn-ghost gap-1 ml-auto shrink-0">
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
          <button type="button" onClick={() => fetchOrders()} className="btn btn-sm btn-ghost gap-1 mt-2">
            <span aria-hidden>↻</span> Refresh
          </button>
        </div>
      )}

      {orders.length > 0 && (
        <div className="flex flex-col flex-1 min-h-0 md:h-[calc(100dvh-10rem)] md:min-h-[260px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:h-full md:min-h-0 md:grid-rows-1">
            {DASHBOARD_COLUMNS.map(({ key, label, color }: { key: string; label: string; color: string }) => {
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
                    <span className="badge badge-sm shrink-0" style={{ background: `${color}18`, color, border: 'none' }}>
                      {cols.length}
                    </span>
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
