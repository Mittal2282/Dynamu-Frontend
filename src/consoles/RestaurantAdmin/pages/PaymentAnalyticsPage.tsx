import { useEffect, useState, useCallback, useRef } from "react";
import {
  getOrdersByDateRange,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
} from "../../../services/dashboardService";
import type { Order } from "../../../types/order";
import { useToast } from "../../../components/ui/Toast";

/* ─── Date helpers ───────────────────────────────────────────────────────────── */

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextDayIso(iso: string): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function formatTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/* ─── Payment group config ───────────────────────────────────────────────────── */

const THIRD_PARTY_SOURCES = new Set(["zomato", "swiggy", "pos"]);

const CUSTOM_COLORS = [
  "#f59e0b", "#10b981", "#ec4899", "#6366f1",
  "#14b8a6", "#e11d48", "#7c3aed", "#0284c7",
];

interface PaymentGroup {
  key: string;
  label: string;
  type: "direct" | "platform";
  color: string;
  icon: string;
  isCustom?: boolean;
  match: (o: Order) => boolean;
}

const STANDARD_GROUPS: PaymentGroup[] = [
  {
    key: "cash", label: "Cash", type: "direct", color: "#22c55e", icon: "💵",
    match: (o) => o.payment_method === "cash" && !THIRD_PARTY_SOURCES.has(o.source ?? ""),
  },
  {
    key: "card", label: "Card", type: "direct", color: "#3b82f6", icon: "💳",
    match: (o) => o.payment_method === "card_on_delivery" && !THIRD_PARTY_SOURCES.has(o.source ?? ""),
  },
  {
    key: "upi", label: "UPI", type: "direct", color: "#8b5cf6", icon: "📲",
    match: (o) => o.payment_method === "upi",
  },
  {
    key: "online", label: "Online", type: "direct", color: "#06b6d4", icon: "🌐",
    match: (o) => o.payment_method === "razorpay",
  },
  {
    key: "zomato", label: "Zomato", type: "platform", color: "#ef4444", icon: "🍽️",
    match: (o) => o.source === "zomato",
  },
  {
    key: "swiggy", label: "Swiggy", type: "platform", color: "#f97316", icon: "🛵",
    match: (o) => o.source === "swiggy",
  },
  {
    key: "pos", label: "POS", type: "platform", color: "#94a3b8", icon: "🖥️",
    match: (o) => o.source === "pos",
  },
];

function buildGroups(customMethods: string[]): PaymentGroup[] {
  const custom: PaymentGroup[] = customMethods.map((name, i) => ({
    key: `custom:${name}`,
    label: name,
    type: "direct" as const,
    color: CUSTOM_COLORS[i % CUSTOM_COLORS.length],
    icon: "💰",
    isCustom: true,
    match: (o: Order) => o.payment_method === name,
  }));
  return [...STANDARD_GROUPS, ...custom];
}

/* ─── Grouped result ─────────────────────────────────────────────────────────── */

interface GroupResult extends PaymentGroup {
  orders: Order[];
  paidOrders: Order[];
  collected: number;
}

function groupOrders(orders: Order[], groups: PaymentGroup[]): GroupResult[] {
  return groups.map((g) => {
    const all  = orders.filter(g.match);
    const paid = all.filter((o) => o.payment_status === "paid");
    return {
      ...g,
      orders: all,
      paidOrders: paid,
      collected: paid.reduce((s, o) => s + (o.total_amount ?? 0), 0),
    };
  });
}

/* ─── Sub-components ─────────────────────────────────────────────────────────── */

function PaymentStatusBadge({ status }: { status?: string }) {
  if (status === "paid")
    return <span style={{ color: "#22c55e", background: "rgba(34,197,94,0.12)", padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 700 }}>Paid</span>;
  if (status === "refunded")
    return <span style={{ color: "#06b6d4", background: "rgba(6,182,212,0.12)", padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 700 }}>Refunded</span>;
  return <span style={{ color: "#f59e0b", background: "rgba(245,158,11,0.12)", padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 700 }}>Unpaid</span>;
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, sub, color, icon }: StatCardProps) {
  return (
    <div
      className="relative rounded-2xl p-5 flex flex-col gap-4 overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
    >
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07] blur-xl pointer-events-none" style={{ background: color }} />
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
          {icon}
        </div>
        {sub && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--t-float)", color: "var(--t-dim)" }}>{sub}</span>}
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight leading-none" style={{ color: "var(--t-text)" }}>{value}</p>
        <p className="text-[11px] font-medium mt-1.5" style={{ color: "var(--t-dim)" }}>{label}</p>
      </div>
    </div>
  );
}

