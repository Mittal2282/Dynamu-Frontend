import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { authStore } from "../../store/authStore";

const NAV = [
  { to: "/superadmin", label: "Restaurants", icon: "🏪", end: true },
  { to: "/superadmin/onboard", label: "Onboard New", icon: "➕" },
];

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { adminName, resetAuth } = authStore();
  const name = adminName || "Admin";

  const logout = () => {
    resetAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-white flex"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-white/10 flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand identity */}
        <div
          className="px-5 py-5 border-b border-white/10 shrink-0"
          style={{ borderTop: "2.5px solid var(--t-accent)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 select-none"
              style={{ background: "linear-gradient(135deg, var(--t-accent), #fb923c)" }}
            >
              D
            </div>
            <div>
              <p
                className="text-sm font-bold"
                style={{
                  background: "linear-gradient(90deg, #fb923c, #fdba74)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Dynamu
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5 tracking-wide uppercase">
                Superadmin
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${
                  isActive
                    ? "bg-orange-500/15 text-orange-400 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.2)]"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10 space-y-2 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--t-accent), #fb923c)",
                boxShadow: "0 0 0 1.5px rgba(249,115,22,0.25)",
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-slate-300 truncate">{name}</span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
          >
            <span className="text-base w-5 text-center">🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <span
              className="text-sm font-semibold hidden sm:block"
              style={{
                background: "linear-gradient(90deg, #fff, #94a3b8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Superadmin Dashboard
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--t-accent), #fb923c)",
                boxShadow: "0 0 0 1.5px rgba(249,115,22,0.3)",
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-slate-300 hidden sm:block">{name}</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
