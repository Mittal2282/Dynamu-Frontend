import { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import * as XLSX from 'xlsx';
import { createBulkOrders } from '../../../../services/dashboardService';
import { todayStr } from './helpers';

export default function BulkUploadModal({ onClose, onSaved }) {
  const [date, setDate] = useState(todayStr());
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [preview, setPreview] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const parseFile = useCallback(async (f) => {
    setFile(f);
    setError('');
    setResult(null);
    try {
      const ab = await f.arrayBuffer();
      const wb = XLSX.read(ab, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      setRows(parsed);
      setPreview(parsed.slice(0, 10));
    } catch {
      setError('Could not parse file. Use .xlsx, .xls, or .csv format.');
    }
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) parseFile(f);
  };

  const handleSave = async () => {
    if (!rows.length) return;
    setSaving(true);
    setError('');
    try {
      const res = await createBulkOrders(rows, date);
      setResult(res);
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message ?? err.message ?? 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const COLS = ['Item Name', 'Variant Name', 'Quantity', 'Special Instructions'];

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-xl flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--t-bg)', border: '1px solid var(--t-line)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--t-line)' }}>
          <p className="font-bold text-white">Bulk Upload Orders</p>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--t-dim)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t-dim)'; }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Date */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t-dim)' }}>Order Date (applied to all items) *</label>
            <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)}
              className="w-48 rounded-xl px-3 py-2 text-sm text-white outline-none"
              style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)', colorScheme: 'dark' }} />
          </div>

          {/* Drop zone */}
          {!result && (
            <div>
              <div
                className="relative flex flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center transition-colors cursor-pointer"
                style={{
                  border: `2px dashed ${dragging ? 'var(--t-accent)' : 'var(--t-line)'}`,
                  background: dragging ? 'var(--t-accent-10)' : 'var(--t-surface)',
                }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: dragging ? 'var(--t-accent)' : 'var(--t-dim)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div>
                  <p className="font-semibold text-white">{file ? file.name : 'Drop your file here'}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--t-dim)' }}>
                    {file ? `${rows.length} rows parsed` : 'or click to browse — .xlsx, .xls, .csv'}
                  </p>
                </div>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="sr-only"
                  onChange={(e) => { if (e.target.files[0]) parseFile(e.target.files[0]); }} />
              </div>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && !result && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--t-dim)' }}>
                Preview (first {preview.length} rows)
              </p>
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--t-line)' }}>
                <table className="w-full text-sm min-w-max">
                  <thead>
                    <tr style={{ background: 'var(--t-float)' }}>
                      {COLS.map((c) => (
                        <th key={c} className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-dim)' }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--t-line)' }}>
                        <td className="px-3 py-2 text-white">{r['Item Name'] ?? r.item_name ?? '—'}</td>
                        <td className="px-3 py-2" style={{ color: 'var(--t-dim)' }}>{r['Variant Name'] ?? r.variant_name ?? '—'}</td>
                        <td className="px-3 py-2" style={{ color: 'var(--t-dim)' }}>{r['Quantity'] ?? r.quantity ?? '1'}</td>
                        <td className="px-3 py-2 max-w-[160px] truncate" style={{ color: 'var(--t-dim)' }}>{r['Special Instructions'] ?? r.special_instructions ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <p className="font-semibold" style={{ color: '#22c55e' }}>Upload complete!</p>
              <p className="text-sm" style={{ color: 'var(--t-text)' }}>
                {result.created} item{result.created !== 1 ? 's' : ''} saved
                {result.failed?.length > 0 ? `, ${result.failed.length} skipped` : ''}.
              </p>
              {result.failed?.length > 0 && (
                <div className="mt-1 flex flex-col gap-1">
                  {result.failed.map((f, i) => (
                    <p key={i} className="text-[11px]" style={{ color: '#f59e0b' }}>
                      Row {f.row}: {f.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm px-3 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 shrink-0" style={{ borderTop: '1px solid var(--t-line)' }}>
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ color: 'var(--t-dim)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button type="button" onClick={handleSave} disabled={saving || !rows.length}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white"
              style={{
                background: rows.length ? 'var(--t-accent)' : 'var(--t-line)',
                opacity: saving ? 0.7 : 1,
                cursor: saving || !rows.length ? 'not-allowed' : 'pointer',
              }}>
              {saving ? 'Uploading…' : `Save ${rows.length} Row${rows.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
