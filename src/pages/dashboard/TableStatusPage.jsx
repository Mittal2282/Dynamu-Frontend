import { useState, useEffect, useCallback, useRef } from 'react';
import { getDashTables, freeTable } from '../../services/adminService';
import { connectAdminSocket, disconnectAdminSocket } from '../../services/socketService';
import { authStore } from '../../store/authStore';

// ─── Status config ─────────────────────────────────────────────────────────────

const ORDER_STATUS = {
  pending:   { label: 'Pending',   color: '#f59e0b' },
  confirmed: { label: 'Confirmed', color: '#38bdf8' },
  preparing: { label: 'Preparing', color: '#fb923c' },
  ready:     { label: 'Ready',     color: '#a3e635' },
  served:    { label: 'Served',    color: '#34d399' },
  completed: { label: 'Done',      color: '#6b7280' },
  cancelled: { label: 'Cancelled', color: '#f87171' },
};

const STATUS_CONFIG = {
  free: {
    label: 'Free',
    bg:    'color-mix(in srgb, var(--t-success) 6%, transparent)',
    text:  'var(--t-success)',
    dot:   'var(--t-success)',
    bar:   'var(--t-success)',
    glow:  'none',
    pillBg: 'color-mix(in srgb, var(--t-success) 18%, transparent)',
  },
  occupied: {
    label: 'Active',
    bg:    'color-mix(in srgb, var(--t-accent) 6%, transparent)',
    text:  'var(--t-accent)',
    dot:   'var(--t-accent)',
    bar:   'var(--t-accent)',
    glow:  '0 8px 28px -6px color-mix(in srgb, var(--t-accent) 22%, transparent)',
    pillBg: 'color-mix(in srgb, var(--t-accent) 18%, transparent)',
  },
  billing: {
    label: 'Billing',
    bg:    'color-mix(in srgb, var(--t-accent2) 6%, transparent)',
    text:  'var(--t-accent2)',
    dot:   'var(--t-accent2)',
    bar:   'var(--t-accent2)',
    glow:  '0 8px 28px -6px color-mix(in srgb, var(--t-accent2) 22%, transparent)',
    pillBg: 'color-mix(in srgb, var(--t-accent2) 18%, transparent)',
  },
};


function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)   return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
}

// ─── Table card ────────────────────────────────────────────────────────────────

function TableIcon({ color }) {
  return (
    <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '88px', height: '88px' }}>
      {/* Chairs */}
      <rect x="33" y="5"  width="22" height="11" rx="4" fill={color} opacity="0.18"/>
      <rect x="33" y="72" width="22" height="11" rx="4" fill={color} opacity="0.18"/>
      <rect x="5"  y="33" width="11" height="22" rx="4" fill={color} opacity="0.18"/>
      <rect x="72" y="33" width="11" height="22" rx="4" fill={color} opacity="0.18"/>
      {/* Chair connectors (legs) */}
      <rect x="42" y="16" width="4"  height="6" rx="1.5" fill={color} opacity="0.1"/>
      <rect x="42" y="66" width="4"  height="6" rx="1.5" fill={color} opacity="0.1"/>
      <rect x="16" y="42" width="6"  height="4" rx="1.5" fill={color} opacity="0.1"/>
      <rect x="66" y="42" width="6"  height="4" rx="1.5" fill={color} opacity="0.1"/>
      {/* Table surface */}
      <circle cx="44" cy="44" r="22" fill={color} opacity="0.08" stroke={color} strokeOpacity="0.25" strokeWidth="1.5"/>
      {/* Place settings */}
      <circle cx="44" cy="29" r="4.5" fill="none" stroke={color} strokeOpacity="0.35" strokeWidth="1.2"/>
      <circle cx="44" cy="59" r="4.5" fill="none" stroke={color} strokeOpacity="0.35" strokeWidth="1.2"/>
      <circle cx="29" cy="44" r="4.5" fill="none" stroke={color} strokeOpacity="0.35" strokeWidth="1.2"/>
      <circle cx="59" cy="44" r="4.5" fill="none" stroke={color} strokeOpacity="0.35" strokeWidth="1.2"/>
      {/* Center dot */}
      <circle cx="44" cy="44" r="2.5" fill={color} opacity="0.25"/>
    </svg>
  );
}

