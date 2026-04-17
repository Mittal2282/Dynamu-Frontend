import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  getRestaurantLocation,
  updateRestaurantLocation,
} from "../../../../services/dashboardService";
import { useToast } from "../../../../components/ui/Toast";

// ── Leaflet default icon fix (Vite can't resolve CDN refs in prod) ──────────
const markerIcon = L.icon({
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
  shadowSize:  [41, 41],
});

// Re-center the map whenever coords change
function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

function formatCoord(v, axis) {
  if (v == null || Number.isNaN(v)) return "—";
  const abs = Math.abs(v);
  const hemi = axis === "lat" ? (v >= 0 ? "N" : "S") : (v >= 0 ? "E" : "W");
  return `${abs.toFixed(6)}° ${hemi}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return "never synced";
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 60_000)        return "just now";
  if (ms < 3_600_000)     return `${Math.floor(ms / 60_000)} min ago`;
  if (ms < 86_400_000)    return `${Math.floor(ms / 3_600_000)} hr ago`;
  return `${Math.floor(ms / 86_400_000)} days ago`;
}

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 }; // New Delhi fallback
const RADIUS_MIN = 100;
const RADIUS_MAX = 10_000;
const RADIUS_STEP = 50;

export default function LocationPanel() {
  const toast = useToast();

  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState(null);
  const [saving, setSaving]         = useState(false);
  const [syncing, setSyncing]       = useState(false);
  const [synced_at, setSyncedAt]    = useState(null);

  const [form, setForm] = useState({
    latitude:  null,
    longitude: null,
    accuracy_m: null,
    label: "",
    radius_m: 2000,
    enforce_proximity: true,
  });
  const initialRef = useRef(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    getRestaurantLocation()
      .then((data) => {
        const loc     = data?.location || {};
        const coords  = Array.isArray(loc.coordinates) ? loc.coordinates : null;
        const next = {
          latitude:   coords ? coords[1] : null,
          longitude:  coords ? coords[0] : null,
          accuracy_m: loc.accuracy_m ?? null,
          label:      loc.label ?? "",
          radius_m:   data?.proximity_radius_m ?? 2000,
          enforce_proximity: data?.enforce_proximity ?? true,
        };
        setForm(next);
        initialRef.current = next;
        setSyncedAt(loc.synced_at || null);
      })
      .catch(() => setLoadError("Could not load location settings."))
      .finally(() => setLoading(false));
  }, []);

  // ── Geolocation sync ──────────────────────────────────────────────────────
  const handleSync = () => {
    if (!navigator.geolocation) {
      toast({ status: "error", title: "Geolocation not supported", description: "Your browser can't access location." });
      return;
    }
    setSyncing(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy_m: Math.round(pos.coords.accuracy ?? 0),
        }));
        setSyncing(false);
        toast({
          status: "success",
          title: "Location captured",
          description: `Accuracy ±${Math.round(pos.coords.accuracy ?? 0)} m — don't forget to save.`,
        });
      },
      (err) => {
        setSyncing(false);
        toast({
          status: "error",
          title: err.code === 1 ? "Permission denied" : "Couldn't get location",
          description: err.code === 1
            ? "Allow location access in your browser to capture the restaurant's position."
            : (err.message || "Try again near a window or outdoors."),
          duration: 5000,
        });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
    );
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const isDirty = useMemo(() => {
    const a = initialRef.current;
    if (!a) return false;
    return (
      a.latitude !== form.latitude ||
      a.longitude !== form.longitude ||
      a.radius_m !== form.radius_m ||
      a.enforce_proximity !== form.enforce_proximity ||
      (a.label || "") !== (form.label || "")
    );
  }, [form]);

  const canSave = isDirty && form.latitude != null && form.longitude != null && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await updateRestaurantLocation({
        latitude:  form.latitude,
        longitude: form.longitude,
        accuracy_m: form.accuracy_m ?? undefined,
        label:     form.label || undefined,
        radius_m:  form.radius_m,
        enforce_proximity: form.enforce_proximity,
      });
      initialRef.current = { ...form };
      setSyncedAt(new Date().toISOString());
      toast({ status: "success", title: "Location saved", description: "Customers will now be checked against this radius." });
    } catch (err) {
      toast({
        status: "error",
        title: "Save failed",
        description: err?.response?.data?.message || "Something went wrong. Please try again.",
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div
          className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--t-accent-20)", borderTopColor: "var(--t-accent)" }}
        />
        <p className="text-sm" style={{ color: "var(--t-dim)" }}>Loading location settings…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 rounded-2xl"
        style={{ background: "var(--t-surface)", border: "1px solid rgba(239,68,68,0.2)" }}
      >
        <span className="text-4xl mb-3">⚠️</span>
        <p className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>{loadError}</p>
      </div>
    );
  }

  const hasCoords = form.latitude != null && form.longitude != null;
  const center    = hasCoords ? { lat: form.latitude, lng: form.longitude } : DEFAULT_CENTER;
  const allowAll  = form.enforce_proximity === false;

  return (
    <div className="space-y-6">
      {/* ── Location card ───────────────────────────────────────────────── */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold" style={{ color: "var(--t-text)" }}>
              Restaurant Location
            </h2>
            <p className="text-xs mt-1" style={{ color: "var(--t-dim)" }}>
              The pin marks where your restaurant is. Customers must scan the QR from within the highlighted circle.
            </p>
          </div>
          <div
            className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium"
            style={{
              background: hasCoords ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
              border:     `1px solid ${hasCoords ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
              color:       hasCoords ? "#4ade80" : "#f87171",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: hasCoords ? "#4ade80" : "#f87171" }}
            />
            {hasCoords ? `Synced · ${timeAgo(synced_at)}` : "Not synced"}
          </div>
        </div>

        {/* Coord read-out */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-5 pb-4">
          <Stat label="Latitude"  value={formatCoord(form.latitude, "lat")} />
          <Stat label="Longitude" value={formatCoord(form.longitude, "lng")} />
          <Stat
            label="Accuracy"
            value={form.accuracy_m != null ? `±${Math.round(form.accuracy_m)} m` : "—"}
          />
        </div>

        {/* Map */}
        <div
          className="relative"
          style={{ borderTop: "1px solid var(--t-line)", borderBottom: "1px solid var(--t-line)" }}
        >
          <div className="h-[340px] w-full">
            <MapContainer
              center={[center.lat, center.lng]}
              zoom={hasCoords ? 15 : 5}
              scrollWheelZoom
              className="h-full w-full"
              style={{ background: "var(--t-float)" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {hasCoords && (
                <>
                  <Marker position={[form.latitude, form.longitude]} icon={markerIcon} />
                  <Circle
                    center={[form.latitude, form.longitude]}
                    radius={form.radius_m}
                    pathOptions={{
                      color: "#FF6B00",
                      fillColor: "#FF6B00",
                      fillOpacity: 0.12,
                      weight: 2,
                    }}
                  />
                  <Recenter lat={form.latitude} lng={form.longitude} />
                </>
              )}
            </MapContainer>
          </div>

          {!hasCoords && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] pointer-events-none">
              <div
                className="pointer-events-auto px-4 py-3 rounded-xl text-xs font-medium text-center"
                style={{
                  background: "var(--t-surface)",
                  border: "1px solid var(--t-line)",
                  color: "var(--t-dim)",
                }}
              >
                Tap “Sync my current location” while standing inside the restaurant.
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <p className="text-[11px] flex items-center gap-2" style={{ color: "var(--t-dim)" }}>
            <span>📍</span>
            Capture from the actual spot — this becomes the center of the geofence.
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, var(--t-accent), var(--t-accent2, #fb923c))",
              color: "#fff",
              boxShadow: "0 4px 14px var(--t-accent-20, rgba(249,115,22,0.25))",
            }}
          >
            {syncing ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Syncing…
              </>
            ) : (
              <>
                <span>📡</span>
                Sync my current location
              </>
            )}
          </button>
        </div>
      </section>

      {/* ── Proximity card ──────────────────────────────────────────────── */}
      <section
        className="rounded-2xl p-5 space-y-5"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
      >
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--t-text)" }}>
            Customer Proximity
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--t-dim)" }}>
            Choose whether to restrict ordering by distance, or allow everyone.
          </p>
        </div>

        {/* Allow all toggle */}
        <label
          className="flex items-center gap-4 p-3 rounded-xl cursor-pointer select-none"
          style={{ background: "var(--t-float)", border: "1px solid var(--t-line)" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>
              Allow all customers (disable geofencing)
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--t-dim)" }}>
              When on, anyone with the QR can start a session and order from anywhere.
            </p>
          </div>
          <input
            type="checkbox"
            checked={allowAll}
            onChange={(e) => setForm((p) => ({ ...p, enforce_proximity: !e.target.checked }))}
            className="sr-only peer"
          />
          <span
            className="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-all"
            style={{
              background: allowAll ? "rgba(239,68,68,0.7)" : "#22c55e",
              boxShadow: allowAll
                ? "0 0 8px rgba(239,68,68,0.25)"
                : "0 0 10px rgba(34,197,94,0.4)",
            }}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-300 mt-[2px] ml-[2px] ${
                allowAll ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </span>
        </label>

        {/* Radius slider */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--t-dim)" }}>
              Radius
            </label>
            <span className="text-lg font-bold tabular-nums" style={{ color: "var(--t-accent)" }}>
              {form.radius_m >= 1000
                ? `${(form.radius_m / 1000).toFixed(form.radius_m % 1000 === 0 ? 0 : 2)} km`
                : `${form.radius_m} m`}
            </span>
          </div>
          <input
            type="range"
            min={RADIUS_MIN}
            max={RADIUS_MAX}
            step={RADIUS_STEP}
            value={form.radius_m}
            onChange={(e) => setForm((p) => ({ ...p, radius_m: Number(e.target.value) }))}
            className="w-full accent-orange-500"
            style={{ accentColor: "var(--t-accent)" }}
            disabled={allowAll}
          />
          <div className="flex justify-between mt-1 text-[10px]" style={{ color: "var(--t-dim)" }}>
            <span>100 m</span>
            <span>10 km</span>
          </div>
        </div>

        {/* Summary + Save */}
        <div
          className="p-3 rounded-xl text-xs leading-relaxed"
          style={{
            background: "color-mix(in srgb, var(--t-accent, #FF6B00) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--t-accent, #FF6B00) 18%, transparent)",
            color: "var(--t-text)",
          }}
        >
          {allowAll ? (
            <>Geofencing is <span style={{ fontWeight: 800 }}>disabled</span> — anyone can order from anywhere.</>
          ) : (
            <>
              Customers beyond{" "}
              <span style={{ color: "var(--t-accent)", fontWeight: 700 }}>
                {form.radius_m >= 1000
                  ? `${(form.radius_m / 1000).toFixed(form.radius_m % 1000 === 0 ? 0 : 2)} km`
                  : `${form.radius_m} m`}
              </span>{" "}
              will be asked to visit the restaurant.
            </>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canSave
                ? "linear-gradient(135deg, var(--t-accent), var(--t-accent2, #fb923c))"
                : "var(--t-float)",
              color: canSave ? "#fff" : "var(--t-dim)",
              border: canSave ? "none" : "1px solid var(--t-line)",
              boxShadow: canSave ? "0 4px 14px var(--t-accent-20, rgba(249,115,22,0.25))" : "none",
            }}
          >
            {saving && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{ background: "var(--t-float)", border: "1px solid var(--t-line)" }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--t-dim)" }}>
        {label}
      </p>
      <p className="text-sm font-mono font-semibold mt-1 truncate" style={{ color: "var(--t-text)" }}>
        {value}
      </p>
    </div>
  );
}
