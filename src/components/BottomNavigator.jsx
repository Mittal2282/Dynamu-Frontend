import { useLocation, useNavigate } from 'react-router-dom';

/* ─── SVG Icons ─────────────────────────────────────────────────────────────── */
function IconHome({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" />
    </svg>
  );
}

function IconMenu({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
}

function IconAI({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconOrders({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

/* ─── BottomNavigator ───────────────────────────────────────────────────────── */
/**
 * @param {string}   basePath    — e.g. "/:qrCodeId/:tableNumber"
 * @param {boolean}  aiChatOpen  — whether the AI drawer is open
 * @param {function} onChatClick — open AI chat drawer
 * @param {function} onNavigate  — called before any route navigation (close drawers)
 */
export default function BottomNavigator({ basePath, aiChatOpen, onChatClick, onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();

  const p = location.pathname;
  const isHome   = p === basePath || p === `${basePath}/`;
  const isMenu   = p === `${basePath}/menu`;
  const isOrders = p === `${basePath}/orders`;

  const handleNav = (path) => {
    onNavigate?.();
    navigate(path);
  };

  const tabs = [
    {
      key:    'home',
      label:  'Home',
      Icon:   IconHome,
      active: isHome && !aiChatOpen,
      onClick: () => handleNav(basePath),
    },
    {
      key:    'menu',
      label:  'Menu',
      Icon:   IconMenu,
      active: isMenu && !aiChatOpen,
      onClick: () => handleNav(`${basePath}/menu`),
    },
    {
      key:    'ai',
      label:  'AI Assistant',
      Icon:   IconAI,
      active: !!aiChatOpen,
      onClick: onChatClick,
    },
    {
      key:    'orders',
      label:  'Orders',
      Icon:   IconOrders,
      active: isOrders && !aiChatOpen,
      onClick: () => handleNav(`${basePath}/orders`),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto bg-[#0d0d0d] rounded-t-2xl overflow-hidden border-t border-white/[0.06]">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={tab.onClick}
              className="flex-1 flex flex-col items-center gap-1.5 pt-2.5 pb-3.5 relative focus:outline-none active:opacity-70 transition-opacity"
            >
              {/* Full-width active stripe across the top of the tab */}
              <span
                className="absolute inset-x-0 top-0 h-[2px] transition-opacity duration-200"
                style={{
                  background: 'var(--color-brand-primary)',
                  opacity: tab.active ? 1 : 0,
                }}
              />

              <tab.Icon
                className="w-5 h-5 transition-colors duration-200"
                style={{ color: tab.active ? 'var(--color-brand-primary)' : '#475569' }}
              />
              <span
                className="text-[9px] font-semibold uppercase tracking-widest transition-colors duration-200"
                style={{ color: tab.active ? 'var(--color-brand-primary)' : '#475569' }}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