function TableCard({ table, onFree }) {
  const cfg        = STATUS_CONFIG[table.display_status] ?? STATUS_CONFIG.free;
  const isOccupied = table.display_status !== 'free';

  const [confirming, setConfirming] = useState(false);
  const [freeing, setFreeing]       = useState(false);
  const confirmTimer                = useRef(null);

  const startConfirm = (e) => {
    e.stopPropagation();
    setConfirming(true);
    confirmTimer.current = setTimeout(() => setConfirming(false), 4000);
  };
  const cancelConfirm = (e) => {
    e.stopPropagation();
    clearTimeout(confirmTimer.current);
    setConfirming(false);
  };
  const handleFree = async (e) => {
    e.stopPropagation();
    clearTimeout(confirmTimer.current);
    setFreeing(true);
    try { await onFree(table._id); }
    finally { setFreeing(false); setConfirming(false); }
  };

  const sess    = table.session;
  const members = sess?.members ?? [];
  const orders  = sess?.orders  ?? [];

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border transition-shadow duration-200"
      style={{
        minHeight:       isOccupied ? undefined : '210px',
        backgroundColor: cfg.bg,
        borderColor:     'rgba(255,255,255,0.07)',
        boxShadow:       cfg.glow,
      }}
    >
      {/* ── Top accent bar ───────────────────────────── */}
      <div
        className="shrink-0"
        style={{ height: '3px', backgroundColor: cfg.bar, opacity: isOccupied ? 1 : 0.5 }}
      />

      {/* ── Content ──────────────────────────────────── */}
      <div className={`flex flex-col px-4 pt-3 pb-4 gap-3 ${isOccupied ? '' : 'flex-1'}`}>

        {/* Row 1: table number + status pill */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold leading-none" style={{ color: 'var(--t-text)' }}>
            T{table.table_number}
          </span>
          <span
            className="text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded-full leading-none"
            style={{ color: cfg.text, backgroundColor: cfg.pillBg }}
          >
            {cfg.label}
          </span>
        </div>

        {/* Free state: centered table illustration */}
        {!isOccupied && (
          <div className="flex-1 flex items-center justify-center py-2">
            <TableIcon color={cfg.dot} />
          </div>
        )}

        {/* Row 2: members + elapsed time (occupied only) */}
        {isOccupied && members.length > 0 && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] leading-snug truncate min-w-0" style={{ color: 'var(--t-text)' }}>
              {members.join(', ')}
            </p>
            <span className="text-[10px] shrink-0" style={{ color: 'var(--t-dim)' }}>
              {timeAgo(sess.started_at)}
            </span>
          </div>
        )}

        {/* Row 3: orders (occupied only) */}
        {isOccupied && (
          <div
            className="flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {orders.length === 0 ? (
              table.display_status === 'billing' ? (
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
                  style={{ color: 'var(--t-dim)', opacity: 0.4 }}
                >
                  No orders yet
                </p>
              )
            ) : (
              <>
                {/* Column headers */}
                <div
                  className="grid px-3 py-1.5"
                  style={{
                    gridTemplateColumns: '20px 1fr auto auto',
                    gap: '0 10px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <span />
                  <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: 'var(--t-dim)', opacity: 0.45 }}>Status</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--t-dim)', opacity: 0.45 }}>Items</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--t-dim)', opacity: 0.45 }}>Total</span>
                </div>

                {/* Order rows */}
                <div className="flex flex-col overflow-y-auto" style={{ maxHeight: '120px' }}>
                  {orders.map((o, i) => {
                    const osCfg = ORDER_STATUS[o.status] ?? { label: o.status, color: '#6b7280' };
                    return (
                      <div
                        key={o.index}
                        className="grid items-center px-3 py-2.5"
                        style={{
                          gridTemplateColumns: '20px 1fr auto auto',
                          gap: '0 10px',
                          borderBottom: i < orders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        }}
                      >
                        {/* Order number */}
                        <span
                          className="text-[10px] font-bold tabular-nums leading-none"
                          style={{ color: 'var(--t-dim)', opacity: 0.5 }}
                        >
                          {String(o.index).padStart(2, '0')}
                        </span>

                        {/* Status badge */}
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md leading-none w-fit"
                          style={{
                            color: osCfg.color,
                            backgroundColor: `${osCfg.color}20`,
                          }}
                        >
                          {osCfg.label}
                        </span>

                        {/* Item count */}
                        <span
                          className="text-[10px] tabular-nums text-right"
                          style={{ color: 'var(--t-dim)' }}
                        >
                          {o.items_count}
                        </span>

                        {/* Price */}
                        <span
                          className="text-[11px] font-semibold tabular-nums text-right"
                          style={{ color: 'var(--t-text)' }}
                        >
                          ₹{o.total_amount.toFixed(0)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Total footer — only when 2+ orders */}
                {orders.length > 1 && (
                  <div
                    className="flex items-center justify-between px-3 py-2"
                    style={{
                      borderTop: '1px solid rgba(255,255,255,0.07)',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest"
                      style={{ color: 'var(--t-dim)', opacity: 0.45 }}
                    >
                      Session Total
                    </span>
                    <span className="text-[13px] font-bold tabular-nums" style={{ color: cfg.text }}>
                      ₹{orders.reduce((s, o) => s + o.total_amount, 0).toFixed(0)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Row 4: action */}
        <div style={{ height: '30px' }} className="shrink-0">
          {isOccupied && (
            !confirming ? (
              <button
                type="button"
                onClick={startConfirm}
                className="w-full h-full rounded-lg text-[11px] font-medium transition-colors hover:bg-white/10"
                style={{
                  color:           'var(--t-dim)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border:          '1px solid rgba(255,255,255,0.08)',
                }}
              >
                Free Table
              </button>
            ) : (
              <div className="flex gap-1.5 h-full">
                <button
                  type="button"
                  onClick={cancelConfirm}
                  disabled={freeing}
                  className="flex-1 rounded-lg text-[11px] font-medium transition-colors"
                  style={{
                    color:           'var(--t-dim)',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border:          '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={handleFree}
                  disabled={freeing}
                  className="flex-1 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: 'rgba(239,68,68,0.8)', color: '#fff', border: 'none' }}
                >
                  {freeing
                    ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'Yes, Free'
                  }
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl border overflow-hidden animate-pulse"
      style={{ minHeight: '210px', borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'var(--t-surface)' }}
    >
      <div style={{ height: '3px', backgroundColor: 'var(--t-line)' }} />
      <div className="px-4 pt-3 pb-4 flex flex-col gap-3 h-full">
        <div className="flex items-center justify-between">
          <div className="h-5 w-8 rounded" style={{ backgroundColor: 'var(--t-line)' }} />
          <div className="h-4 w-12 rounded-full" style={{ backgroundColor: 'var(--t-line)' }} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full" style={{ backgroundColor: 'var(--t-line)' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TableStatusPage() {
  const [tables, setTables]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fetchTables = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getDashTables();
      setTables(data);
      setError('');
    } catch {
      setError('Could not load tables. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time socket updates
  useEffect(() => {
    const token = authStore.getState().adminAccessToken;
    if (!token) return;
    const socket = connectAdminSocket(token);
    socket.on('table:updated', () => fetchTables(true));
    return () => {
      socket.off('table:updated');
      disconnectAdminSocket();
    };
  }, [fetchTables]);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const handleFree = async (tableId) => {
    await freeTable(tableId);
    fetchTables(true);
  };

  const totalTables = tables.length;
  const counts = {
    free:     tables.filter(t => t.display_status === 'free').length,
    occupied: tables.filter(t => t.display_status === 'occupied').length,
    billing:  tables.filter(t => t.display_status === 'billing').length,
  };
  const totalOccupied = counts.occupied + counts.billing;

  // Summary rows: Free | Active | Billing
  const STATS = [
    { key: 'free',     label: 'Free',    count: counts.free,     cfg: STATUS_CONFIG.free },
    { key: 'occupied', label: 'Active',  count: counts.occupied, cfg: STATUS_CONFIG.occupied },
    { key: 'billing',  label: 'Billing', count: counts.billing,  cfg: STATUS_CONFIG.billing },
  ];

  const floorSubline = loading
    ? 'Loading…'
    : `${totalTables} table${totalTables !== 1 ? 's' : ''}${
        totalOccupied > 0
          ? ` · ${totalOccupied} occupied${counts.billing > 0 ? ` (${counts.billing} billing)` : ''}`
          : ''
      }`;

  return (
    <div className="space-y-5">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              background: 'linear-gradient(90deg, var(--t-text) 30%, var(--t-dim))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Table Status
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--t-dim)' }}>
            Live floor map
          </p>
        </div>
        <button
          onClick={() => fetchTables()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-white/5 border border-white/10 hover:bg-white/8 transition-all disabled:opacity-40"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => fetchTables()} className="text-xs font-semibold text-red-400 hover:text-red-300 underline">
            Retry
          </button>
        </div>
      )}

      {/* ── Summary stat strip ───────────────────────────────────────────────── */}
      <div
        className="border rounded-2xl px-5 py-3 flex items-center divide-x"
        style={{
          backgroundColor: 'var(--t-surface)',
          borderColor:     'var(--t-line)',
          '--tw-divide-opacity': 1,
        }}
      >
        {STATS.map(({ key, label, count, cfg }) => {
          const pct = totalTables > 0 ? Math.round((count / totalTables) * 100) : 0;
          return (
            <div key={key} className="flex-1 flex items-center justify-between px-4 first:pl-0 last:pr-0">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}` }}
                />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--t-dim)' }}>
                  {label}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--t-text)' }}>
                  {loading ? '—' : count}
                </span>
                <span className="text-[10px] font-medium" style={{ color: cfg.text }}>
                  {loading ? '' : `${pct}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Floor map ────────────────────────────────────────────────────────── */}
      <div
        className="border rounded-2xl p-5"
        style={{ backgroundColor: 'var(--t-surface)', borderColor: 'var(--t-line)' }}
      >
        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>
              Floor Overview
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--t-dim)' }}>
              {floorSubline}
            </p>
          </div>
          {/* Compact legend */}
          <div className="hidden sm:flex items-center gap-3">
            {STATS.map(({ key, label, cfg }) => (
              <div key={key} className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: cfg.dot }}
                />
                <span className="text-[10px] font-medium" style={{ color: 'var(--t-dim)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading && tables.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : tables.length === 0 ? (
          <p className="text-center text-sm py-10" style={{ color: 'var(--t-dim)' }}>
            No tables found. Create tables from the superadmin panel.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {tables.map((table) => (
              <TableCard key={table._id} table={table} onFree={handleFree} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
