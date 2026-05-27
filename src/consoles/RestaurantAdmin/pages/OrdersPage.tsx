import { useEffect, useState, useRef, useCallback } from "react";
import { Button, Select } from "antd";
import { getDashOrders, getPetpoojaConfig, markBillPaid, getPaymentMethods, collectOrderPayment } from "../../../services/dashboardService";
import { useToast } from "../../../components/ui/Toast";
import { apiCaller } from "../../../api/apiCaller";
import { connectAdminSocket } from "../../../services/socketService";
import { authStore } from "../../../store/authStore";
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
  payment_status?: string;
  createdAt: string;
  is_addon?: boolean;
  total_amount?: number;
  notes?: string;
  items?: OrderItem[];
  session?: { _id?: string } | string;
  table?: { table_number?: number | string };
  table_number?: number | string;
  source?: string;
  customer_name?: string;
}

interface SessionGroup {
  sessionId: string;
  tableNumber: number | string | undefined;
  orders: Order[];
  latestAt: Date;
  source?: string;
}

interface BillRequest {
  id: string;
  table_number: number | string;
  session_id: string;
  members: string[];
  requestedAt: number;
}

/* ─── Status group constants ────────────────────────────────────────────────── */
const ALLOCATED = ["pending", "confirmed"];
const IN_PROGRESS = ["preparing", "ready"];
const TERMINAL = ["served", "completed", "cancelled"];

const EXTERNAL_SOURCES = new Set(["zomato", "swiggy"]);

function getSessionColumn(orders: Order[]): "allocated" | "inprogress" | "completed" | "thirdparty" {
  const primarySource = orders[0]?.source;
  if (primarySource && EXTERNAL_SOURCES.has(primarySource)) return "thirdparty";
  const primary = orders.find((o) => !o.is_addon) ?? orders[0];
  if (ALLOCATED.includes(primary?.status)) return "allocated";
  if (IN_PROGRESS.includes(primary?.status)) return "inprogress";
  if (orders.some((o) => IN_PROGRESS.includes(o.status))) return "inprogress";
  if (orders.some((o) => ALLOCATED.includes(o.status))) return "inprogress";
  return "completed";
}

const ORDERS_PAGE_COLUMNS = [
  ...DASHBOARD_COLUMNS,
  { key: "thirdparty", label: "3rd Party Orders", color: "#8b5cf6" },
];

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
  return (
    <span
      className="w-2 h-2 rounded-full shrink-0"
      style={{ background: color }}
      title={isVeg ? "Veg" : "Non-Veg"}
    />
  );
}

/* ─── Single item row — compact, no images ───────────────────────────────────── */
interface OrderItemRowProps { item: OrderItem }

