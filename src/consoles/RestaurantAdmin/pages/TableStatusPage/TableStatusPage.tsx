import { useCallback, useEffect, useRef, useState } from "react";
import {
  addTablesToFloor,
  freeTable,
  getDashTables,
  toggleTableActive,
} from "../../../../services/dashboardService";
import { connectAdminSocket, disconnectAdminSocket } from "../../../../services/socketService";
import { authStore } from "../../../../store/authStore";
import { ENDPOINTS } from "../../../../utils/endpoints";

// ─── Status config ─────────────────────────────────────────────────────────────

interface OrderStatusConfig {
  label: string;
  color: string;
}

const ORDER_STATUS: Record<string, OrderStatusConfig> = {
  pending: { label: "Pending", color: "#f59e0b" },
  confirmed: { label: "Confirmed", color: "#38bdf8" },
  preparing: { label: "Preparing", color: "#fb923c" },
  ready: { label: "Ready", color: "#a3e635" },
  served: { label: "Served", color: "#34d399" },
  completed: { label: "Done", color: "#6b7280" },
  cancelled: { label: "Cancelled", color: "#f87171" },
};

interface DisplayStatusConfig {
  label: string;
  bg: string;
  text: string;
  dot: string;
  bar: string;
  glow: string;
  pillBg: string;
}

const STATUS_CONFIG: Record<string, DisplayStatusConfig> = {
  free: {
    label: "Free",
    bg: "color-mix(in srgb, var(--t-success) 6%, transparent)",
    text: "var(--t-success)",
    dot: "var(--t-success)",
    bar: "var(--t-success)",
    glow: "none",
    pillBg: "color-mix(in srgb, var(--t-success) 18%, transparent)",
  },
  occupied: {
    label: "Active",
    bg: "color-mix(in srgb, var(--t-accent) 6%, transparent)",
    text: "var(--t-accent)",
    dot: "var(--t-accent)",
    bar: "var(--t-accent)",
    glow: "0 8px 28px -6px color-mix(in srgb, var(--t-accent) 22%, transparent)",
    pillBg: "color-mix(in srgb, var(--t-accent) 18%, transparent)",
  },
  billing: {
    label: "Billing",
    bg: "color-mix(in srgb, var(--t-accent2) 6%, transparent)",
    text: "var(--t-accent2)",
    dot: "var(--t-accent2)",
    bar: "var(--t-accent2)",
    glow: "0 8px 28px -6px color-mix(in srgb, var(--t-accent2) 22%, transparent)",
    pillBg: "color-mix(in srgb, var(--t-accent2) 18%, transparent)",
  },
  unserviceable: {
    label: "Offline",
    bg: "color-mix(in srgb, var(--t-dim) 4%, transparent)",
    text: "var(--t-dim)",
    dot: "var(--t-dim)",
    bar: "var(--t-dim)",
    glow: "none",
    pillBg: "color-mix(in srgb, var(--t-dim) 12%, transparent)",
  },
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "—";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
}

// ─── Table card ────────────────────────────────────────────────────────────────

interface TableIconProps {
  color: string;
}

function TableIcon({ color }: TableIconProps) {
  return (
    <svg
      viewBox="0 0 88 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "88px", height: "88px" }}
    >
      <rect x="33" y="5" width="22" height="11" rx="4" fill={color} opacity="0.18" />
      <rect x="33" y="72" width="22" height="11" rx="4" fill={color} opacity="0.18" />
      <rect x="5" y="33" width="11" height="22" rx="4" fill={color} opacity="0.18" />
      <rect x="72" y="33" width="11" height="22" rx="4" fill={color} opacity="0.18" />
      <rect x="42" y="16" width="4" height="6" rx="1.5" fill={color} opacity="0.1" />
      <rect x="42" y="66" width="4" height="6" rx="1.5" fill={color} opacity="0.1" />
      <rect x="16" y="42" width="6" height="4" rx="1.5" fill={color} opacity="0.1" />
      <rect x="66" y="42" width="6" height="4" rx="1.5" fill={color} opacity="0.1" />
      <circle
        cx="44"
        cy="44"
        r="22"
        fill={color}
        opacity="0.08"
        stroke={color}
        strokeOpacity="0.25"
        strokeWidth="1.5"
      />
      <circle
        cx="44"
        cy="29"
        r="4.5"
        fill="none"
        stroke={color}
        strokeOpacity="0.35"
        strokeWidth="1.2"
      />
      <circle
        cx="44"
        cy="59"
        r="4.5"
        fill="none"
        stroke={color}
        strokeOpacity="0.35"
        strokeWidth="1.2"
      />
      <circle
        cx="29"
        cy="44"
        r="4.5"
        fill="none"
        stroke={color}
        strokeOpacity="0.35"
        strokeWidth="1.2"
      />
      <circle
        cx="59"
        cy="44"
        r="4.5"
        fill="none"
        stroke={color}
        strokeOpacity="0.35"
        strokeWidth="1.2"
      />
      <circle cx="44" cy="44" r="2.5" fill={color} opacity="0.25" />
    </svg>
  );
}

