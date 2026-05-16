import { BG, BG_DARK, ORANGE } from "../../../constants/landingConstants";
import { useLandingTheme } from "../../../context/LandingThemeContext";

export function FooterSlide() {
  const { isDark } = useLandingTheme();
  const bg = isDark ? BG_DARK : BG;
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const headingColor = isDark ? "#f1f5f9" : "#111827";
  const bodyColor = isDark ? "#64748b" : "#9ca3af";
  const linkColor = isDark ? "#94a3b8" : "#6b7280";
  const linkHoverColor = isDark ? "#f1f5f9" : "#111827";
  const socialBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const socialBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
  const socialHoverBg = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";
  const copyrightColor = isDark ? "#475569" : "#9ca3af";
  const tagColor = isDark ? "#334155" : "#d1d5db";

  return (
    <footer
      className="border-t min-h-[100dvh] w-full flex flex-col justify-between shrink-0 relative overflow-hidden"
      style={{ background: bg, borderColor }}
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] pointer-events-none opacity-20"
        style={{
          background: `radial-gradient(ellipse at top, ${ORANGE} 0%, transparent 70%)`,
        }}
      />

      <div className="flex-1 flex flex-col justify-center max-w-6xl mx-auto px-6 py-20 w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-20">
          <div className="md:col-span-6 flex flex-col items-start">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-[0_0_24px_rgba(255,107,0,0.4)]"
                style={{
                  background: `linear-gradient(135deg, ${ORANGE} 0%, #FF9F45 100%)`,
                  color: "#fff",
                }}
              >
                D
              </div>
              <span className="font-bold text-2xl tracking-tight" style={{ color: headingColor }}>
                Dynamu<span style={{ color: ORANGE }}>.AI</span>
              </span>
            </div>
            <p className="text-[15px] leading-relaxed max-w-sm mb-8" style={{ color: bodyColor }}>
              The AI-native ordering layer built for Bharat. Turning every restaurant menu into a
              conversational sales representative that remembers and upsells.
            </p>
            <div className="flex gap-4">
              <a
                href="https://x.com/bhavyam"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{ background: socialBg, border: `1px solid ${socialBorder}`, color: linkColor }}
                onMouseEnter={(e) => { e.currentTarget.style.background = socialHoverBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = socialBg; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 4.15H5.078z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-semibold mb-5 text-sm uppercase tracking-wider" style={{ color: headingColor }}>
              Product
            </h4>
            <ul className="space-y-3">
              {["Capabilities", "Case Studies", "Pricing", "ROI Calculator"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm transition-colors"
                    style={{ color: linkColor }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = linkHoverColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = linkColor; }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-semibold mb-5 text-sm uppercase tracking-wider" style={{ color: headingColor }}>
              Company
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:founder@dynamu.ai"
                  className="text-sm flex items-center gap-2 transition-colors"
                  style={{ color: linkColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = linkHoverColor; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = linkColor; }}
                >
                  Contact Team
                </a>
              </li>
              {["Privacy Policy", "Terms of Service"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm flex items-center gap-2 transition-colors"
                    style={{ color: linkColor }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = linkHoverColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = linkColor; }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="w-full border-t relative z-10" style={{ borderColor }}>
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[13px] font-medium" style={{ color: copyrightColor }}>
            © {new Date().getFullYear()} Dynamu AI. All rights reserved.
          </p>
          <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: tagColor }}>
            Vertical AI · HoReCa · Bharat First
          </span>
        </div>
      </div>
    </footer>
  );
}
