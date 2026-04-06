import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { getDashProfile } from '../services/adminService';
import { authStore } from '../store/authStore';

const NAV_MAIN = [
  {
    to: '/dashboard',
    label: 'Live Orders',
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <circle cx="12" cy="10" r="2" />
        <path d="M12 8v0M8 10h.01M16 10h.01" />
      </svg>
    ),
  },
  {
    to: '/dashboard/tables',
    label: 'Table Status',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
        <path d="M3 6h18M3 12h18M9 6v12M15 6v12M3 18h18" />
      </svg>
    ),
  },
  {
    to: '/dashboard/menu',
    label: 'Menu',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    to: '/dashboard/ingredients',
    label: 'Ingredients',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
        <path d="M12 2a10 10 0 00-7 17.09M12 2c1.6 3.2 2 6.5 1 10M12 2c-1.6 3.2-2 6.5-1 10" />
        <path d="M5 17.09C6.5 18.9 9.1 20 12 20s5.5-1.1 7-2.91" />
        <path d="M11 12c0 4 1 7 1 7s1-3 1-7" />
      </svg>
    ),
  },
];

const NAV_SECONDARY = [
  {
    to: '/dashboard/stats',
    label: 'Stats & Reports',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
];

function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group/nav ${
          isActive
            ? 'text-white'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
        }`
      }
      style={({ isActive }) =>
        isActive
          ? {
              background: 'linear-gradient(90deg, rgba(var(--t-accent-rgb, 249,115,22),0.15), rgba(var(--t-accent-rgb, 249,115,22),0.05))',
              boxShadow: 'inset 0 0 0 1px rgba(249,115,22,0.18)',
            }
          : {}
      }
    >
      {({ isActive }) => (
        <>
          {/* Left accent bar */}
          {isActive && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
              style={{ background: 'var(--t-accent)' }}
            />
          )}
          {/* Icon */}
          <span
            className="shrink-0 transition-colors duration-150"
            style={{ color: isActive ? 'var(--t-accent)' : 'inherit' }}
          >
            {item.icon}
          </span>
          {/* Label */}
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function DashLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const { adminName, adminRole, resetAuth } = authStore();
  const name = adminName || 'Owner';

  // Page title derived from route
  const pageTitle = [...NAV_MAIN, ...NAV_SECONDARY].find(
    (n) => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
  )?.label ?? 'Dashboard';

  useEffect(() => {
    getDashProfile()
      .then(data => setRestaurantName(data?.name || ''))
      .catch(() => {});
  }, []);

  const logout = () => {
    resetAuth();
    navigate('/login', { replace: true });
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div
      className="h-screen overflow-hidden text-white flex"
      style={{ fontFamily: "'Outfit', sans-serif", background: 'var(--t-bg, #0a0c10)' }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-60 flex flex-col transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{
          background: 'var(--t-surface, #111318)',
          borderRight: '1px solid var(--t-line, rgba(255,255,255,0.07))',
        }}
      >
        {/* Top accent line */}
        <div
          className="h-[2px] w-full shrink-0"
          style={{ background: 'linear-gradient(90deg, var(--t-accent), var(--t-accent2, #fb923c))' }}
        />

        {/* Brand */}
        <div className="px-4 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 select-none shadow-lg"
              style={{
                background: 'linear-gradient(135deg, var(--t-accent), var(--t-accent2, #fb923c))',
                boxShadow: '0 4px 12px var(--t-accent-20, rgba(249,115,22,0.2))',
              }}
            >
              {restaurantName?.charAt(0)?.toUpperCase() || 'D'}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-bold truncate leading-tight"
                style={{
                  background: 'linear-gradient(90deg, #fff 40%, rgba(255,255,255,0.5))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {restaurantName || 'My Restaurant'}
              </p>
              <p
                className="text-[10px] mt-0.5 font-semibold uppercase tracking-widest truncate"
                style={{ color: 'var(--t-accent)' }}
              >
                {adminRole === 'restaurant_owner' ? 'Owner' : 'Staff'}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 shrink-0" style={{ height: '1px', background: 'var(--t-line)' }} />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-5 overflow-y-auto">
          {/* Main */}
          <div className="space-y-0.5">
            <p
              className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--t-dim, rgba(255,255,255,0.3))' }}
            >
              Operations
            </p>
            {NAV_MAIN.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </div>

          {/* Secondary */}
          <div className="space-y-0.5">
            <p
              className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--t-dim, rgba(255,255,255,0.3))' }}
            >
              Insights
            </p>
            {NAV_SECONDARY.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </div>
        </nav>

        {/* Divider */}
        <div className="mx-4 shrink-0" style={{ height: '1px', background: 'var(--t-line)' }} />

        {/* Footer — user + logout */}
        <div className="px-3 py-4 shrink-0 space-y-1">
          {/* User chip */}
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
            style={{ background: 'var(--t-float, rgba(255,255,255,0.04))' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--t-accent), var(--t-accent2, #fb923c))',
                boxShadow: '0 0 0 2px var(--t-accent-20, rgba(249,115,22,0.2))',
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--t-text)' }}>
                {name}
              </p>
              <p className="text-[10px] truncate" style={{ color: 'var(--t-dim)' }}>
                Logged in
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group/logout"
            style={{ color: 'var(--t-dim)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--t-dim)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header
          className="shrink-0 px-4 md:px-6 py-3.5 flex items-center justify-between gap-4"
          style={{
            background: 'var(--t-surface)',
            borderBottom: '1px solid var(--t-line)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--t-dim)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--t-dim)'; e.currentTarget.style.background = 'transparent'; }}
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs hidden sm:block" style={{ color: 'var(--t-dim)' }}>
                {restaurantName}
              </span>
              <span className="text-xs hidden sm:block" style={{ color: 'var(--t-line)' }}>
                /
              </span>
              <span className="text-sm font-semibold truncate" style={{ color: 'var(--t-text)' }}>
                {pageTitle}
              </span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live pulse */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.15)',
                color: '#4ade80',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </div>

            {/* User chip */}
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl"
              style={{
                background: 'var(--t-float)',
                border: '1px solid var(--t-line)',
              }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--t-accent), var(--t-accent2, #fb923c))' }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium hidden sm:block" style={{ color: 'var(--t-text)' }}>
                {name}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
