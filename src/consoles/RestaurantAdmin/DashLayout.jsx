import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { getDashProfile } from "../../services/dashboardService";
import { authStore } from "../../store/authStore";

const NAV_MAIN = [
  {
    to: "/dashboard",
    label: "Live Orders",
    end: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[18px] h-[18px]"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <circle cx="12" cy="10" r="2" />
        <path d="M12 8v0M8 10h.01M16 10h.01" />
      </svg>
    ),
  },
  {
    to: "/dashboard/tables",
    label: "Table Status",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[18px] h-[18px]"
      >
        <path d="M3 6h18M3 12h18M9 6v12M15 6v12M3 18h18" />
      </svg>
    ),
  },
  {
    to: "/dashboard/menu",
    label: "Menu",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[18px] h-[18px]"
      >
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    to: "/dashboard/ingredients",
    label: "Ingredients",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[18px] h-[18px]"
      >
        <path d="M12 2a10 10 0 00-7 17.09M12 2c1.6 3.2 2 6.5 1 10M12 2c-1.6 3.2-2 6.5-1 10" />
        <path d="M5 17.09C6.5 18.9 9.1 20 12 20s5.5-1.1 7-2.91" />
        <path d="M11 12c0 4 1 7 1 7s1-3 1-7" />
      </svg>
    ),
  },
];

const NAV_SECONDARY = [
  {
    to: "/dashboard/completed-orders",
    label: "Order History",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[18px] h-[18px]"
      >
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    to: "/dashboard/stats",
    label: "Stats & Reports",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[18px] h-[18px]"
      >
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
];

function NavItem({ item, collapsed, onClick }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={item.label}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 group/nav ${
          collapsed ? "lg:justify-center lg:gap-0 lg:px-2 lg:py-2.5" : "px-3 py-2.5"
        } ${isActive ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.04]"}`
      }
      style={({ isActive }) =>
        isActive
          ? {
              background:
                "linear-gradient(90deg, rgba(var(--t-accent-rgb, 249,115,22),0.15), rgba(var(--t-accent-rgb, 249,115,22),0.05))",
              boxShadow: "inset 0 0 0 1px rgba(249,115,22,0.18)",
            }
          : {}
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className={`absolute top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full ${
                collapsed ? "lg:left-0.5 left-0" : "left-0"
              }`}
              style={{ background: "var(--t-accent)" }}
            />
          )}
          <span
            className="shrink-0 transition-colors duration-150"
            style={{ color: isActive ? "var(--t-accent)" : "inherit" }}
          >
            {item.icon}
          </span>
          <span className={`truncate ${collapsed ? "lg:sr-only" : ""}`}>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

const SIDEBAR_COLLAPSED_KEY = "dynamu-dash-sidebar-collapsed";

