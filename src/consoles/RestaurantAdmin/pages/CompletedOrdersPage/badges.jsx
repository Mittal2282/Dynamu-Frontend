export function SourceBadge({ source }) {
  if (!source || source === 'platform') return null;
  const cfg = source === 'bulk'
    ? { label: 'Bulk', bg: 'rgba(168,85,247,0.12)', color: '#a855f7', border: 'rgba(168,85,247,0.25)' }
    : { label: 'Manual', bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: 'rgba(59,130,246,0.25)' };
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const cfgMap = {
    completed: { label: 'Completed', bg: 'rgba(34,197,94,0.1)',  color: '#22c55e', border: 'rgba(34,197,94,0.2)'  },
    served:    { label: 'Served',    bg: 'rgba(34,197,94,0.07)', color: '#4ade80', border: 'rgba(34,197,94,0.15)' },
    cancelled: { label: 'Cancelled', bg: 'rgba(239,68,68,0.1)',  color: '#ef4444', border: 'rgba(239,68,68,0.2)'  },
  };
  const cfg = cfgMap[status] ?? cfgMap.completed;
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}
