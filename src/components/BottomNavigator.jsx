import { NavLink, useParams, useLocation } from 'react-router-dom';

/* ─── SVG Icons ─────────────────────────────────────────────────────────────── */
function IconHome({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" />
    </svg>
  );
}

function IconMenu({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
}

function IconAI({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconOrders({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

/**
 * @param {string}   basePath    — e.g. "/:qrCodeId/:tableNumber"
 * @param {boolean}  aiChatOpen
 * @param {function} onChatClick
 * @param {function} onNavigate
 */
export default function BottomNavigator({ basePath: basePathProp, aiChatOpen, onChatClick, onNavigate }) {
  const location = useLocation();
  const { qrCodeId, tableNumber } = useParams();
  const basePath =
    basePathProp ||
    (qrCodeId != null && tableNumber != null ? `/${qrCodeId}/${tableNumber}` : '/');

  const base = basePath.replace(/\/$/, '');

  const tabClass = ({ isActive }) => {
    const active = isActive && !aiChatOpen;
    return [
      'flex-1 flex flex-col items-center justify-center min-w-0 py-1 px-0.5 rounded-xl',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-brand-neutral)]',
      'transition-opacity active:opacity-80 no-underline',
    ].join(' ');
  };

  const innerClass = (active) =>
    [
      'w-full flex flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 px-1 transition-colors duration-200',
    ].join(' ');

  const iconStyle = (active) => ({
    color: active ? 'var(--color-brand-primary)' : 'var(--color-nav-muted)',
  });

  const labelStyle = (active) => ({
    color: active ? 'var(--color-brand-primary)' : 'var(--color-nav-muted)',
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div
        className="w-full max-w-md pointer-events-auto overflow-hidden"
        style={{
          borderTop: '2.5px solid var(--color-brand-primary)',
          backgroundColor: 'var(--color-brand-neutral)',
        }}
      >
        <div className="flex items-stretch px-1 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <NavLink
            to={base}
            end
            onClick={() => onNavigate?.()}
            className={tabClass}
          >
            {({ isActive }) => {
              const active = isActive && !aiChatOpen;
              return (
                <div
                  className={innerClass(active)}
                  style={{ background: active ? 'var(--color-nav-tile-active)' : 'transparent' }}
                >
                  <IconHome className="w-5 h-5 shrink-0" style={iconStyle(active)} />
                  <span
                    className="text-[8px] font-semibold uppercase tracking-[0.06em] leading-tight text-center max-w-full truncate"
                    style={labelStyle(active)}
                  >
                    Home
                  </span>
                </div>
              );
            }}
          </NavLink>

          <NavLink
            to={`${base}/menu`}
            onClick={() => onNavigate?.()}
            className={tabClass}
          >
            {({ isActive }) => {
              const active = isActive && !aiChatOpen;
              return (
                <div
                  className={innerClass(active)}
                  style={{ background: active ? 'var(--color-nav-tile-active)' : 'transparent' }}
                >
                  <IconMenu className="w-5 h-5 shrink-0" style={iconStyle(active)} />
                  <span
                    className="text-[8px] font-semibold uppercase tracking-[0.06em] leading-tight text-center max-w-full truncate"
                    style={labelStyle(active)}
                  >
                    Menu
                  </span>
                </div>
              );
            }}
          </NavLink>

          <button
            type="button"
            onClick={onChatClick}
            className="flex-1 flex flex-col items-center justify-center min-w-0 py-1 px-0.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] transition-opacity active:opacity-80"
          >
            <div
              className="w-full flex flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 px-1"
              style={{ background: aiChatOpen ? 'var(--color-nav-tile-active)' : 'transparent' }}
            >
              <IconAI className="w-5 h-5 shrink-0" style={iconStyle(aiChatOpen)} />
              <span
                className="text-[8px] font-semibold uppercase tracking-[0.06em] leading-tight text-center max-w-full truncate"
                style={labelStyle(aiChatOpen)}
              >
                AI Assistant
              </span>
            </div>
          </button>

          <NavLink
            to={`${base}/orders`}
            onClick={() => onNavigate?.()}
            className={tabClass}
          >
            {({ isActive }) => {
              const active = isActive && !aiChatOpen;
              return (
                <div
                  className={innerClass(active)}
                  style={{ background: active ? 'var(--color-nav-tile-active)' : 'transparent' }}
                >
                  <IconOrders className="w-5 h-5 shrink-0" style={iconStyle(active)} />
                  <span
                    className="text-[8px] font-semibold uppercase tracking-[0.06em] leading-tight text-center max-w-full truncate"
                    style={labelStyle(active)}
                  >
                    Orders
                  </span>
                </div>
              );
            }}
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