interface SessionOrder {
  index: number;
  status: string;
  items_count: number;
  total_amount: number;
}

interface TableSession {
  members?: string[];
  orders?: SessionOrder[];
  started_at?: string;
}

interface TableData {
  _id: string;
  table_number: number;
  display_status: string;
  floor?: number;
  floor_name?: string;
  session?: TableSession;
}

interface TableCardProps {
  table: TableData;
  onFree: (id: string) => Promise<void>;
  onToggleActive: (id: string) => Promise<void>;
}

function TableCard({ table, onFree, onToggleActive }: TableCardProps) {
  const cfg = STATUS_CONFIG[table.display_status] ?? STATUS_CONFIG.free;
  const isUnserviceable = table.display_status === "unserviceable";
  const isOccupied = !isUnserviceable && table.display_status !== "free";
  const isBilling = table.display_status === "billing";

  const [confirming, setConfirming] = useState(false);
  const [freeing, setFreeing] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [tooltipAlign, setTooltipAlign] = useState<"left" | "right">("right");
  const [billDlLoading, setBillDlLoading] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  const downloadBill = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setBillDlLoading(true);
    try {
      const token = authStore.getState().adminAccessToken;
      const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${base}${ENDPOINTS.DASH_TABLE_BILL_PDF(table._id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a") as HTMLAnchorElement;
      a.href = url;
      a.download = `bill-table-${table.table_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail — user can retry
    } finally {
      setBillDlLoading(false);
    }
  };

  const startConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirming(true);
    confirmTimer.current = setTimeout(() => setConfirming(false), 4000);
  };
  const cancelConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setConfirming(false);
  };
  const handleFree = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setFreeing(true);
    try {
      await onFree(table._id);
    } finally {
      setFreeing(false);
      setConfirming(false);
    }
  };

  const handleToggleActive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingActive(true);
    try {
      await onToggleActive(table._id);
    } finally {
      setTogglingActive(false);
    }
  };

  const sess = table.session;
  const members = sess?.members ?? [];
  const orders = sess?.orders ?? [];

  return (
    <div
      className="flex flex-col rounded-2xl border transition-all duration-200"
      style={{
        minHeight: isOccupied && !isUnserviceable ? undefined : "210px",
        backgroundColor: cfg.bg,
        borderColor: "var(--t-line)",
        boxShadow: cfg.glow,
        opacity: isUnserviceable ? 0.65 : 1,
      }}
    >
      <div
        className="shrink-0 rounded-t-2xl"
        style={{ height: "3px", backgroundColor: cfg.bar, opacity: isOccupied ? 1 : 0.5 }}
      />

      <div
        className={`flex flex-col px-4 pt-3 pb-4 gap-3 ${isOccupied && !isUnserviceable ? "" : "flex-1"}`}
      >
        <div className="flex items-center justify-between">
          <span
            className="text-xl font-bold leading-none"
            style={{ color: isUnserviceable ? "var(--t-dim)" : "var(--t-text)" }}
          >
            T{table.table_number}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className="badge badge-xs font-bold tracking-widest uppercase p-2"
              style={{ color: cfg.text, backgroundColor: cfg.pillBg, borderColor: "transparent" }}
            >
              {cfg.label}
            </span>
            <div className="relative" ref={infoRef}>
              <button
                type="button"
                onClick={() => {
                  if (infoRef.current) {
                    const rect = infoRef.current.getBoundingClientRect();
                    setTooltipAlign(rect.left < 450 ? "left" : "right");
                  }
                  setInfoOpen((v) => !v);
                }}
                className="w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 text-[10px] font-bold leading-none"
                style={{
                  background: "var(--t-float)",
                  border: "1px solid var(--t-line)",
                  color: "var(--t-dim)",
                }}
              >
                i
              </button>

              {infoOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setInfoOpen(false)} />

                  <div
                    className={`absolute top-7 z-50 w-56 rounded-xl p-3 space-y-2.5 shadow-2xl ${tooltipAlign === "left" ? "left-0" : "right-0"}`}
                    style={{
                      background: "var(--t-surface)",
                      border: "1px solid var(--t-line)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    }}
                  >
                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--t-dim)" }}>
                      This table is currently{" "}
                      <span
                        className="font-semibold"
                        style={{ color: isUnserviceable ? "#f87171" : "#4ade80" }}
                      >
                        {isUnserviceable ? "unserviceable" : "active"}
                      </span>
                      .{" "}
                      {isUnserviceable
                        ? "Customers cannot scan or place orders. Mark it serviceable to bring it back online."
                        : "Do you want to mark it as unserviceable? Customers will not be able to use this table."}
                    </p>
                    <button
                      type="button"
                      onClick={async (e) => {
                        setInfoOpen(false);
                        await handleToggleActive(e);
                      }}
                      disabled={togglingActive}
                      className={`btn btn-sm w-full text-[11px] disabled:opacity-50 ${isUnserviceable ? "btn-success" : "btn-error"}`}
                    >
                      {togglingActive
                        ? "Updating…"
                        : isUnserviceable
                          ? "Mark as Serviceable"
                          : "Mark as Unserviceable"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {(!isOccupied || isUnserviceable) && (
          <div className="flex-1 flex items-center justify-center py-2">
            <TableIcon color={cfg.dot} />
          </div>
        )}

        {isOccupied && members.length > 0 && (
          <div className="flex items-center justify-between gap-2">
            <p
              className="text-[11px] leading-snug truncate min-w-0"
              style={{ color: "var(--t-text)" }}
            >
              {members.join(", ")}
            </p>
            <span className="text-[10px] shrink-0" style={{ color: "var(--t-dim)" }}>
              {timeAgo(sess?.started_at)}
            </span>
          </div>
        )}

        {isOccupied && (
          <div
            className="flex flex-col rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--t-line)" }}
          >
            {orders.length === 0 ? (
              table.display_status === "billing" ? (
                <div className="flex items-center justify-center gap-2 py-3 px-3">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
                    style={{ backgroundColor: cfg.dot }}
                  />
                  <p className="text-[11px] font-medium" style={{ color: cfg.text }}>
                    Awaiting payment
                  </p>
                </div>
              ) : (
                <p
                  className="text-[10px] text-center py-3"
                  style={{ color: "var(--t-dim)", opacity: 0.4 }}
                >
                  No orders yet
                </p>
              )
            ) : (
              <>
                <div
                  className="grid px-3 py-1.5"
                  style={{
                    gridTemplateColumns: "20px 1fr auto auto",
                    gap: "0 10px",
                    borderBottom: "1px solid var(--t-line)",
                    backgroundColor: "var(--t-float)",
                  }}
                >
                  <span />
                  <span
                    className="text-[8px] font-bold uppercase tracking-widest"
                    style={{ color: "var(--t-dim)", opacity: 0.45 }}
                  >
                    Status
                  </span>
                  <span
                    className="text-[8px] font-bold uppercase tracking-widest text-right"
                    style={{ color: "var(--t-dim)", opacity: 0.45 }}
                  >
                    Items
                  </span>
                  <span
                    className="text-[8px] font-bold uppercase tracking-widest text-right"
                    style={{ color: "var(--t-dim)", opacity: 0.45 }}
                  >
                    Total
                  </span>
                </div>

                <div className="flex flex-col overflow-y-auto" style={{ maxHeight: "120px" }}>
                  {orders.map((o, i) => {
                    const osCfg = ORDER_STATUS[o.status] ?? { label: o.status, color: "#6b7280" };
                    return (
                      <div
                        key={o.index}
                        className="grid items-center px-3 py-2.5"
                        style={{
                          gridTemplateColumns: "20px 1fr auto auto",
                          gap: "0 10px",
                          borderBottom: i < orders.length - 1 ? "1px solid var(--t-line)" : "none",
                        }}
                      >
                        <span
                          className="text-[10px] font-bold tabular-nums leading-none"
                          style={{ color: "var(--t-dim)", opacity: 0.5 }}
                        >
                          {String(o.index).padStart(2, "0")}
                        </span>

                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md leading-none w-fit"
                          style={{
                            color: osCfg.color,
                            backgroundColor: `${osCfg.color}20`,
                          }}
                        >
                          {osCfg.label}
                        </span>

                        <span
                          className="text-[10px] tabular-nums text-right"
                          style={{ color: "var(--t-dim)" }}
                        >
                          {o.items_count}
                        </span>

                        <span
                          className="text-[11px] font-semibold tabular-nums text-right"
                          style={{ color: "var(--t-text)" }}
                        >
                          ₹{o.total_amount.toFixed(0)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {orders.length > 1 && (
                  <div
                    className="flex items-center justify-between px-3 py-2"
                    style={{
                      borderTop: "1px solid var(--t-line)",
                      backgroundColor: "var(--t-float)",
                    }}
                  >
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest"
                      style={{ color: "var(--t-dim)", opacity: 0.45 }}
                    >
                      Session Total
                    </span>
                    <span
                      className="text-[13px] font-bold tabular-nums"
                      style={{ color: cfg.text }}
                    >
                      ₹{orders.reduce((s, o) => s + o.total_amount, 0).toFixed(0)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {isOccupied && !isUnserviceable && (
          <div className="flex flex-col gap-1.5 shrink-0">
            {isBilling && (sess?.orders ?? []).length > 0 && (
              <button
                type="button"
                onClick={downloadBill}
                disabled={billDlLoading}
                className="btn btn-sm w-full gap-1.5 disabled:opacity-50"
                style={{
                  backgroundColor: "rgba(249,115,22,0.15)",
                  color: "#f97316",
                  border: "1px solid rgba(249,115,22,0.3)",
                }}
              >
                {billDlLoading ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download Bill
                  </>
                )}
              </button>
            )}

            <div style={{ height: "30px" }}>
              {!confirming ? (
                <button
                  type="button"
                  onClick={startConfirm}
                  className="btn btn-sm btn-ghost w-full h-full text-[10px]"
                  style={{ border: "1px solid var(--t-line)" }}
                >
                  Free Table
                </button>
              ) : (
                <div className="flex gap-1.5 h-full">
                  <button
                    type="button"
                    onClick={cancelConfirm}
                    disabled={freeing}
                    className="btn btn-sm btn-ghost flex-1 text-[10px]"
                    style={{ border: "1px solid var(--t-line)" }}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={handleFree}
                    disabled={freeing}
                    className="btn btn-sm btn-error flex-1 text-[10px] disabled:opacity-50"
                  >
                    {freeing ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      "Yes"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl border overflow-hidden animate-pulse"
      style={{
        minHeight: "210px",
        borderColor: "rgba(255,255,255,0.07)",
        backgroundColor: "var(--t-surface)",
      }}
    >
      <div style={{ height: "3px", backgroundColor: "var(--t-line)" }} />
      <div className="px-4 pt-3 pb-4 flex flex-col gap-3 h-full">
        <div className="flex items-center justify-between">
          <div className="h-5 w-8 rounded" style={{ backgroundColor: "var(--t-line)" }} />
          <div className="h-4 w-12 rounded-full" style={{ backgroundColor: "var(--t-line)" }} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full" style={{ backgroundColor: "var(--t-line)" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Add Tables Modal ──────────────────────────────────────────────────────────

interface FloorGroup {
  floor: number;
  floor_name: string;
  tables: TableData[];
}

interface AddTablesModalProps {
  existingFloors: FloorGroup[];
  onClose: () => void;
  onSuccess: () => void;
}

interface AddTablesForm {
  floor_number: string;
  floor_name: string;
  table_count: string;
  is_new_floor: boolean;
}

function AddTablesModal({ existingFloors, onClose, onSuccess }: AddTablesModalProps) {
  const [form, setForm] = useState<AddTablesForm>({
    floor_number: "",
    floor_name: "",
    table_count: "5",
    is_new_floor: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = <K extends keyof AddTablesForm>(name: K, value: AddTablesForm[K]) =>
    setForm((p) => ({ ...p, [name]: value }));

  const nextStartNumber =
    existingFloors.reduce((max, fg) => {
      const floorMax = fg.tables.reduce((m, t) => Math.max(m, t.table_number ?? 0), 0);
      return Math.max(max, floorMax);
    }, 0) + 1;

  const handleSubmit = async () => {
    const count = parseInt(form.table_count);
    if (!count || count < 1) {
      setError("Table count must be at least 1");
      return;
    }

    let floorNum = parseInt(form.floor_number);
    if (!form.is_new_floor) {
      if (!floorNum) {
        setError("Select a floor");
        return;
      }
    } else {
      if (!floorNum) {
        floorNum =
          existingFloors.length > 0 ? Math.max(...existingFloors.map((f) => f.floor)) + 1 : 1;
      }
    }

    setError("");
    setSaving(true);
    try {
      await addTablesToFloor({
        floor_number: floorNum,
        floor_name: form.floor_name.trim(),
        table_count: count,
        start_number: nextStartNumber,
      });
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to add tables.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = "input input-bordered input-sm w-full";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--t-line)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--t-accent-20)", border: "1px solid var(--t-accent-40)" }}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="var(--t-accent)"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-sm font-bold" style={{ color: "var(--t-text)" }}>
              Add Tables
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-base leading-none"
            style={{ color: "var(--t-dim)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--t-float)";
              e.currentTarget.style.color = "var(--t-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--t-dim)";
            }}
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div role="alert" className="alert alert-error text-xs py-2">
              {error}
            </div>
          )}

          {existingFloors.length > 0 && (
            <div role="tablist" className="tabs tabs-boxed">
              {[
                { v: true, label: "New Floor" },
                { v: false, label: "Existing Floor" },
              ].map(({ v, label }) => (
                <button
                  key={String(v)}
                  role="tab"
                  onClick={() => handleChange("is_new_floor", v)}
                  className={`tab text-xs font-semibold flex-1 ${form.is_new_floor === v ? "tab-active" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {!form.is_new_floor && existingFloors.length > 0 && (
            <div className="space-y-1.5">
              <label
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--t-dim)" }}
              >
                Floor
              </label>
              <select
                value={form.floor_number}
                onChange={(e) => handleChange("floor_number", e.target.value)}
                className="select select-bordered select-sm w-full cursor-pointer"
              >
                <option value="">Select floor…</option>
                {existingFloors.map((f) => (
                  <option key={f.floor} value={f.floor}>
                    {f.floor_name ? `Floor ${f.floor} — ${f.floor_name}` : `Floor ${f.floor}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.is_new_floor && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--t-dim)" }}
                >
                  Floor #
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.floor_number}
                  onChange={(e) => handleChange("floor_number", e.target.value)}
                  placeholder="Auto"
                  className={inputStyle}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--t-dim)" }}
                >
                  Floor Name
                </label>
                <input
                  type="text"
                  value={form.floor_name}
                  onChange={(e) => handleChange("floor_name", e.target.value)}
                  placeholder="e.g. Rooftop"
                  className={inputStyle}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--t-dim)" }}
            >
              Tables to Add *
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={form.table_count}
              onChange={(e) => handleChange("table_count", e.target.value)}
              className={inputStyle}
            />
            <p className="text-[10px]" style={{ color: "var(--t-dim)" }}>
              Will be numbered T{nextStartNumber} → T
              {nextStartNumber + Math.max(0, (parseInt(form.table_count) || 1) - 1)}
            </p>
          </div>
        </div>

        {/* Modal footer */}
        <div
          className="flex gap-2 px-6 py-4"
          style={{ borderTop: "1px solid var(--t-line)", background: "var(--t-float)" }}
        >
          <button onClick={onClose} className="btn btn-sm btn-ghost flex-1 text-xs font-semibold">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-sm btn-primary flex-1 text-xs font-semibold disabled:opacity-60"
          >
            {saving ? <span className="loading loading-spinner loading-xs" /> : "Add Tables"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat row item ─────────────────────────────────────────────────────────────

interface StatItem {
  key: string;
  label: string;
  count: number;
  cfg: DisplayStatusConfig;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

interface BillToast {
  id: string;
  table_number: number;
  members: string[];
}

export default function TableStatusPage() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFloor, setActiveFloor] = useState<number | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [billToasts, setBillToasts] = useState<BillToast[]>([]);

  const fetchTables = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getDashTables();
      setTables(data as TableData[]);
      setError("");
    } catch {
      setError("Could not load tables. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = authStore.getState().adminAccessToken;
    if (!token) return;
    const socket = connectAdminSocket(token);

    socket.on("table:updated", () => fetchTables(true));

    socket.on("bill:requested", (payload: { table_number: number; members?: string[] }) => {
      const id = `bill-${Date.now()}-${Math.random()}`;
      setBillToasts((prev) => [
        ...prev,
        {
          id,
          table_number: payload.table_number,
          members: payload.members ?? [],
        },
      ]);
      setTimeout(() => {
        setBillToasts((prev) => prev.filter((t) => t.id !== id));
      }, 12000);
    });

    return () => {
      socket.off("table:updated");
      socket.off("bill:requested");
      disconnectAdminSocket();
    };
  }, [fetchTables]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleFree = async (tableId: string) => {
    await freeTable(tableId);
    fetchTables(true);
  };

  const handleToggleActive = async (tableId: string) => {
    await toggleTableActive(tableId);
    fetchTables(true);
  };

  const downloadQRPDF = async () => {
    setPdfLoading(true);
    try {
      const token = authStore.getState().adminAccessToken;
      const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${base}${ENDPOINTS.DASH_TABLES_QR_PDF}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a") as HTMLAnchorElement;
      a.href = url;
      a.download = "qr-codes.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail — user can retry
    } finally {
      setPdfLoading(false);
    }
  };

  const totalTables = tables.length;
  const counts = {
    free: tables.filter((t) => t.display_status === "free").length,
    occupied: tables.filter((t) => t.display_status === "occupied").length,
    billing: tables.filter((t) => t.display_status === "billing").length,
    unserviceable: tables.filter((t) => t.display_status === "unserviceable").length,
  };
  const totalOccupied = counts.occupied + counts.billing;

  const STATS: StatItem[] = [
    { key: "free", label: "Free", count: counts.free, cfg: STATUS_CONFIG.free },
    { key: "occupied", label: "Active", count: counts.occupied, cfg: STATUS_CONFIG.occupied },
    { key: "billing", label: "Billing", count: counts.billing, cfg: STATUS_CONFIG.billing },
    {
      key: "unserviceable",
      label: "Offline",
      count: counts.unserviceable,
      cfg: STATUS_CONFIG.unserviceable,
    },
  ];

  const floorGroups: Record<number, FloorGroup> = {};
  for (const t of tables) {
    const key = t.floor ?? 1;
    if (!floorGroups[key]) {
      floorGroups[key] = { floor: key, floor_name: t.floor_name || "", tables: [] };
    }
    floorGroups[key].tables.push(t);
  }
  const floorKeys = Object.keys(floorGroups)
    .map(Number)
    .sort((a, b) => a - b);
  const isMultiFloor = floorKeys.length > 1;

  const currentFloor = activeFloor ?? floorKeys[0] ?? 1;
  const STATUS_SORT_ORDER: Record<string, number> = {
    billing: 0,
    occupied: 1,
    free: 2,
    unserviceable: 3,
  };
  const visibleTables = [
    ...(isMultiFloor ? (floorGroups[currentFloor]?.tables ?? []) : tables),
  ].sort(
    (a, b) =>
      (STATUS_SORT_ORDER[a.display_status] ?? 2) - (STATUS_SORT_ORDER[b.display_status] ?? 2),
  );

  const floorSubline = loading
    ? "Loading…"
    : `${totalTables} table${totalTables !== 1 ? "s" : ""}${
        totalOccupied > 0
          ? ` · ${totalOccupied} occupied${counts.billing > 0 ? ` (${counts.billing} billing)` : ""}`
          : ""
      }`;

  return (
    <div className="space-y-5">
      {billToasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2" style={{ maxWidth: "300px" }}>
          {billToasts.map((toast) => (
            <div
              key={toast.id}
              className="flex items-start gap-3 rounded-2xl px-4 py-3 shadow-2xl"
              style={{
                background: "var(--t-surface)",
                border: "1px solid rgba(249,115,22,0.35)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}
            >
              <div
                className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(249,115,22,0.15)" }}
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth={2.2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-5.003A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[12px] font-semibold leading-snug"
                  style={{ color: "var(--t-text)" }}
                >
                  Table {toast.table_number} — Bill Requested
                </p>
                {toast.members.length > 0 && (
                  <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--t-dim)" }}>
                    {toast.members.join(", ")}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setBillToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ color: "var(--t-dim)" }}
              >
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold"
            style={
              {
                background: "linear-gradient(90deg, var(--t-text) 30%, var(--t-dim))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              } as React.CSSProperties
            }
          >
            Table Status
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--t-dim)" }}>
            Live floor map
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAddModalOpen(true)}
            className="btn btn-sm btn-primary gap-1.5 text-xs font-semibold shadow-sm"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Tables
          </button>

          <button
            onClick={downloadQRPDF}
            disabled={pdfLoading || tables.length === 0}
            className="btn btn-sm btn-ghost gap-1.5 text-xs font-semibold disabled:opacity-50"
            style={{ border: "1px solid var(--t-line)" }}
          >
            {pdfLoading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            )}
            QR Codes PDF
          </button>

          <button
            onClick={() => fetchTables()}
            disabled={loading}
            className="btn btn-sm btn-ghost gap-1.5 text-xs font-semibold disabled:opacity-50"
            style={{ border: "1px solid var(--t-line)" }}
          >
            {loading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="alert alert-error">
          <p className="text-sm flex-1">{error}</p>
          <button onClick={() => fetchTables()} className="btn btn-sm btn-ghost">
            Retry
          </button>
        </div>
      )}

      <div
        className="border rounded-2xl px-5 py-3 flex items-center divide-x"
        style={
          {
            backgroundColor: "var(--t-surface)",
            borderColor: "var(--t-line)",
            "--tw-divide-opacity": 1,
          } as React.CSSProperties
        }
      >
        {STATS.map(({ key, label, count, cfg }) => {
          const pct = totalTables > 0 ? Math.round((count / totalTables) * 100) : 0;
          return (
            <div
              key={key}
              className="flex-1 flex items-center justify-between px-4 first:pl-0 last:pr-0"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}` }}
                />
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: "var(--t-dim)" }}
                >
                  {label}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold tabular-nums" style={{ color: "var(--t-text)" }}>
                  {loading ? "—" : count}
                </span>
                <span className="text-[10px] font-medium" style={{ color: cfg.text }}>
                  {loading ? "" : `${pct}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="border rounded-2xl p-5"
        style={{ backgroundColor: "var(--t-surface)", borderColor: "var(--t-line)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>
              {isMultiFloor ? "Floor Plan" : "Floor Overview"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--t-dim)" }}>
              {floorSubline}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            {STATS.map(({ key, label, cfg }) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                <span className="text-[10px] font-medium" style={{ color: "var(--t-dim)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isMultiFloor && !loading && (
          <div className="flex items-center gap-1.5 mb-5 flex-wrap">
            {floorKeys.map((fKey) => {
              const g = floorGroups[fKey];
              const isActive = fKey === currentFloor;
              const occupied = g.tables.filter((t) => t.display_status !== "free").length;
              return (
                <button
                  key={fKey}
                  onClick={() => setActiveFloor(fKey)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150"
                  style={
                    isActive
                      ? {
                          background:
                            "linear-gradient(90deg, rgba(var(--t-accent-rgb,249,115,22),0.18), rgba(var(--t-accent-rgb,249,115,22),0.07))",
                          color: "var(--t-accent)",
                          border: "1px solid rgba(249,115,22,0.22)",
                        }
                      : {
                          background: "rgba(255,255,255,0.04)",
                          color: "var(--t-dim)",
                          border: "1px solid rgba(255,255,255,0.07)",
                        }
                  }
                >
                  <span>{g.floor_name || `Floor ${g.floor}`}</span>
                  <span
                    className="px-1.5 py-0.5 rounded-md text-[9px] font-bold"
                    style={{
                      background: occupied > 0 ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.06)",
                      color: occupied > 0 ? "var(--t-accent)" : "var(--t-dim)",
                    }}
                  >
                    {g.tables.length}
                  </span>
                  {occupied > 0 && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: "var(--t-accent)",
                        boxShadow: "0 0 4px var(--t-accent)",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {loading && tables.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : tables.length === 0 ? (
          <p className="text-center text-sm py-10" style={{ color: "var(--t-dim)" }}>
            No tables found. Create tables from the superadmin panel.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {visibleTables.map((table) => (
              <TableCard
                key={table._id}
                table={table}
                onFree={handleFree}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}
      </div>

      {addModalOpen && (
        <AddTablesModal
          existingFloors={Object.values(floorGroups)}
          onClose={() => setAddModalOpen(false)}
          onSuccess={() => {
            setAddModalOpen(false);
            fetchTables(true);
          }}
        />
      )}
    </div>
  );
}
