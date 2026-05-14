import { useState } from "react";
import { authStore } from "../../../store/authStore";
import LocationPanel from "./settings/LocationPanel";
import PetpoojaPanel from "./settings/PetpoojaPanel";

interface Tab {
  key: string;
  label: string;
  available: boolean;
}

const TABS: Tab[] = [
  { key: "location", label: "Location & Proximity", available: true },
  { key: "petpooja", label: "Petpooja POS",         available: true },
  { key: "general",  label: "General",              available: false },
  { key: "branding", label: "Branding",             available: false },
  { key: "ai",       label: "AI Assistant",         available: false },
];

function OwnerOnlyAlert() {
  return (
    <div role="alert" className="alert alert-warning gap-4">
      <span className="text-2xl">🔒</span>
      <div>
        <p className="text-sm font-semibold">Owner-only setting</p>
        <p className="text-xs mt-0.5 opacity-75">Only the restaurant owner can update these settings.</p>
      </div>
    </div>
  );
}

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
          } as React.CSSProperties}
        >
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--t-dim)" }}>
          Configure where your restaurant lives on the map and how close customers must be to order.
        </p>
      </div>

      {/* Tab bar */}
      <div role="tablist" className="tabs tabs-boxed overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            onClick={() => t.available && setActive(t.key)}
            disabled={!t.available}
            className={`tab text-xs font-semibold whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${active === t.key ? 'tab-active' : ''}`}
          >
            {t.label}
            {!t.available && <span className="ml-1.5 opacity-60">(soon)</span>}
          </button>
        ))}
      </div>

      {active === "location" && (
        isOwner ? (
          <LocationPanel />
        ) : (
          <OwnerOnlyAlert />
        )
      )}

      {active === "petpooja" && (
        isOwner ? (
          <PetpoojaPanel />
        ) : (
          <OwnerOnlyAlert />
        )
      )}
    </div>
  );
}
