// ── Mock table data ──────────────────────────────────────────────────────────
const MOCK_TABLES = [
  { id: "t1", number: 1, seats: 2, status: "free" },
  { id: "t2", number: 2, seats: 4, status: "occupied" },
  { id: "t3", number: 3, seats: 4, status: "ordered" },
  { id: "t4", number: 4, seats: 6, status: "free" },
  { id: "t5", number: 5, seats: 2, status: "billing" },
  { id: "t6", number: 6, seats: 4, status: "free" },
  { id: "t7", number: 7, seats: 6, status: "occupied" },
  { id: "t8", number: 8, seats: 4, status: "ordered" },
  { id: "t9", number: 9, seats: 2, status: "free" },
  { id: "t10", number: 10, seats: 4, status: "billing" },
];

const TABLE_STATUS_CONFIG = {
  free: {
    label: "Free",
    border: "color-mix(in srgb, var(--t-success) 60%, transparent)",
    bg: "color-mix(in srgb, var(--t-success) 5%, transparent)",
    text: "var(--t-success)",
    dot: "var(--t-success)",
    glow: "0 8px 32px -4px color-mix(in srgb, var(--t-success) 15%, transparent)",
  },
  occupied: {
    label: "Occupied",
    border: "color-mix(in srgb, var(--t-accent) 60%, transparent)",
    bg: "color-mix(in srgb, var(--t-accent) 5%, transparent)",
    text: "var(--t-accent)",
    dot: "var(--t-accent)",
    glow: "0 8px 32px -4px color-mix(in srgb, var(--t-accent) 15%, transparent)",
  },
  ordered: {
    label: "Ordered",
    border: "color-mix(in srgb, var(--t-accent3) 60%, transparent)",
    bg: "color-mix(in srgb, var(--t-accent3) 5%, transparent)",
    text: "var(--t-accent3)",
    dot: "var(--t-accent3)",
    glow: "0 8px 32px -4px color-mix(in srgb, var(--t-accent3) 15%, transparent)",
  },
  billing: {
    label: "Billing",
    border: "color-mix(in srgb, var(--t-accent2) 60%, transparent)",
    bg: "color-mix(in srgb, var(--t-accent2) 5%, transparent)",
    text: "var(--t-accent2)",
    dot: "var(--t-accent2)",
    glow: "0 8px 32px -4px color-mix(in srgb, var(--t-accent2) 15%, transparent)",
  },
};

function TableCard({ table }) {
  const cfg = TABLE_STATUS_CONFIG[table.status] ?? TABLE_STATUS_CONFIG.free;
  return (
    <div
      className="relative rounded-2xl border-2 p-4 flex flex-col items-center gap-1.5 transition-all duration-200 hover:scale-[1.02] shadow-lg"
      style={{
        borderColor: cfg.border,
        backgroundColor: cfg.bg,
        boxShadow: cfg.glow,
      }}
    >
      <span className="font-bold text-lg" style={{ color: "var(--t-text)" }}>
        T{table.number}
      </span>
      <span className="text-xs" style={{ color: "var(--t-dim)" }}>
        {table.seats} seats
      </span>
      <span
        className="text-[11px] font-bold tracking-widest uppercase mt-0.5"
        style={{ color: cfg.text }}
      >
        {cfg.label}
      </span>
    </div>
  );
}

export default function TableStatusPage() {
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              background: "linear-gradient(90deg, var(--t-text) 30%, var(--t-dim))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Table Status
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--t-dim)" }}>
            Live floor map
          </p>
        </div>
      </div>

      {/* ── Summary Stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(TABLE_STATUS_CONFIG).map(([key, cfg]) => {
          const count = MOCK_TABLES.filter((t) => t.status === key).length;
          return (
            <div
              key={key}
              className="border rounded-2xl p-4 flex items-center justify-between"
              style={{
                backgroundColor: "var(--t-surface)",
                borderColor: "var(--t-line)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 rounded-full" style={{ backgroundColor: cfg.dot }} />
                <div>
                  <p
                    className="text-[10px] uppercase tracking-[0.15em] font-bold"
                    style={{ color: "var(--t-dim)" }}
                  >
                    {cfg.label}
                  </p>
                  <p className="text-xl font-bold" style={{ color: "var(--t-text)" }}>
                    {count}
                  </p>
                </div>
              </div>
              <div className="text-xs font-bold" style={{ color: cfg.text }}>
                {Math.round((count / MOCK_TABLES.length) * 100)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Table Map ─────────────────────────────────────────────────── */}
      <div
        className="border rounded-2xl p-6"
        style={{
          backgroundColor: "var(--t-surface)",
          borderColor: "var(--t-line)",
        }}
      >
        <div
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b"
          style={{ borderColor: "var(--t-line)" }}
        >
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>
              Floor Overview
            </p>
            <p className="text-xs" style={{ color: "var(--t-dim)" }}>
              Live updates from active sessions
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {Object.entries(TABLE_STATUS_CONFIG).map(([key, cfg]) => (
              <div
                key={key}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                style={{
                  backgroundColor: "var(--t-float)",
                  borderColor: "var(--t-line)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: cfg.dot,
                    boxShadow: `0 0 8px ${cfg.dot}`,
                  }}
                />
                <span
                  className="text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--t-dim)" }}
                >
                  {cfg.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {MOCK_TABLES.map((table) => (
            <TableCard key={table.id} table={table} />
          ))}
        </div>
      </div>
    </div>
  );
}