export default function DashLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [restaurantName, setRestaurantName] = useState("");
  const { adminName, adminRole, resetAuth } = authStore();
  const name = adminName || "Owner";

  useEffect(() => {
    getDashProfile()
      .then((data) => setRestaurantName(data?.name || ""))
      .catch(() => {});
  }, []);


  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const logout = () => {
    resetAuth();
    navigate("/login", { replace: true });
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div
      className="h-screen overflow-hidden text-white flex"
      style={{ fontFamily: "'Outfit', sans-serif", background: "var(--t-bg, #0a0c10)" }}
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
        className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col transition-all duration-300 ease-out w-60
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${sidebarCollapsed ? "lg:w-[4.25rem]" : "lg:w-60"}`}
        style={{
          background: "var(--t-surface, #111318)",
          borderRight: "1px solid var(--t-line, rgba(255,255,255,0.07))",
        }}
      >
        <div
          className="h-[2px] w-full shrink-0"
          style={{
            background: "linear-gradient(90deg, var(--t-accent), var(--t-accent2, #fb923c))",
          }}
        />

        {/* Mobile drawer header */}
        <div className="flex items-center justify-between px-3 py-2 shrink-0 lg:hidden border-b border-white/[0.06]">
          <span className="text-xs font-semibold truncate pr-2" style={{ color: "var(--t-text)" }}>
            {restaurantName || "Menu"}
          </span>
          <button
            type="button"
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors"
            style={{ color: "var(--t-dim)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.background = "rgba(255,255,255,0.07)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--t-dim)";
              e.currentTarget.style.background = "transparent";
            }}
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Brand + desktop collapse */}
        <div className={`px-3 py-3 shrink-0 ${sidebarCollapsed ? "lg:px-2 lg:py-3" : "lg:px-4"}`}>
          <div
            className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:flex-col lg:gap-2" : ""}`}
          >
            <div
              className="relative w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 select-none shadow-lg"
              style={{
                background: "linear-gradient(135deg, var(--t-accent), var(--t-accent2, #fb923c))",
                boxShadow: "0 4px 12px var(--t-accent-20, rgba(249,115,22,0.2))",
              }}
            >
              {restaurantName?.charAt(0)?.toUpperCase() || "D"}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border-2 animate-pulse"
                style={{ borderColor: "var(--t-surface, #111318)" }}
                title="Live"
              />
            </div>
            <div className={`min-w-0 flex-1 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
              <p
                className="text-sm font-bold truncate leading-tight"
                style={{
                  background: "linear-gradient(90deg, #fff 40%, rgba(255,255,255,0.5))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {restaurantName || "My Restaurant"}
              </p>
              <p
                className="text-[10px] mt-0.5 font-semibold uppercase tracking-widest truncate"
                style={{ color: "var(--t-accent)" }}
              >
                {adminRole === "restaurant_owner" ? "Owner" : "Staff"}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className={`hidden lg:flex w-8 h-8 rounded-lg items-center justify-center shrink-0 transition-colors ml-auto ${
                sidebarCollapsed ? "lg:ml-0" : ""
              }`}
              style={{ color: "var(--t-dim)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--t-dim)";
                e.currentTarget.style.background = "transparent";
              }}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div
          className={`mx-4 shrink-0 lg:mx-3 ${sidebarCollapsed ? "lg:mx-2" : ""}`}
          style={{ height: "1px", background: "var(--t-line)" }}
        />

        <nav
          className={`flex-1 py-4 flex flex-col gap-5 overflow-y-auto min-h-0 px-3 ${
            sidebarCollapsed ? "lg:px-2" : ""
          }`}
        >
          <div className="space-y-0.5">
            <p
              className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${
                sidebarCollapsed ? "lg:hidden" : ""
              }`}
              style={{ color: "var(--t-dim, rgba(255,255,255,0.3))" }}
            >
              Operations
            </p>
            {NAV_MAIN.map((item) => (
              <NavItem
                key={item.to}
                item={item}
                collapsed={sidebarCollapsed}
                onClick={closeSidebar}
              />
            ))}
          </div>

          <div className="space-y-0.5">
            <p
              className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${
                sidebarCollapsed ? "lg:hidden" : ""
              }`}
              style={{ color: "var(--t-dim, rgba(255,255,255,0.3))" }}
            >
              Insights
            </p>
            {NAV_SECONDARY.map((item) => (
              <NavItem
                key={item.to}
                item={item}
                collapsed={sidebarCollapsed}
                onClick={closeSidebar}
              />
            ))}
          </div>
        </nav>

        <div
          className={`mx-4 shrink-0 lg:mx-3 ${sidebarCollapsed ? "lg:mx-2" : ""}`}
          style={{ height: "1px", background: "var(--t-line)" }}
        />

        <div className={`px-3 py-4 shrink-0 space-y-1 ${sidebarCollapsed ? "lg:px-2" : ""}`}>
          <div
            className={`flex items-center gap-2.5 rounded-xl ${
              sidebarCollapsed ? "lg:justify-center lg:px-0 lg:py-2" : "px-3 py-2.5"
            }`}
            style={{ background: "var(--t-float, rgba(255,255,255,0.04))" }}
            title={name}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--t-accent), var(--t-accent2, #fb923c))",
                boxShadow: "0 0 0 2px var(--t-accent-20, rgba(249,115,22,0.2))",
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div className={`min-w-0 flex-1 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
              <p className="text-xs font-semibold truncate" style={{ color: "var(--t-text)" }}>
                {name}
              </p>
              <p className="text-[10px] truncate" style={{ color: "var(--t-dim)" }}>
                Logged in
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Sign out"
            className={`w-full flex items-center gap-3 rounded-xl text-sm transition-all duration-150 group/logout ${
              sidebarCollapsed ? "lg:justify-center lg:px-2 lg:py-2.5" : "px-3 py-2.5"
            }`}
            style={{ color: "var(--t-dim)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#f87171";
              e.currentTarget.style.background = "rgba(239,68,68,0.07)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--t-dim)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[18px] h-[18px] shrink-0"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span className={`font-medium ${sidebarCollapsed ? "lg:sr-only" : ""}`}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <button
          type="button"
          className="lg:hidden fixed top-3 left-3 z-10 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors"
          style={{
            background: "var(--t-surface)",
            border: "1px solid var(--t-line)",
            color: "var(--t-dim)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--t-dim)";
            e.currentTarget.style.background = "var(--t-surface)";
          }}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
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

        <main className="flex-1 p-4 md:p-6 pt-14 lg:pt-6 overflow-auto min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