interface PaymentGroupCardProps {
  group: GroupResult;
  maxCollected: number;
  isExpanded: boolean;
  onClick: () => void;
  onRemove?: () => void;
}

function PaymentGroupCard({ group, maxCollected, isExpanded, onClick, onRemove }: PaymentGroupCardProps) {
  const pct = maxCollected > 0 ? Math.round((group.collected / maxCollected) * 100) : 0;
  const hasData = group.orders.length > 0;

  return (
    <div className="relative group/card">
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none"
        style={{
          background: isExpanded ? `${group.color}0f` : "var(--t-surface)",
          border: `1px solid ${isExpanded ? group.color + "55" : "var(--t-line)"}`,
          opacity: hasData ? 1 : 0.55,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
              style={{ background: `${group.color}18`, border: `1px solid ${group.color}25` }}>
              {group.icon}
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ color: "var(--t-text)" }}>{group.label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--t-dim)" }}>
                {hasData ? `${group.paidOrders.length} paid · ${group.orders.length} total` : "No orders"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums" style={{ color: hasData ? group.color : "var(--t-dim)" }}>
              {hasData ? `₹${group.collected.toLocaleString("en-IN")}` : "₹0"}
            </p>
            <p className="text-[10px] font-medium" style={{ color: "var(--t-dim)" }}>
              {hasData ? `${pct}% of total` : "no data"}
            </p>
          </div>
        </div>

        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--t-float)" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${group.color}, ${group.color}bb)` }} />
        </div>

        {hasData && (
          <p className="text-[10px] font-medium text-right mt-2" style={{ color: `${group.color}99` }}>
            {isExpanded ? "Hide orders ▲" : "View orders ▼"}
          </p>
        )}
      </button>

      {/* Delete button for custom methods */}
      {group.isCustom && onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full items-center justify-center text-[10px] font-black hidden group-hover/card:flex transition-all"
          style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
          title="Remove payment method"
        >
          ×
        </button>
      )}
    </div>
  );
}

interface OrderDrillDownProps {
  group: GroupResult;
  singleDay: boolean;
}

