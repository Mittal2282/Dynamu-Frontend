import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import * as XLSX from 'xlsx';
import { getCompletedOrders } from '../../../../services/dashboardService';
import { todayStr, fmtDate, fmtTime } from './helpers';

export default function ExportModal({ onClose }) {
  const thirtyDaysAgo = (() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  })();

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo,   setDateTo]   = useState(todayStr());
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      const orders = await getCompletedOrders({ dateFrom, dateTo });
      const exportRows = orders.map((o) => ({
        'Order #':        o.order_number ?? '',
        'Date':           fmtDate(o.createdAt),
        'Time':           fmtTime(o.createdAt),
        'Customer':       o.customer_name ?? '—',
        'Table':          o.table?.table_number ? `#${o.table.table_number}` : '—',
        'Items':          (o.items ?? []).map((i) =>
                            `${i.name}${i.variant_name ? ` (${i.variant_name})` : ''} ×${i.quantity}`
                          ).join('; '),
        'Subtotal':       o.subtotal        ?? 0,
        'Tax':            o.tax_amount      ?? 0,
        'Service Charge': o.service_charge  ?? 0,
        'Total':          o.total_amount    ?? 0,
        'Status':         o.status          ?? '',
        'Payment':        o.payment_status  ?? '',
        'Source':         o.source          ?? 'platform',
        'Notes':          o.notes           ?? '',
      }));

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Orders');
      XLSX.writeFile(wb, `orders_${dateFrom}_${dateTo}.xlsx`);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message ?? err.message ?? 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-sm flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--t-bg)', border: '1px solid var(--t-line)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--t-line)' }}>
          <p className="font-bold text-white">Export Orders</p>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--t-dim)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t-dim)'; }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t-dim)' }}>From</label>
              <input type="date" value={dateFrom} max={dateTo} onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)', colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t-dim)' }}>To</label>
              <input type="date" value={dateTo} min={dateFrom} max={todayStr()} onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)', colorScheme: 'dark' }} />
            </div>
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>
          )}

          <button type="button" onClick={handleExport} disabled={exporting}
            className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all"
            style={{ background: 'var(--t-accent)', opacity: exporting ? 0.7 : 1 }}>
            {exporting ? 'Exporting…' : 'Download Excel'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
