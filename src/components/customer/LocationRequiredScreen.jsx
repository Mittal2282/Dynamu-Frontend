import Button from "../ui/Button";
import Text from "../ui/Text";

const BROWSER_HELP = [
  { label: "Chrome / Edge", hint: "Tap the 🔒 or ⓘ icon in the address bar → Site settings → Location → Allow." },
  { label: "Safari (iOS)",  hint: "Settings → Safari → Location → Allow. Also ensure Location Services are on." },
  { label: "Firefox",       hint: "Tap the shield icon → Permissions → Location → clear block, then retry." },
];

export default function LocationRequiredScreen({ onRetry, variant }) {
  const isError = variant === "error";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-5 py-8">
      <div
        className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-7 flex flex-col items-center gap-5 text-center"
        style={{ backgroundColor: "color-mix(in srgb, var(--t-surface, #11141C) 96%, black)" }}
      >
        {/* Icon with halo */}
        <div className="relative flex items-center justify-center">
          <span
            className="absolute inline-flex h-20 w-20 rounded-full opacity-30 animate-pulse"
            style={{ backgroundColor: "var(--t-accent, #FF6B00)" }}
          />
          <span
            className="relative flex items-center justify-center h-20 w-20 rounded-full text-3xl"
            style={{
              backgroundColor: "color-mix(in srgb, var(--t-accent, #FF6B00) 20%, transparent)",
              color: "var(--t-accent, #FF6B00)",
              border: "1px solid color-mix(in srgb, var(--t-accent, #FF6B00) 40%, transparent)",
            }}
          >
            {isError ? "⚠️" : "📡"}
          </span>
        </div>

        <div>
          <Text as="h1" size="xl" weight="bold">
            {isError ? "Can't read your location" : "Location access needed"}
          </Text>
          <Text size="sm" color="muted" className="mt-1.5">
            {isError
              ? "We couldn't get a GPS fix just now. This usually clears up after a moment outdoors or near a window."
              : "To confirm you're at the restaurant, we need permission to access your device's location."}
          </Text>
        </div>

        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left">
          <Text size="xs" color="muted" className="uppercase tracking-wider">
            How to enable
          </Text>
          <ul className="mt-2 flex flex-col gap-2">
            {BROWSER_HELP.map((b) => (
              <li key={b.label}>
                <Text size="xs" weight="bold" className="block text-white">
                  {b.label}
                </Text>
                <Text size="xs" color="muted" className="block leading-relaxed">
                  {b.hint}
                </Text>
              </li>
            ))}
          </ul>
        </div>

        <Button onClick={onRetry} className="w-full">
          {isError ? "Try again" : "Grant location access"}
        </Button>

        <Text size="xs" color="muted">
          We only use your location to verify you're inside the restaurant. It's not stored or shared.
        </Text>
      </div>
    </div>
  );
}
