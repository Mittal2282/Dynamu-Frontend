import { useState } from "react";
import { Alert, Segmented } from "antd";
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
    <Alert
      type="warning"
      showIcon
      icon={<span className="text-xl">🔒</span>}
      message="Owner-only setting"
      description="Only the restaurant owner can update these settings."
    />
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
      <Segmented
        value={active}
        onChange={(val) => setActive(val as string)}
        options={TABS.map((t) => ({
          value: t.key,
          label: t.available ? t.label : `${t.label} (soon)`,
          disabled: !t.available,
        }))}
        className="overflow-x-auto"
      />

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
