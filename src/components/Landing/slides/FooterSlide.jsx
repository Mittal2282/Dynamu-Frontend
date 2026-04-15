import { BORDER, ORANGE } from "../../../constants/landingConstants";

export function FooterSlide() {
  return (
    <footer
      className="border-t min-h-[100dvh] w-full flex flex-col justify-between shrink-0 relative overflow-hidden bg-[#0a0c10]"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}
    >
      {/* Subtle background glow */}
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
              <span className="font-bold text-white text-2xl tracking-tight">
                Dynamu<span style={{ color: ORANGE }}>.AI</span>
              </span>
            </div>
            <p className="text-slate-400 text-[15px] leading-relaxed max-w-sm mb-8">
              The AI-native ordering layer built for Bharat. Turning every restaurant menu into a
              conversational sales representative that remembers and upsells.
            </p>
            <div className="flex gap-4">
              <a
                href="https://x.com/bhavyam"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors text-slate-300"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 4.15H5.078z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Capabilities
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Case Studies
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                  ROI Calculator
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:founder@dynamu.ai"
                  className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2"
                >
                  Contact Team
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div
        className="w-full border-t relative z-10"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[13px] font-medium text-slate-300">
            © {new Date().getFullYear()} Dynamu AI. All rights reserved.
          </p>
          <span className="text-[11px] font-semibold tracking-widest text-slate-600 uppercase">
            Vertical AI · HoReCa · Bharat First
          </span>
        </div>
      </div>
    </footer>
  );
}
