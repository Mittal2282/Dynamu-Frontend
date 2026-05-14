import { useEffect, useRef, useState } from "react";
import { getPetpoojaConfig, updatePetpoojaConfig, type PetpoojaConfig } from "../../../../services/dashboardService";
import { useToast } from "../../../../components/ui/Toast";

function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return "never";
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 60_000)     return "just now";
  if (ms < 3_600_000)  return `${Math.floor(ms / 60_000)} min ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} hr ago`;
  return `${Math.floor(ms / 86_400_000)} days ago`;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0"
      style={{
        background: copied ? "rgba(34,197,94,0.15)" : "var(--t-float)",
        border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "var(--t-line)"}`,
        color: copied ? "#4ade80" : "var(--t-dim)",
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function PetpoojaPanel() {
  const toast = useToast();

  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);

  const [config, setConfig] = useState<PetpoojaConfig | null>(null);
  const [form, setForm] = useState({
    enabled:      false,
    app_key:      "",
    app_secret:   "",
    access_token: "",
    rest_id:      "",
  });
  const initialEnabledRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    getPetpoojaConfig()
      .then((data) => {
        setConfig(data);
        setForm({
          enabled:      data.enabled,
          app_key:      data.app_key ?? "",
          app_secret:   "",
          access_token: "",
          rest_id:      data.rest_id ?? "",
        });
        initialEnabledRef.current = data.enabled;
      })
      .catch(() => setLoadError("Could not load Petpooja settings."))
      .finally(() => setLoading(false));
  }, []);

  const isActive = config?.enabled && config.has_secret && config.has_token;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Parameters<typeof updatePetpoojaConfig>[0] = {
        enabled: form.enabled,
        rest_id: form.rest_id,
      };
      if (form.app_key.trim())      payload.app_key      = form.app_key.trim();
      if (form.app_secret.trim())   payload.app_secret   = form.app_secret.trim();
      if (form.access_token.trim()) payload.access_token = form.access_token.trim();

      const result = await updatePetpoojaConfig(payload);
      setConfig((prev) => prev ? {
        ...prev,
        enabled:      form.enabled,
        app_key:      form.app_key || prev.app_key,
        has_secret:   form.app_secret.trim() ? true : prev.has_secret,
        has_token:    form.access_token.trim() ? true : prev.has_token,
        rest_id:      form.rest_id,
        callback_url: result.callback_url,
        menu_push_url: result.menu_push_url,
      } : prev);
      setForm((f) => ({ ...f, app_secret: "", access_token: "" }));
      toast({ status: "success", title: "Petpooja config saved" });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast({ status: "error", title: "Save failed", description: e?.response?.data?.message ?? "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div
          className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--t-accent-20)", borderTopColor: "var(--t-accent)" }}
        />
        <p className="text-sm" style={{ color: "var(--t-dim)" }}>Loading Petpooja settings…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 rounded-2xl"
        style={{ background: "var(--t-surface)", border: "1px solid rgba(239,68,68,0.2)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>{loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Status + Enable card ── */}
      <section
        className="rounded-2xl p-5 space-y-5"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--t-text)" }}>Petpooja POS Integration</h2>
            <p className="text-xs mt-1" style={{ color: "var(--t-dim)" }}>
              When enabled, all session orders are sent to your Petpooja POS when the customer requests the final bill.
            </p>
          </div>
          <div
            className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium"
            style={{
              background: isActive ? "rgba(34,197,94,0.12)" : "rgba(148,163,184,0.12)",
              border:     `1px solid ${isActive ? "rgba(34,197,94,0.25)" : "rgba(148,163,184,0.2)"}`,
              color:       isActive ? "#4ade80" : "var(--t-dim)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? "#4ade80" : "var(--t-dim)" }} />
            {isActive ? "Active" : "Not configured"}
          </div>
        </div>

        {/* Enable toggle */}
        <label
          className="flex items-center gap-4 p-3 rounded-xl cursor-pointer select-none"
          style={{ background: "var(--t-float)", border: "1px solid var(--t-line)" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>Enable Petpooja POS</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--t-dim)" }}>Orders will relay to Petpooja on bill request.</p>
          </div>
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
            className="sr-only"
          />
          <span
            className="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-all"
            style={{
              background: form.enabled ? "var(--t-accent)" : "rgba(148,163,184,0.3)",
              boxShadow: form.enabled ? "0 0 10px var(--t-accent-20, rgba(249,115,22,0.25))" : "none",
            }}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-300 mt-[2px] ml-[2px] ${
                form.enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </span>
        </label>
      </section>

      {/* ── Credentials card ── */}
      <section
        className="rounded-2xl p-5 space-y-4"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
      >
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--t-dim)" }}>
          Credentials
        </h2>

        <Field
          label="App Key"
          value={form.app_key}
          onChange={(v) => setForm((f) => ({ ...f, app_key: v }))}
          placeholder="5goaxwz47qsmn…"
        />
        <Field
          label="App Secret"
          type="password"
          value={form.app_secret}
          onChange={(v) => setForm((f) => ({ ...f, app_secret: v }))}
          placeholder={config?.has_secret ? "••••••••  (already set — leave blank to keep)" : "Enter app secret"}
        />
        <Field
          label="Access Token"
          type="password"
          value={form.access_token}
          onChange={(v) => setForm((f) => ({ ...f, access_token: v }))}
          placeholder={config?.has_token ? "••••••••  (already set — leave blank to keep)" : "Enter access token"}
        />
        <Field
          label="Restaurant ID (restID / mapping code)"
          value={form.rest_id}
          onChange={(v) => setForm((f) => ({ ...f, rest_id: v }))}
          placeholder="oqxwni2t"
        />
      </section>

      {/* ── URLs card ── */}
      {config?.callback_url && (
        <section
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
        >
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--t-dim)" }}>
              Petpooja Dashboard Config
            </h2>
            <p className="text-xs mt-1" style={{ color: "var(--t-dim)" }}>
              Paste these into your Petpooja sandbox Configuration page.
            </p>
          </div>

          <ReadonlyUrl label="Menu Push URL (Menu Sharing Endpoint)" value={config.menu_push_url ?? ""} />
          <ReadonlyUrl label="Callback URL" value={config.callback_url} />
        </section>
      )}

      {/* ── Menu sync status ── */}
      <section
        className="rounded-2xl p-4"
        style={{
          background: "color-mix(in srgb, var(--t-accent, #FF6B00) 6%, transparent)",
          border: "1px solid color-mix(in srgb, var(--t-accent, #FF6B00) 15%, transparent)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍽️</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>Menu Sync</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--t-dim)" }}>
              {config?.menu_synced_at
                ? `Last menu push received ${timeAgo(config.menu_synced_at)}. Item IDs are mapped.`
                : "No menu push received yet. Trigger a Menu Push from your Petpooja dashboard to map item IDs."}
            </p>
          </div>
          {config?.menu_synced_at && (
            <span
              className="shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold"
              style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }}
            >
              Synced
            </span>
          )}
        </div>
      </section>

      {/* ── Save ── */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, var(--t-accent), var(--t-accent2, #fb923c))",
            color: "#fff",
            boxShadow: "0 4px 14px var(--t-accent-20, rgba(249,115,22,0.25))",
          }}
        >
          {saving && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "password";
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold" style={{ color: "var(--t-dim)" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
        style={{
          background: "var(--t-float)",
          border: "1px solid var(--t-line)",
          color: "var(--t-text)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--t-accent)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--t-line)")}
      />
    </div>
  );
}

function ReadonlyUrl({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold" style={{ color: "var(--t-dim)" }}>{label}</label>
      <div className="flex items-center gap-2">
        <div
          className="flex-1 min-w-0 px-3 py-2 rounded-xl text-xs font-mono truncate"
          style={{ background: "var(--t-float)", border: "1px solid var(--t-line)", color: "var(--t-text)" }}
        >
          {value}
        </div>
        <CopyButton value={value} />
      </div>
    </div>
  );
}
