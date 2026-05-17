import React from 'react';
import { NavLink } from 'react-router-dom';
import { authStore } from '../../store/authStore';
import { useCartCount, useCartTotal } from '../../store/cartStore';
import { restaurantStore } from '../../store/restaurantStore';
import { formatCurrency } from '../../utils/formatters';
import { CountBadge } from '../ui/Badge';
import Text from '../ui/Text';

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

function IconCutlery({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="3" y1="2" x2="3" y2="22" />
      <path d="M7 2v8a4 4 0 0 1-4 4" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <path d="M21 2l-1 10a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2L15 2" />
      <line x1="18" y1="14" x2="18" y2="22" />
    </svg>
  );
}

function IconCartBag({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

interface HeaderProps {
  onCartClick?: () => void;
  variant?: 'legacy' | 'customer';
  basePath?: string;
  aiChatOpen?: boolean;
  onAIClick?: () => void;
}

export default function Header({ onCartClick, variant = 'legacy', basePath = '', aiChatOpen = false, onAIClick }: HeaderProps) {
  const { name, tagline, currencySymbol, tableNumber, tableFloor, tableFloorName } = restaurantStore();
  const { colorMode, setColorMode } = authStore();
  const count = useCartCount();
  const total = useCartTotal();
  const toggleMode = () => setColorMode(colorMode === 'light' ? 'dark' : 'light');

  if (variant === 'customer') {
    const title = name || 'Restaurant';
    const base = basePath.replace(/\/$/, '');

    const navLinkClass = (isActive: boolean) => [
      'px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap',
      isActive
        ? 'text-(--t-accent) bg-(--t-accent-10)'
        : 'text-[var(--t-dim)] hover:text-[var(--t-text)] hover:bg-[var(--t-float)]',
    ].join(' ');

    return (
      <header
        className="px-5 py-3.5 sticky top-0 z-30 border-b"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--t-bg) 96%, black)',
          borderColor: 'var(--t-line)',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Logo + name */}
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            <IconCutlery className="w-7 h-7 shrink-0" style={{ color: 'var(--t-accent)' }} />
            <h1
              className="text-[15px] font-bold uppercase tracking-[0.12em] leading-tight truncate"
              style={{ color: 'var(--t-accent)' }}
            >
              {title}
            </h1>
            {tableNumber && (
              <span
                className="table-num-badge text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest shrink-0"
                style={{
                  color: 'var(--t-accent2)',
                  borderColor: 'var(--t-accent2-40)',
                  background: 'var(--t-accent2-20)',
                }}
              >
                {(tableFloor as number) > 1 || (tableFloor && tableFloorName)
                  ? `${tableFloorName || `F${tableFloor}`} · T·${tableNumber}`
                  : `T·${tableNumber}`}
              </span>
            )}
          </div>

          {/* Inline nav — tablet/desktop only */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            <NavLink
              to={base}
              end
              className={({ isActive }) => navLinkClass(isActive && !aiChatOpen)}
            >
              Home
            </NavLink>
            <NavLink
              to={`${base}/menu`}
              className={({ isActive }) => navLinkClass(isActive && !aiChatOpen)}
            >
              Menu
            </NavLink>
            <button
              type="button"
              onClick={onAIClick}
              className={navLinkClass(aiChatOpen)}
            >
              AI Assistant
            </button>
            <NavLink
              to={`${base}/orders`}
              className={({ isActive }) => navLinkClass(isActive && !aiChatOpen)}
            >
              Orders
            </NavLink>
          </nav>

          {/* Right group: toggle + cart — always pinned to top-right */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Light/dark toggle */}
            <button
              type="button"
              onClick={toggleMode}
              aria-label={colorMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              className="p-2 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-[0.96]"
              style={{
                background: colorMode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
                color: 'var(--t-dim)',
              }}
            >
              {colorMode === 'dark' ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Mobile cart button — opens drawer */}
            <button
              type="button"
              onClick={onCartClick}
              className="relative w-11 h-11 md:hidden rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-transform"
              style={{
                background: colorMode === 'dark'
                  ? 'color-mix(in srgb, var(--t-bg) 70%, white 8%)'
                  : 'var(--t-float)',
                border: '1px solid var(--t-line)',
              }}
              aria-label={`Cart${count > 0 ? ` — ${count} items` : ''}`}
            >
              <IconCartBag className="w-5 h-5" style={{ color: 'var(--t-accent)' }} />
              <CountBadge count={count} />
            </button>

            {/* Desktop cart — NavLink to cart page */}
            <NavLink
              to={`${base}/cart`}
              className={({ isActive }) => [
                'hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl shrink-0 transition-all active:scale-95',
                count > 0 ? 'border' : 'opacity-60 hover:opacity-100',
                isActive
                  ? 'text-(--t-accent) bg-(--t-accent-10) border-(--t-accent-40)'
                  : count > 0
                    ? 'text-(--t-accent) border-(--t-accent-40) bg-(--t-accent-10) hover:bg-(--t-accent-20)'
                    : 'text-(--t-dim) hover:text-(--t-text) hover:bg-(--t-float)',
              ].join(' ')}
              aria-label={`Cart${count > 0 ? ` — ${count} items` : ''}`}
            >
              <div className="relative">
                <IconCartBag className="w-4 h-4" style={{ color: count > 0 ? 'var(--t-accent)' : 'currentColor' }} />
                {count > 0 && (
                  <span
                    className="absolute -top-2 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: 'var(--t-accent)', fontSize: '9px' }}
                  >
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </div>
              {count > 0 && (
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="text-xs font-bold whitespace-nowrap" style={{ color: 'var(--t-accent)' }}>
                    {formatCurrency(total, currencySymbol)}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--t-accent)', opacity: 0.7 }}>→</span>
                </div>
              )}
            </NavLink>
          </div>
        </div>
      </header>
    );
  }

  const title = name || 'Dynamu Smart Menu';
  const sub = tagline || 'Table 05 • Royal Cafe';

  return (
    <header className="px-5 py-4 flex justify-between items-center bg-white/5 backdrop-blur-md border-b border-white/10">
      <div>
        <Text
          as="h1"
          size="lg"
          weight="bold"
          className="bg-linear-to-r from-brand to-orange-400 bg-clip-text text-transparent"
        >
          {title}
        </Text>
        <Text size="xs" color="muted" className="mt-0.5">{sub}</Text>
      </div>

      <button
        type="button"
        onClick={onCartClick}
        className="relative cursor-pointer active:scale-90 transition-transform"
        aria-label={`View cart${count > 0 ? ` — ${count} items` : ''}`}
      >
        <span className="text-2xl">🛒</span>
        <CountBadge count={count} />
      </button>
    </header>
  );
}
