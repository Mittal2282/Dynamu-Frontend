import { ORANGE } from '../../../constants/landingConstants';
import { PROBLEM_CARDS } from '../../../constants/landingContent';
import { Eyebrow } from '../Eyebrow';
import { Reveal } from '../Reveal';

const BG = '#0f172a';
const CARD_BG = 'rgba(255,255,255,0.05)';
const TITLE_COLOR = '#f1f5f9';
const DESC_COLOR = '#94a3b8';
const BODY_COLOR = '#64748b';

const H2 = 'clamp(1.2rem, calc(2.5dvh + 1.5vw), 4rem)';
const BODY = 'clamp(0.8rem, calc(1.1dvh + 0.4vw), 1rem)';
const CARD_NUM = 'clamp(1.25rem, calc(2.5dvh + 0.8vw), 2.5rem)';
const CARD_TITLE = 'clamp(0.75rem, calc(1dvh + 0.35vw), 0.9375rem)';
const CARD_DESC = 'clamp(0.65rem, calc(0.75dvh + 0.22vw), 0.8125rem)';
const CARD_PAD = 'clamp(0.7rem, calc(1.2dvh + 0.4vw), 1.5rem) clamp(0.75rem, calc(1.3dvh + 0.4vw), 1.5rem)';
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
            <Eyebrow light>The Problem</Eyebrow>
            <h2
              className="font-black leading-tight"
              style={{ fontSize: H2, color: TITLE_COLOR, margin: 'clamp(0.25rem, 0.5dvh, 0.75rem) 0 clamp(0.3rem, 0.7dvh, 1rem)' }}
            >
              Restaurants are losing revenue
              <br className="hidden sm:block" />
              <span style={{ color: ORANGE }}> because menus don&apos;t sell.</span>
            </h2>
            <p className="leading-relaxed max-w-2xl mx-auto" style={{ fontSize: BODY, color: BODY_COLOR }}>
              15M+ restaurants worldwide treat menus as static information sheets. The result:
              untapped upsells, overwhelmed staff, and customers who leave without spending
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
                  background: CARD_BG,
                  borderLeft: `3px solid ${ORANGE}`,
                  padding: CARD_PAD,
                  gap: 'clamp(0.2rem, 0.5dvh, 0.5rem)',
                }}
              >
                <p className="font-black tabular-nums leading-none" style={{ fontSize: CARD_NUM, color: ORANGE }}>{num}</p>
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
