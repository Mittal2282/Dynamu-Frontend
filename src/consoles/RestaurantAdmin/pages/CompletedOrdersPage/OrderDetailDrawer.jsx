import { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { fmtDate, fmtTime, fmtCurrency } from './helpers';
import { StatusBadge, SourceBadge } from './badges';

export default function OrderDetailDrawer({ order, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  if (!order) return null;

  const subtotal      = order.subtotal       ?? 0;
  const svc           = order.service_charge ?? 0;
  const total         = order.total_amount   ?? 0;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex" aria-modal="true">
      {/* Backdrop */}
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="w-full max-w-md flex flex-col overflow-hidden shadow-2xl animate-slide-in-right"
        style={{ background: 'var(--t-bg)', borderLeft: '1px solid var(--t-line)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--t-line)' }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--t-accent)' }}>
              Order #{order.order_number}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--t-dim)' }}>
              {fmtDate(order.createdAt)} · {fmtTime(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <SourceBadge source={order.source} />
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--t-dim)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t-dim)'; }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="px-5 py-3 shrink-0 flex flex-wrap gap-3" style={{ borderBottom: '1px solid var(--t-line)' }}>
          {order.customer_name && (
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--t-dim)' }}>Customer</p>
              <p className="text-sm font-medium text-white">{order.customer_name}</p>
            </div>
          )}
          {order.table?.table_number && (
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--t-dim)' }}>Table</p>
              <p className="text-sm font-medium text-white">#{order.table.table_number}</p>
            </div>
          )}
          {order.payment_status && (
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--t-dim)' }}>Payment</p>
              <p className="text-sm font-medium" style={{ color: order.payment_status === 'paid' ? '#22c55e' : 'var(--t-dim)' }}>
                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </p>
            </div>
          )}
          {order.notes && (
            <div className="w-full">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--t-dim)' }}>Notes</p>
              <p className="text-sm" style={{ color: 'var(--t-text)' }}>{order.notes}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2.5">
          {(order.items ?? []).map((item, i) => {
            const isVeg    = item.menu_item?.is_veg ?? item.is_veg;
            const imageUrl = item.menu_item?.image_url;
            const variantLabel = item.variant_name
              ? (item.variant_group ? `${item.variant_group} · ${item.variant_name}` : item.variant_name)
              : null;
            return (
              <div
                key={i}
                className="flex items-start gap-3 py-2.5 px-3 rounded-xl"
                style={{ background: 'var(--t-surface)', border: '1px solid var(--t-line)' }}
              >
                {/* Thumbnail */}
                <div className="relative shrink-0" style={{ width: 52, height: 52 }}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full rounded-xl items-center justify-center text-2xl"
                    style={{ background: 'var(--t-float)', display: imageUrl ? 'none' : 'flex' }}
                  >
                    {isVeg ? '🥗' : '🍗'}
                  </div>
                  <span
                    className="absolute bottom-0.5 left-0.5 w-2.5 h-2.5 rounded-full border-2"
                    style={{ background: isVeg ? '#22c55e' : '#ef4444', borderColor: 'var(--t-bg)' }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-snug">{item.name}</p>
                      {variantLabel && (
                        <p className="text-[11px]" style={{ color: 'var(--t-dim)' }}>{variantLabel}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: 'var(--t-text)' }}>
                        {fmtCurrency((item.unit_price ?? 0) * item.quantity)}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--t-dim)' }}>
                        {item.quantity} × {fmtCurrency(item.unit_price ?? 0)}
                      </p>
                    </div>
                  </div>
                  {item.special_instructions && (
                    <p
                      className="mt-1 text-[11px] px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
                    >
                      {item.special_instructions}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer totals */}
        <div
          className="px-5 py-4 shrink-0 flex flex-col gap-1.5"
          style={{ borderTop: '1px solid var(--t-line)', background: 'var(--t-surface)' }}
        >
          {[
            { label: 'Subtotal', value: subtotal },
            ...(svc   > 0 ? [{ label: 'Service Charge', value: svc }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm" style={{ color: 'var(--t-dim)' }}>
              <span>{label}</span>
              <span>{fmtCurrency(value)}</span>
            </div>
          ))}
          <div
            className="flex justify-between pt-2 mt-1 font-bold text-base text-white"
            style={{ borderTop: '1px solid var(--t-line)' }}
          >
            <span>Total</span>
            <span style={{ color: 'var(--t-accent)' }}>{fmtCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
