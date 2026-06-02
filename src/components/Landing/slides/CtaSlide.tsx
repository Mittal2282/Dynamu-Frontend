import { ORANGE } from '../../../constants/landingConstants';
import DynamuLogo from '../../../assets/DynamuLogo.png';
import { Eyebrow } from '../Eyebrow';
import { Reveal } from '../Reveal';

const BG = '#0A0A0A';
const ACCENT = '#FF4D00';
const TITLE_COLOR = '#FFFFFF';
const BODY_COLOR = 'rgba(255,255,255,0.65)';
const FOOTER_BG = '#FFFFFF';
const FOOTER_TEXT = '#111827';
const FOOTER_MUTED = '#9ca3af';
const FOOTER_BORDER = 'rgba(0,0,0,0.08)';

const H2 = 'clamp(1.25rem, calc(3dvh + 1.5vw), 4rem)';
const BODY = 'clamp(0.8rem, calc(1.1dvh + 0.38vw), 1.0625rem)';
const BTN_TEXT = 'clamp(0.78rem, calc(1dvh + 0.35vw), 0.9375rem)';
const BTN_PAD = 'clamp(0.6rem, calc(1.1dvh + 0.2vw), 0.9375rem) clamp(1.5rem, calc(2dvh + 0.8vw), 2.25rem)';
const PAD_TOP = 'clamp(3.5rem, calc(5dvh + 0.8vw), 6rem)';
const PAD_BOT = 'clamp(0.75rem, calc(1.2dvh + 0.2vw), 2rem)';
const GAP = 'clamp(0.6rem, calc(1.2dvh + 0.3vw), 1.75rem)';

export function CtaSlide() {
  return (
    <section
      className="h-full w-full shrink-0 flex flex-col overflow-hidden"
      style={{ background: BG }}
    >
      {/* Main CTA */}
      <div
        className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 min-h-0"
        style={{ paddingTop: PAD_TOP, paddingBottom: PAD_BOT, gap: GAP }}
      >
        <Reveal animation="revealFade">
          <Eyebrow light color={ACCENT}>Get Started</Eyebrow>
        </Reveal>

        <Reveal animation="revealUp" delay={0.1}>
          <h2
            className="font-black leading-tight max-w-2xl"
            style={{ fontSize: H2, color: TITLE_COLOR }}
          >
            Ready to turn your menu
            <br />
            into a <span style={{ color: ACCENT }}>revenue engine?</span>
          </h2>
        </Reveal>

        <Reveal animation="revealUp" delay={0.18}>
          <p className="leading-relaxed max-w-md sm:max-w-lg" style={{ fontSize: BODY, color: BODY_COLOR }}>
            Schedule a demo or reach out directly. Your AI waiter can be live
            within 24 hours of onboarding.
          </p>
        </Reveal>

        <Reveal animation="revealScale" delay={0.28}>
          <a
            href="https://calendly.com/arorabhavyam"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: ACCENT, boxShadow: '0 0 32px rgba(255,77,0,0.35)', fontSize: BTN_TEXT, padding: BTN_PAD }}
          >
            Request a Demo
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </Reveal>
      </div>

      {/* Footer — same height as nav (h-14 sm:h-16 = 56px / 64px) */}
      <div
        className="w-full border-t shrink-0"
        style={{ background: FOOTER_BG, borderColor: FOOTER_BORDER }}
      >
        <div
          className="max-w-full px-6 sm:px-10 h-14 sm:h-16 flex flex-row items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <img
              src={DynamuLogo}
              alt="DynamuAI"
              className="h-8 w-auto object-contain rounded-full"
            />
            <span
              className="font-bold"
              style={{ fontSize: 'clamp(0.75rem, calc(1dvh + 0.3vw), 0.9375rem)', color: FOOTER_TEXT }}
            >
              Dynamu<span style={{ color: ORANGE }}>.AI</span>
            </span>
          </div>
          <p style={{ fontSize: 'clamp(0.6rem, calc(0.8dvh + 0.15vw), 0.75rem)', color: FOOTER_MUTED }}>
            © {new Date().getFullYear()} Dynamu AI. All rights reserved.
          </p>
        </div>
      </div>
    </section>
  );
}
