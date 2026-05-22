export default function CustomerBillPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: "color-mix(in srgb, var(--t-bg) 96%, black)" }}
    >
      {/* Background ambient glows */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-120 h-120 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, var(--t-accent-10) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, var(--t-accent2-10) 0%, transparent 70%)",
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-6 border"
        style={{
          background: "var(--t-surface)",
          borderColor: "var(--t-line)",
          boxShadow: "0 0 60px var(--t-glow-20), 0 1px 3px rgba(0,0,0,0.4)",
        }}
      >
        {/* Success icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--t-accent) 22%, transparent) 0%, color-mix(in srgb, var(--t-accent) 8%, transparent) 100%)",
            border: "1.5px solid var(--t-accent-40)",
            boxShadow: "0 0 32px var(--t-glow-20)",
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--t-accent)" }}
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>

        {/* Heading */}
        <div className="text-center space-y-2">
          <h1
            className="text-3xl font-black tracking-tight"
            style={{
              background:
                "linear-gradient(135deg, var(--t-accent) 0%, color-mix(in srgb, var(--t-accent) 60%, var(--t-text)) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Bill Requested
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--t-dim)" }}>
            Our staff has been notified and will be with you shortly.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px" style={{ background: "var(--t-line)" }} />

        {/* Status row */}
        <div className="w-full flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "color-mix(in srgb, var(--t-success) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--t-success) 25%, transparent)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--t-success)" }}
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--t-success)" }}>
              On its way
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--t-dim)" }}>
              A team member will arrive shortly
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px" style={{ background: "var(--t-line)" }} />

        {/* Scan to reorder */}
        <div
          className="w-full rounded-2xl p-4 flex items-start gap-3"
          style={{
            background: "color-mix(in srgb, var(--t-accent2) 6%, var(--t-float))",
            border: "1px solid color-mix(in srgb, var(--t-accent2) 18%, var(--t-line))",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{
              background: "color-mix(in srgb, var(--t-accent2) 15%, transparent)",
              border: "1px solid color-mix(in srgb, var(--t-accent2) 25%, transparent)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--t-accent2)" }}
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3" />
              <path d="M17 21v-4" />
              <path d="M21 14v3h-4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--t-accent2)" }}>
              Order Again
            </p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--t-dim)" }}>
              Scan the QR code on your table to start a new session
            </p>
          </div>
        </div>
      </div>

      {/* Footer tagline */}
      <p
        className="relative z-10 mt-8 text-xs font-medium tracking-wide"
        style={{ color: "var(--t-dim)" }}
      >
        Thank you for dining with us
      </p>
    </div>
  );
}
