interface SourceBadgeProps {
  source?: string;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  if (!source || source === 'platform') return null;
  const cfgMap: Record<string, { label: string; bg: string; color: string; border: string }> = {
    bulk:    { label: 'Bulk',    bg: 'rgba(168,85,247,0.12)', color: '#a855f7', border: 'rgba(168,85,247,0.25)' },
    manual:  { label: 'Manual',  bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: 'rgba(59,130,246,0.25)' },
    zomato:  { label: 'Zomato',  bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', border: 'rgba(239,68,68,0.25)'  },
    swiggy:  { label: 'Swiggy',  bg: 'rgba(249,115,22,0.12)', color: '#f97316', border: 'rgba(249,115,22,0.25)' },
    pos:     { label: 'POS',     bg: 'rgba(99,102,241,0.12)', color: '#6366f1', border: 'rgba(99,102,241,0.25)' },
  };
  const cfg = cfgMap[source] ?? { label: source, bg: 'rgba(107,114,128,0.12)', color: '#6b7280', border: 'rgba(107,114,128,0.25)' };
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}

export function PaymentBadge({ status }: { status?: string }) {
  if (status === 'paid') {
    return (
      <span
        className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border"
        style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderColor: 'rgba(34,197,94,0.2)' }}
      >
        Paid
      </span>
    );
  }
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border"
      style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)' }}
    >
      Unpaid
    </span>
  );
}

interface StatusBadgeProps {
  status?: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfgMap: Record<string, { label: string; bg: string; color: string; border: string }> = {
    completed: { label: 'Completed', bg: 'rgba(34,197,94,0.1)',  color: '#22c55e', border: 'rgba(34,197,94,0.2)'  },
    served:    { label: 'Served',    bg: 'rgba(34,197,94,0.07)', color: '#4ade80', border: 'rgba(34,197,94,0.15)' },
    cancelled: { label: 'Cancelled', bg: 'rgba(239,68,68,0.1)',  color: '#ef4444', border: 'rgba(239,68,68,0.2)'  },
  };
  const cfg = cfgMap[status ?? ''] ?? cfgMap.completed;
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}