function OrderItemRow({ item }: OrderItemRowProps) {
  const isVeg = item.is_veg ?? item.menu_item?.is_veg;
  const qty = item.quantity ?? 1;
  const variantBit =
    item.variant_name &&
    `${item.variant_group ? `${item.variant_group}: ` : ""}${item.variant_name}`;
  const instruct = item.special_instructions?.trim();
  const vegColor = isVeg === false ? "#ef4444" : "#22c55e";

  return (
    <div
      className="flex flex-col gap-0.5 py-1 px-2 rounded-lg"
      style={{
        borderLeft: `2px solid ${vegColor}`,
        background: isVeg === false ? "rgba(239,68,68,0.04)" : "rgba(34,197,94,0.04)",
      }}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {isVeg !== undefined && isVeg !== null && <VegDot isVeg={isVeg} />}
        <span
          className="text-[11px] font-bold tabular-nums shrink-0"
          style={{ color: "var(--t-dim)" }}
        >
          ×{qty}
        </span>
        <p className="text-xs font-medium leading-tight truncate flex-1" style={{ color: "var(--t-text)" }}>
          {item.name}
          {variantBit && (
            <span className="font-normal" style={{ color: "var(--t-dim)" }}> · {variantBit}</span>
          )}
        </p>
        {item.unit_price != null && (
          <span className="text-[10px] tabular-nums shrink-0 font-semibold" style={{ color: "var(--t-dim)" }}>
            ₹{item.unit_price}
          </span>
        )}
      </div>
      {instruct && (
        <p
          className="text-[10px] font-medium leading-tight line-clamp-1 pl-6 text-amber-400/90"
          title={instruct}
        >
          📝 {instruct}
        </p>
      )}
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
    }
  }

  return (
    <div className="space-y-1">
      {/* Order meta row */}
      <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
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
          <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--t-dim)" }}>
            #{order.order_number}
          </span>
          <span className="text-[10px] truncate" style={{ color: "var(--t-dim)", opacity: 0.7 }}>
            {formatTime(order.createdAt)} · {timeAgo(order.createdAt)}
          </span>
        </div>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>

      {/* Items */}
      {(() => {
        const rawItems = order.items ?? [];
        const vegItems = rawItems.filter((it) => (it.is_veg ?? it.menu_item?.is_veg) !== false);
        const nonVegItems = rawItems.filter((it) => (it.is_veg ?? it.menu_item?.is_veg) === false);
        const hasBoth = vegItems.length > 0 && nonVegItems.length > 0;
        const sorted = [...vegItems, ...nonVegItems];
        return (
          <div className="space-y-0.5">
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
          className="text-[10px] rounded-md px-2 py-1 line-clamp-2 leading-snug"
          style={{
            background: "var(--t-float)",
            border: "1px solid var(--t-line)",
            color: "var(--t-dim)",
          }}
          title={order.notes}
        >
          <span className="font-semibold" style={{ color: "var(--t-text)" }}>Note: </span>
          {order.notes}
        </p>
      )}

      {/* CTA */}
      <div className="flex items-center justify-between gap-1.5 pt-0.5">
        <span className="text-xs font-bold tabular-nums" style={{ color: "var(--t-accent)" }}>
          ₹{Math.round(order.total_amount || 0)}
        </span>
        {ctaLabel && ctaStatus && (
          <Button
            type="primary"
            size="small"
            loading={updating === order._id}
            disabled={ctaDisabled}
            title={ctaTooltip ?? undefined}
            onClick={() => !ctaDisabled && onStatusChange(order._id, ctaStatus!)}
            style={ctaDisabled ? { background: "#475569", borderColor: "#475569" } : undefined}
          >
            {updating === order._id ? "Updating…" : ctaLabel}
          </Button>
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

/* ─── Full session card ──────────────────────────────────────────────────────── */
interface TableOrderCardProps {
  session: SessionGroup;
  column: string;
  onStatusChange: (orderId: string, status: string) => void;
  updating: string | null;
  isNew: boolean;
  onCollectPayment?: (orderId: string, paymentMethod: string) => Promise<void>;
  allPaymentMethods?: string[];
}

const EXTERNAL_SOURCE_CFG: Record<string, { label: string; color: string }> = {
  zomato: { label: "Zomato", color: "#ef4444" },
  swiggy: { label: "Swiggy", color: "#f97316" },
  pos:    { label: "POS",    color: "#6366f1" },
};

function TableOrderCard({
  session,
  column,
  onStatusChange,
  updating,
  isNew,
  onCollectPayment,
  allPaymentMethods = ["cash", "card_on_delivery", "upi"],
}: TableOrderCardProps) {
  const { tableNumber, orders: sessionOrders, source } = session;
  const grandTotal = sessionOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const columnColor = DASHBOARD_COLUMNS.find((c: { key: string }) => c.key === column)?.color ?? "#64748b";
  const externalCfg = source ? EXTERNAL_SOURCE_CFG[source] : undefined;
  const headerLabel = externalCfg
    ? externalCfg.label
    : tableNumber != null ? `Table ${tableNumber}` : "POS Order";
  const headerColor = externalCfg ? externalCfg.color : columnColor;

  // Collect Payment UI state (for served POS orders)
  const [posPayMethod, setPosPayMethod] = useState("cash");
  const [collecting, setCollecting] = useState(false);

  const posUnpaidOrders = source === "pos"
    ? sessionOrders.filter((o) => o.payment_status !== "paid" && TERMINAL.includes(o.status))
    : [];

  const showCollectPayment = posUnpaidOrders.length > 0 && column === "completed" && !!onCollectPayment;

  async function handleCollect() {
    if (!onCollectPayment) return;
    setCollecting(true);
    try {
      for (const o of posUnpaidOrders) {
        await onCollectPayment(o._id, posPayMethod);
      }
    } finally {
      setCollecting(false);
    }
  }

  const pmLabel = (m: string) => {
    const map: Record<string, string> = { cash: "Cash", card_on_delivery: "Card", upi: "UPI", razorpay: "Online" };
    return map[m] ?? m.charAt(0).toUpperCase() + m.slice(1);
  };

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: "var(--t-surface)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: isNew ? "0 0 0 1px rgba(249,115,22,0.45)" : undefined,
      }}
    >
      <div className="h-0.5 w-full" style={{ background: headerColor }} />

      {/* Card header */}
      <div
        className="px-2.5 py-1.5 flex items-center justify-between gap-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <p className="text-xs font-bold leading-none" style={{ color: headerColor }}>
            {headerLabel}
          </p>
          <span className="text-[10px]" style={{ color: "var(--t-dim)" }}>
            {sessionOrders.length} order{sessionOrders.length !== 1 ? "s" : ""}
          </span>
          {isNew && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              NEW
            </span>
          )}
        </div>
        <p className="text-sm font-black tabular-nums shrink-0" style={{ color: headerColor }}>
          ₹{Math.round(grandTotal)}
        </p>
      </div>

      {/* Orders */}
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

      {/* Collect Payment UI — shown for served POS orders that haven't been paid */}
      {showCollectPayment && (
        <div
          className="px-2.5 pb-2.5 pt-2"
          style={{ borderTop: "1px solid var(--t-line)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#f59e0b" }}>
            Collect Payment
          </p>
          <div className="flex items-center gap-1.5">
            <select
              value={posPayMethod}
              onChange={(e) => setPosPayMethod(e.target.value)}
              className="flex-1 text-xs rounded-lg px-2 py-1.5 outline-none"
              style={{ background: "var(--t-float)", border: "1px solid var(--t-line)", color: "var(--t-text)" }}
            >
              {allPaymentMethods.map((m) => (
                <option key={m} value={m}>{pmLabel(m)}</option>
              ))}
            </select>
            <button
              onClick={handleCollect}
              disabled={collecting}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
              style={{ background: "var(--t-accent)", color: "#fff", opacity: collecting ? 0.7 : 1 }}
            >
              {collecting ? (
                <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              ) : "Collect"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Bill request card ──────────────────────────────────────────────────────── */
interface BillRequestCardProps {
  req: BillRequest;
  total: number;
  onDismiss: () => void;
  onMarkPaid: (paymentMethod: string) => Promise<void>;
  customMethods: string[];
}

function BillRequestCard({ req, total, onDismiss, onMarkPaid, customMethods }: BillRequestCardProps) {
  const memberStr = req.members.filter(Boolean).join(", ");
  const elapsed = Math.floor((Date.now() - req.requestedAt) / 60000);
  const timeLabel = elapsed < 1 ? "just now" : `${elapsed}m ago`;
  const [payMethod, setPayMethod] = useState<string>("cash");
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    try { await onMarkPaid(payMethod); }
    finally { setPaying(false); }
  };

  return (
    <div
      className="bill-flash relative flex flex-col gap-1.5 rounded-xl px-3 py-2.5 min-w-[200px] max-w-[260px]"
      style={{
        border: "1px solid rgba(251,191,36,0.4)",
        borderRadius: "0.75rem",
      }}
    >
      {/* Top row: bell + info + dismiss */}
      <div className="flex items-start gap-2.5">
        <span className="text-base leading-none mt-0.5 shrink-0">🔔</span>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-black leading-tight" style={{ color: "#fbbf24" }}>
            Table {req.table_number}
          </p>
          {total > 0 && (
            <p className="text-[10px] tabular-nums mt-0.5" style={{ color: "var(--t-dim)" }}>
              ₹{Math.round(total)}
            </p>
          )}
          {memberStr && (
            <p
              className="text-[10px] mt-0.5 truncate"
              style={{ color: "var(--t-dim)", opacity: 0.8 }}
              title={memberStr}
            >
              {memberStr}
            </p>
          )}
          <p className="text-[9px] mt-1 font-medium" style={{ color: "rgba(251,191,36,0.55)" }}>
            {timeLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black transition-colors mt-0.5"
          style={{ background: "rgba(251,191,36,0.15)", color: "rgba(251,191,36,0.7)" }}
          title="Dismiss"
        >
          ×
        </button>
      </div>

      {/* Payment row */}
      <div className="flex items-center gap-1.5">
        <select
          value={payMethod}
          onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
          className="flex-1 text-[10px] rounded-md px-1.5 py-1 outline-none"
          style={{ background: "rgba(0,0,0,0.3)", color: "var(--t-dim)", border: "1px solid rgba(251,191,36,0.25)" }}
        >
          <option value="cash">Cash</option>
          <option value="card_on_delivery">Card</option>
          <option value="upi">UPI</option>
          {customMethods.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handlePay}
          disabled={paying}
          className="text-[10px] font-bold rounded-md px-2 py-1 shrink-0 transition-opacity"
          style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.35)", opacity: paying ? 0.5 : 1 }}
        >
          {paying ? "…" : "Mark Paid"}
        </button>
      </div>
    </div>
  );
}

/* ─── Bill request queue ─────────────────────────────────────────────────────── */
interface BillRequestQueueProps {
  requests: BillRequest[];
  orders: Order[];
  onDismiss: (id: string) => void;
  onMarkPaid: (req: BillRequest, paymentMethod: string) => Promise<void>;
  customMethods: string[];
}

function BillRequestQueue({ requests, orders, onDismiss, onMarkPaid, customMethods }: BillRequestQueueProps) {
  if (requests.length === 0) return null;

  return (
    <div
      className="rounded-xl px-3 py-2.5 space-y-2"
      style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.18)" }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full shrink-0 animate-pulse"
          style={{ background: "#fbbf24" }}
        />
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#fbbf24" }}>
          Bill Requested · {requests.length}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {requests.map((req) => {
          const total = orders
            .filter((o) => {
              const sid = typeof o.session === "object" && o.session !== null
                ? o.session._id
                : (o.session as string | undefined);
              return sid === req.session_id;
            })
            .reduce((sum, o) => sum + (o.total_amount || 0), 0);
          return (
            <BillRequestCard
              key={req.id}
              req={req}
              total={total}
              onDismiss={() => onDismiss(req.id)}
              onMarkPaid={(pm) => onMarkPaid(req, pm)}
              customMethods={customMethods}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ─── Skeleton ─────────────────────────────────────────────────────────────────── */
const COLUMN_DEFS: Array<{ color: string; label: string; cards: Array<{ items: number }> }> = [
  { color: "#f59e0b", label: "Allocated",   cards: [{ items: 2 }, { items: 1 }] },
  { color: "#a855f7", label: "In Progress", cards: [{ items: 3 }, { items: 2 }] },
  { color: "#22c55e", label: "Completed",   cards: [{ items: 1 }] },
];

interface OrderCardSkeletonProps { color: string; itemCount: number }

function OrderCardSkeleton({ color, itemCount }: OrderCardSkeletonProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--t-surface)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="h-0.5 w-full" style={{ background: color }} />
      <div className="px-2.5 py-1.5 flex items-center justify-between gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2">
          <div className="shimmer h-3 w-16 rounded" />
          <div className="shimmer h-2.5 w-10 rounded" />
        </div>
        <div className="shimmer h-4 w-10 rounded" />
      </div>
      <div className="px-2.5 py-2 space-y-1.5">
        <div className="flex items-center gap-1.5 justify-between">
          <div className="shimmer h-2.5 w-14 rounded" />
          <div className="shimmer h-4 w-14 rounded-full" />
        </div>
        {Array.from({ length: itemCount }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5 py-0.5">
            <div className="shimmer w-4 h-4 rounded shrink-0" />
            <div className="shimmer h-2.5 w-8 rounded" />
            <div className="shimmer h-2.5 flex-1 rounded" />
          </div>
        ))}
        <div className="flex items-center justify-between pt-1">
          <div className="shimmer h-3 w-10 rounded" />
          <div className="shimmer h-6 w-24 rounded-lg" />
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

/* ─── Bill request persistence ───────────────────────────────────────────────── */
const BILL_REQUESTS_KEY = "bill_requests_queue";
const BILL_REQUEST_TTL = 4 * 60 * 60 * 1000; // 4 h — matches session expiry

function loadBillRequests(): BillRequest[] {
  try {
    const raw = localStorage.getItem(BILL_REQUESTS_KEY);
    if (!raw) return [];
    const parsed: BillRequest[] = JSON.parse(raw);
    const now = Date.now();
    return parsed.filter((r) => now - r.requestedAt < BILL_REQUEST_TTL);
  } catch {
    return [];
  }
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */
export default function OrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [selectedTable, setSelectedTable] = useState<number | string | null>(null);
  const [billRequests, setBillRequests] = useState<BillRequest[]>(loadBillRequests);
  const [petpoojaEnabled, setPetpoojaEnabled] = useState(false);
  const [customPaymentMethods, setCustomPaymentMethods] = useState<string[]>([]);
  const prevIdsRef = useRef<Set<string>>(new Set());

  // Persist bill requests across refreshes
  useEffect(() => {
    localStorage.setItem(BILL_REQUESTS_KEY, JSON.stringify(billRequests));
  }, [billRequests]);

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

  // Polling
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Check Petpooja config once on mount — determines whether 3rd Party column is shown
  useEffect(() => {
    getPetpoojaConfig()
      .then((cfg) => setPetpoojaEnabled(!!cfg.enabled))
      .catch(() => { /* no-op — non-Petpooja restaurants just hide the column */ });
    getPaymentMethods()
      .then(setCustomPaymentMethods)
      .catch(() => { /* non-critical */ });
  }, []);

  // Socket listeners: bill requests + new orders (including Petpooja external)
  useEffect(() => {
    const token = authStore.getState().adminAccessToken;
    if (!token) return;
    const socket = connectAdminSocket(token);

    const billHandler = (raw: unknown) => {
      const payload = raw as { table_number: number; session_id: string; members?: string[] };
      setBillRequests((prev) => [
        ...prev,
        {
          id: `bill-${Date.now()}-${Math.random()}`,
          table_number: payload.table_number,
          session_id: payload.session_id,
          members: payload.members ?? [],
          requestedAt: Date.now(),
        },
      ]);
    };

    const newOrderHandler = () => { fetchOrders(true); };
    const orderUpdatedHandler = () => { fetchOrders(true); };

    socket.on("bill:requested", billHandler);
    socket.on("new_order", newOrderHandler);
    socket.on("order:updated", orderUpdatedHandler);
    return () => {
      socket.off("bill:requested", billHandler);
      socket.off("new_order", newOrderHandler);
      socket.off("order:updated", orderUpdatedHandler);
    };
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

  const dismissBillRequest = (id: string) =>
    setBillRequests((prev) => prev.filter((r) => r.id !== id));

  const handleMarkPaid = useCallback(async (req: BillRequest, paymentMethod: string) => {
    await markBillPaid(req.session_id, paymentMethod);
    dismissBillRequest(req.id);
    await fetchOrders(true);
    toast({ status: "success", title: `Table ${req.table_number} marked as paid` });
  }, [fetchOrders, toast]);

  const handleCollectPayment = useCallback(async (orderId: string, paymentMethod: string) => {
    await collectOrderPayment(orderId, paymentMethod);
    await fetchOrders(true);
    toast({ status: "success", title: "Payment collected" });
  }, [fetchOrders, toast]);

  const allPaymentMethods = [
    "cash", "card_on_delivery", "upi",
    ...customPaymentMethods.filter((m) => !["cash", "card_on_delivery", "upi"].includes(m)),
  ];

  /* ── Derived data ── */
  const tableNumbers = [
    ...new Set(orders.map((o) => o.table?.table_number ?? o.table_number).filter((n) => n != null)),
  ].sort((a, b) => Number(a) - Number(b));

  const visibleOrders =
    selectedTable != null
      ? orders.filter((o) => (o.table?.table_number ?? o.table_number) == selectedTable)
      : orders;

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
        source: o.source,
      };
    }
    sessionMap[key].orders.push(o);
    const t = new Date(o.createdAt);
    if (t > sessionMap[key].latestAt) sessionMap[key].latestAt = t;
  });

  Object.values(sessionMap).forEach((s) => {
    s.orders.sort((a, b) => {
      if (!a.is_addon && b.is_addon) return -1;
      if (a.is_addon && !b.is_addon) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  });

  const sessions = Object.values(sessionMap).sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime());

  const columnSessions: Record<string, SessionGroup[]> = {
    allocated:   sessions.filter((s) => getSessionColumn(s.orders) === "allocated"),
    inprogress:  sessions.filter((s) => getSessionColumn(s.orders) === "inprogress"),
    completed:   sessions.filter((s) => getSessionColumn(s.orders) === "completed"),
    thirdparty:  sessions.filter((s) => getSessionColumn(s.orders) === "thirdparty"),
  };

  const isSessionNew = (session: SessionGroup) => session.orders.some((o) => newIds.has(o._id));
  const activeCount = orders.filter((o) => !TERMINAL.includes(o.status)).length;
  const showTableFilter = orders.length > 0 && tableNumbers.length > 0;
  const activeColumns = petpoojaEnabled ? ORDERS_PAGE_COLUMNS : DASHBOARD_COLUMNS;
  const useTableSelect = tableNumbers.length > 8;

  if (initialLoading) return <OrdersPageSkeleton />;

  return (
    <>
      {/* Flash animation keyframes */}
      <style>{`
        @keyframes billFlash {
          0%, 100% { background: rgba(251,191,36,0.06); box-shadow: 0 0 0 1px rgba(251,191,36,0.25); }
          50%       { background: rgba(251,191,36,0.20); box-shadow: 0 0 10px rgba(251,191,36,0.4); }
        }
        .bill-flash { animation: billFlash 1.2s ease-in-out infinite; }
      `}</style>

      <div className="flex flex-col gap-3 min-h-0">
        {/* Bill request queue — always at top */}
        <BillRequestQueue
          requests={billRequests}
          orders={orders}
          onDismiss={dismissBillRequest}
          onMarkPaid={handleMarkPaid}
          customMethods={customPaymentMethods}
        />

        {/* Table filter + controls */}
        {orders.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 gap-y-2">
            {showTableFilter && useTableSelect && (
              <label className="flex items-center gap-2 text-[11px] shrink-0" style={{ color: "var(--t-dim)" }}>
                <span className="sr-only">Table</span>
                <Select
                  value={selectedTable == null ? "" : String(selectedTable)}
                  onChange={(v) => setSelectedTable(v === "" ? null : v)}
                  size="small"
                  style={{ minWidth: "8.5rem" }}
                  className="text-xs font-semibold"
                >
                  <Select.Option value="">All tables</Select.Option>
                  {tableNumbers.map((num) => (
                    <Select.Option key={String(num)} value={String(num)}>
                      Table {num}
                    </Select.Option>
                  ))}
                </Select>
              </label>
            )}

            {showTableFilter && !useTableSelect && (
              <div className="flex gap-1.5 flex-wrap items-center min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setSelectedTable(null)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all duration-150"
                  style={
                    selectedTable === null
                      ? { background: "var(--t-accent)", borderColor: "transparent", color: "#fff" }
                      : { background: "var(--t-float)", borderColor: "var(--t-line)", color: "var(--t-dim)" }
                  }
                >
                  All
                </button>
                {tableNumbers.map((num) => (
                  <button
                    type="button"
                    key={String(num)}
                    onClick={() => setSelectedTable(selectedTable == num ? null : num)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all duration-150"
                    style={
                      selectedTable == num
                        ? { background: "var(--t-accent)", borderColor: "transparent", color: "#fff" }
                        : { background: "var(--t-float)", borderColor: "var(--t-line)", color: "var(--t-dim)" }
                    }
                  >
                    T{num}
                  </button>
                ))}
              </div>
            )}

            {activeCount > 0 && (
              <span
                className="shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: "var(--t-accent)", color: "#fff" }}
              >
                {activeCount} active
              </span>
            )}

            <span className="text-[10px] shrink-0" style={{ color: "var(--t-dim)" }}>
              Auto 10s
              {lastRefresh && (
                <span style={{ color: "var(--t-dim)", opacity: 0.6 }}>
                  {" "}·{" "}
                  {lastRefresh.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              )}
            </span>

            <Button type="text" size="small" onClick={() => fetchOrders()} className="ml-auto shrink-0">
              ↻ Refresh
            </Button>
          </div>
        )}

        {/* Empty state */}
        {orders.length === 0 && (
          <div
            className="rounded-xl flex flex-col items-center justify-center py-12 text-center gap-2"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
          >
            <span className="text-4xl">🍽️</span>
            <p className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>No orders yet</p>
            <p className="text-xs" style={{ color: "var(--t-dim)" }}>Waiting for customers to place orders…</p>
            <Button type="text" size="small" onClick={() => fetchOrders()} className="mt-2">
              ↻ Refresh
            </Button>
          </div>
        )}

        {/* Kanban columns */}
        {orders.length > 0 && (
          <div className="flex flex-col flex-1 min-h-0 md:h-[calc(100dvh-10rem)] md:min-h-[260px]">
            <div className={`grid grid-cols-1 gap-3 md:h-full md:min-h-0 md:grid-rows-1 ${petpoojaEnabled ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
              {activeColumns.map(({ key, label, color }: { key: string; label: string; color: string }) => {
                const cols = columnSessions[key] ?? [];
                return (
                  <div key={key} className="flex flex-col min-h-0 md:h-full md:min-h-0">
                    <div
                      className="flex items-center justify-between px-0.5 pb-1.5 mb-1 border-b shrink-0"
                      style={{ borderColor: `${color}28` }}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        <h2
                          className="text-[11px] font-bold uppercase tracking-wide truncate"
                          style={{ color }}
                        >
                          {label}
                        </h2>
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>
                        {cols.length}
                      </span>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5 min-h-[72px] max-h-[min(40vh,calc(100dvh-12rem))] md:max-h-none">
                      {cols.length === 0 ? (
                        <div
                          className="rounded-xl h-14 flex items-center justify-center"
                          style={{ border: `1px dashed ${color}20` }}
                        >
                          <span className="text-[10px]" style={{ color: "var(--t-dim)" }}>No orders</span>
                        </div>
                      ) : (
                        cols.map((session) => (
                          <TableOrderCard
                            key={session.sessionId}
                            session={session}
                            column={key}
                            onStatusChange={handleStatusChange}
                            updating={updating}
                            isNew={isSessionNew(session)}
                            onCollectPayment={handleCollectPayment}
                            allPaymentMethods={allPaymentMethods}
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
    </>
  );
}
