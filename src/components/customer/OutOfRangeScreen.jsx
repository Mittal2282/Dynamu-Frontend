import Button from "../ui/Button";
import Text from "../ui/Text";

function formatDistance(meters) {
  if (meters == null || Number.isNaN(meters)) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
}

export default function OutOfRangeScreen({
  distance_m,
  radius_m,
  restaurantName,
  onRetry,
}) {
  const dist = formatDistance(distance_m);
  const rad  = formatDistance(radius_m);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-5">
      <div
        className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-7 flex flex-col items-center gap-5 text-center"
        style={{ backgroundColor: "color-mix(in srgb, var(--t-surface, #11141C) 96%, black)" }}
      >
        {/* Pulsing halo */}
        <div className="relative flex items-center justify-center">
          <span
            className="absolute inline-flex h-20 w-20 rounded-full opacity-40 animate-ping"
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
            📍
          </span>
        </div>

        <div>
          <Text as="h1" size="xl" weight="bold">
            You're too far away
          </Text>
          {restaurantName ? (
            <Text size="sm" color="muted" className="mt-1.5">
              from <span className="text-white font-medium">{restaurantName}</span>
            </Text>
          ) : (
            <Text size="sm" color="muted" className="mt-1.5">
              from the restaurant
            </Text>
          )}
        </div>

        {(dist || rad) && (
          <div className="w-full grid grid-cols-2 gap-3">
            {dist && (
              <div className="bg-white/5 border border-white/10 rounded-2xl py-3 px-3">
                <Text size="xs" color="muted">Your distance</Text>
                <Text size="lg" weight="bold" className="mt-0.5 block">
                  {dist}
                </Text>
              </div>
            )}
            {rad && (
              <div className="bg-white/5 border border-white/10 rounded-2xl py-3 px-3">
                <Text size="xs" color="muted">Allowed radius</Text>
                <Text size="lg" weight="bold" className="mt-0.5 block">
                  {rad}
                </Text>
              </div>
            )}
          </div>
        )}

        <Text size="sm" color="muted">
          Please visit the restaurant and scan the QR code again from there.
        </Text>

        <Button onClick={onRetry} className="w-full">
          Try again
        </Button>
      </div>
    </div>
  );
}
