import { useState } from "react";
import { authStore } from "../../../store/authStore";
import LocationPanel from "./settings/LocationPanel";

const TABS = [
  { key: "location", label: "Location & Proximity", available: true },
  { key: "general",  label: "General",              available: false },
  { key: "branding", label: "Branding",             available: false },
  { key: "ai",       label: "AI Assistant",         available: false },
];

export default function SettingsPage() {
  const [active, setActive] = useState("location");
  const adminRole = authStore((s) => s.adminRole);
  const isOwner = adminRole === "restaurant_owner";

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{
            background: "linear-gradient(90deg, var(--t-text) 60%, var(--t-dim))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--t-dim)" }}>
          Configure where your restaurant lives on the map and how close customers must be to order.
        </p>
      </div>

      {/* Tab bar */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto"
        style={{ background: "var(--t-float)", border: "1px solid var(--t-line)" }}
      >
        {TABS.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => t.available && setActive(t.key)}
              disabled={!t.available}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
              style={
                isActive
                  ? {
                      background: "var(--t-surface)",
                      color: "var(--t-text)",
                      border: "1px solid var(--t-line)",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    }
                  : { color: "var(--t-dim)", border: "1px solid transparent" }
              }
            >
              {t.label}
              {!t.available && <span className="ml-1.5 opacity-60">(soon)</span>}
            </button>
          );
        })}
      </div>

      {active === "location" && (
        isOwner ? (
          <LocationPanel />
        ) : (
          <div
            className="flex items-center gap-4 px-5 py-4 rounded-2xl"
            style={{
              background: "rgba(234,179,8,0.07)",
              border: "1px solid rgba(234,179,8,0.2)",
            }}
          >
            <span className="text-2xl">🔒</span>
            <div>
              <p className="text-sm font-semibold text-yellow-300">Owner-only setting</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(250,204,21,0.75)" }}>
                Only the restaurant owner can update location and proximity settings.
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