function OrderDrillDown({ group, singleDay }: OrderDrillDownProps) {
  const sorted = [...group.orders].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${group.color}33` }}>
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ background: `${group.color}0a`, borderBottom: `1px solid ${group.color}25` }}>
        <div className="flex items-center gap-2">
          <span className="text-base">{group.icon}</span>
          <p className="text-sm font-bold" style={{ color: group.color }}>{group.label} — All Orders</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: `${group.color}18`, color: group.color }}>
            {group.orders.length} orders
          </span>
          <span className="text-[11px] font-bold tabular-nums" style={{ color: "var(--t-text)" }}>
            ₹{group.collected.toLocaleString("en-IN")} collected
          </span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="px-4 py-8 text-center" style={{ background: "var(--t-surface)", color: "var(--t-dim)" }}>
          <p className="text-sm">No orders for this period</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ background: "var(--t-surface)" }}>
            <thead>
              <tr style={{ background: "var(--t-float)" }}>
                <th className="px-3 py-2.5 text-left font-semibold" style={{ color: "var(--t-dim)" }}>Order #</th>
                {!singleDay && <th className="px-3 py-2.5 text-left font-semibold" style={{ color: "var(--t-dim)" }}>Date</th>}
                <th className="px-3 py-2.5 text-left font-semibold" style={{ color: "var(--t-dim)" }}>Time</th>
                <th className="px-3 py-2.5 text-left font-semibold" style={{ color: "var(--t-dim)" }}>Table</th>
                <th className="px-3 py-2.5 text-left font-semibold" style={{ color: "var(--t-dim)" }}>Items</th>
                <th className="px-3 py-2.5 text-right font-semibold" style={{ color: "var(--t-dim)" }}>Amount</th>
                <th className="px-3 py-2.5 text-center font-semibold" style={{ color: "var(--t-dim)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((order) => (
                <tr key={order._id} style={{ borderTop: "1px solid var(--t-line)", color: "var(--t-text)" }}>
                  <td className="px-3 py-2.5 font-mono font-semibold">#{order.order_number}</td>
                  {!singleDay && (
                    <td className="px-3 py-2.5 tabular-nums" style={{ color: "var(--t-dim)" }}>{formatDate(order.createdAt)}</td>
                  )}
                  <td className="px-3 py-2.5 tabular-nums" style={{ color: "var(--t-dim)" }}>{formatTime(order.createdAt)}</td>
                  <td className="px-3 py-2.5">
                    {typeof order.table === "object" && order.table?.table_number != null
                      ? `T${order.table.table_number}`
                      : order.table_number != null ? `T${order.table_number}` : "—"}
                  </td>
                  <td className="px-3 py-2.5 max-w-[200px] truncate" style={{ color: "var(--t-dim)" }}
                    title={order.items?.map((i) => i.name).join(", ")}>
                    {order.items?.length
                      ? order.items.map((i) => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ")
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                    ₹{(order.total_amount ?? 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <PaymentStatusBadge status={order.payment_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Add payment method inline form ─────────────────────────────────────────── */

interface AddMethodFormProps {
  onAdd: (name: string) => Promise<void>;
  onCancel: () => void;
}

function AddMethodForm({ onAdd, onCancel }: AddMethodFormProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try { await onAdd(trimmed); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit}
      className="rounded-2xl p-4 flex items-center gap-2"
      style={{ background: "var(--t-surface)", border: "1px dashed var(--t-accent)" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
        style={{ background: "var(--t-float)", border: "1px solid var(--t-line)" }}>
        💰
      </div>
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Payment method name (e.g. Paytm)"
        maxLength={30}
        className="flex-1 bg-transparent text-sm outline-none"
        style={{ color: "var(--t-text)" }}
      />
      <button type="submit" disabled={saving || !name.trim()}
        className="text-xs font-bold px-3 py-1.5 rounded-lg transition-opacity"
        style={{ background: "var(--t-accent)", color: "#fff", opacity: saving || !name.trim() ? 0.5 : 1 }}>
        {saving ? "…" : "Add"}
      </button>
      <button type="button" onClick={onCancel}
        className="text-xs font-bold px-2 py-1.5 rounded-lg"
        style={{ background: "var(--t-float)", color: "var(--t-dim)" }}>
        ✕
      </button>
    </form>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */

export default function PaymentAnalyticsPage() {
  const toast = useToast();
  const [dateFrom, setDateFrom]       = useState(todayIso);
  const [dateTo,   setDateTo]         = useState(todayIso);
  const [orders,   setOrders]         = useState<Order[]>([]);
  const [loading,  setLoading]        = useState(true);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [customMethods, setCustomMethods] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrdersByDateRange(dateFrom, nextDayIso(dateTo));
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    getPaymentMethods().then(setCustomMethods).catch(() => {});
  }, []);

  const allGroups   = buildGroups(customMethods);
  const results     = groupOrders(orders, allGroups);
  const directResults   = results.filter((g) => g.type === "direct");
  const platformResults = results.filter((g) => g.type === "platform");

  const maxCollected   = Math.max(...results.map((g) => g.collected), 0);
  const totalCollected = results.reduce((s, g) => s + g.collected, 0);
  const totalPaid      = results.reduce((s, g) => s + g.paidOrders.length, 0);
  const avgValue       = totalPaid > 0 ? Math.round(totalCollected / totalPaid) : 0;

  const singleDay      = dateFrom === dateTo;
  const expandedGroup  = results.find((g) => g.key === expandedKey) ?? null;

  function toggleExpand(key: string, hasData: boolean) {
    if (!hasData) return;
    setExpandedKey((prev) => (prev === key ? null : key));
  }

  async function handleAddMethod(name: string) {
    const updated = await addPaymentMethod(name);
    setCustomMethods(updated);
    setShowAddForm(false);
    toast({ status: "success", title: `"${name}" added` });
  }

  async function handleRemoveMethod(name: string) {
    const updated = await removePaymentMethod(name);
    setCustomMethods(updated);
    if (expandedKey === `custom:${name}`) setExpandedKey(null);
    toast({ status: "success", title: `"${name}" removed` });
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 min-h-full" style={{ background: "var(--t-bg)" }}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--t-text)" }}>Payment Analytics</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--t-dim)" }}>Collection breakdown by payment channel</p>
        </div>

        <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--t-dim)" }}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <input type="date" value={dateFrom} max={dateTo}
            onChange={(e) => { setDateFrom(e.target.value); setExpandedKey(null); }}
            className="bg-transparent outline-none text-xs tabular-nums cursor-pointer"
            style={{ color: "var(--t-text)" }} />
          <span style={{ color: "var(--t-dim)" }}>→</span>
          <input type="date" value={dateTo} min={dateFrom} max={todayIso()}
            onChange={(e) => { setDateTo(e.target.value); setExpandedKey(null); }}
            className="bg-transparent outline-none text-xs tabular-nums cursor-pointer"
            style={{ color: "var(--t-text)" }} />
        </div>
      </div>

      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Collected" value={`₹${totalCollected.toLocaleString("en-IN")}`}
          color="var(--t-accent)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="var(--t-accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg>} />
        <StatCard label="Paid Orders" value={String(totalPaid)} color="#22c55e"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>} />
        <StatCard label="Avg. Order Value" value={avgValue > 0 ? `₹${avgValue.toLocaleString("en-IN")}` : "—"} color="#a855f7"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg>} />
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--t-accent)", borderTopColor: "transparent" }} />
        </div>
      )}

      {/* ── Payment channel comparison ── */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Direct Payments */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-4 rounded-full" style={{ background: "var(--t-accent)" }} />
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--t-dim)" }}>Direct Payments</p>
              <div className="flex-1 h-px" style={{ background: "var(--t-line)" }} />
              <p className="text-[11px] font-bold tabular-nums" style={{ color: "var(--t-accent)" }}>
                ₹{directResults.reduce((s, g) => s + g.collected, 0).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {directResults.map((g) => (
                <PaymentGroupCard
                  key={g.key}
                  group={g}
                  maxCollected={maxCollected}
                  isExpanded={expandedKey === g.key}
                  onClick={() => toggleExpand(g.key, g.orders.length > 0)}
                  onRemove={g.isCustom ? () => handleRemoveMethod(g.label) : undefined}
                />
              ))}

              {/* Add payment method */}
              {showAddForm ? (
                <AddMethodForm onAdd={handleAddMethod} onCancel={() => setShowAddForm(false)} />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="w-full rounded-2xl p-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-150 hover:opacity-80"
                  style={{ background: "var(--t-surface)", border: "1px dashed var(--t-line)", color: "var(--t-dim)" }}
                >
                  <span style={{ fontSize: 14 }}>+</span> Add payment method
                </button>
              )}
            </div>
          </div>

          {/* 3rd Party Platforms */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-4 rounded-full" style={{ background: "#f97316" }} />
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--t-dim)" }}>3rd Party Platforms</p>
              <div className="flex-1 h-px" style={{ background: "var(--t-line)" }} />
              <p className="text-[11px] font-bold tabular-nums" style={{ color: "#f97316" }}>
                ₹{platformResults.reduce((s, g) => s + g.collected, 0).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {platformResults.map((g) => (
                <PaymentGroupCard
                  key={g.key}
                  group={g}
                  maxCollected={maxCollected}
                  isExpanded={expandedKey === g.key}
                  onClick={() => toggleExpand(g.key, g.orders.length > 0)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Order drill-down ── */}
      {expandedGroup && (
        <OrderDrillDown key={expandedGroup.key} group={expandedGroup} singleDay={singleDay} />
      )}
    </div>
  );
}
