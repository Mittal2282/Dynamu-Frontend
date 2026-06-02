import { PROBLEM_CARDS } from '../../../constants/landingContent';
import { Eyebrow } from '../Eyebrow';
import { Reveal } from '../Reveal';

const BG = '#0A0A0A';
const ACCENT = '#FF4D00';
const TITLE_COLOR = '#FFFFFF';
const DESC_COLOR = 'rgba(255,255,255,0.70)';
const BODY_COLOR = 'rgba(255,255,255,0.78)';

const H2 = 'clamp(1.2rem, calc(2.5dvh + 1.5vw), 4rem)';
const BODY = 'clamp(0.9rem, calc(1.3dvh + 0.5vw), 1.125rem)';
const CARD_NUM = 'clamp(0.875rem, calc(1dvh + 0.35vw), 1.0625rem)';
const CARD_TITLE = 'clamp(0.9rem, calc(1.2dvh + 0.4vw), 1.125rem)';
const CARD_DESC = 'clamp(0.78rem, calc(0.95dvh + 0.28vw), 0.9375rem)';
const CARD_PAD = 'clamp(1rem, calc(1.6dvh + 0.5vw), 2rem)';
const PAD_TOP = 'clamp(3.5rem, calc(5dvh + 0.8vw), 6rem)';
const PAD_BOT = 'clamp(0.75rem, calc(1.2dvh + 0.2vw), 2.5rem)';

export function ProblemSlide() {
  return (
    <section
      className="h-full w-full flex flex-col justify-center shrink-0 overflow-hidden px-4 sm:px-6"
      style={{ background: BG, paddingTop: PAD_TOP, paddingBottom: PAD_BOT }}
    >
      <div
        className="max-w-6xl mx-auto w-full flex flex-col"
        style={{ gap: 'clamp(0.75rem, calc(1.5dvh + 0.4vw), 2.5rem)' }}
      >
        {/* Centered heading */}
        <Reveal animation="revealUp">
          <div className="text-center">
            <Eyebrow light color={ACCENT}>The Problem</Eyebrow>
            <h2
              className="font-black leading-tight"
              style={{ fontSize: H2, color: TITLE_COLOR, margin: 'clamp(0.25rem, 0.5dvh, 0.75rem) 0 clamp(0.75rem, 2dvh, 2.5rem)' }}
            >
              Restaurants are losing revenue
              <span style={{ color: ACCENT }}> because</span>
              <br />
              <span style={{ color: ACCENT }}>menus don&apos;t sell.</span>
            </h2>
            <p className="leading-relaxed max-w-2xl mx-auto" style={{ fontSize: BODY, color: BODY_COLOR, marginBottom: 'clamp(0.75rem, 2dvh, 2.5rem)' }}>
              More than 15 million restaurants worldwide treat menus as static information sheets. The
              result is untapped upsells, overwhelmed staff, and customers who leave without spending
              their full potential.
            </p>
          </div>
        </Reveal>

        {/* Cards — orange left border */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ gap: 'clamp(0.4rem, calc(0.8dvh + 0.3vw), 1rem)' }}
        >
          {PROBLEM_CARDS.map(({ num, title, desc }, i) => (
            <Reveal key={num} animation="revealScale" delay={i * 0.08}>
              <div
                className="h-full flex flex-col"
                style={{
                  borderLeft: `3px solid ${ACCENT}`,
                  padding: CARD_PAD,
                  gap: 'clamp(0.4rem, 0.9dvh, 0.9rem)',
                }}
              >
                <p className="font-bold tabular-nums leading-none" style={{ fontSize: CARD_NUM, color: TITLE_COLOR }}>{num}</p>
                <p className="font-semibold leading-snug" style={{ fontSize: CARD_TITLE, color: TITLE_COLOR }}>{title}</p>
                <p className="leading-relaxed" style={{ fontSize: CARD_DESC, color: DESC_COLOR }}>{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
