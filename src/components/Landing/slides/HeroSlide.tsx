import React from 'react';
import { HOW_IT_WORKS_SLIDE_INDEX, ORANGE } from '../../../constants/landingConstants';
import { HERO_STATS } from '../../../constants/landingContent';

const BG = '#ffffff';
const TEXT_DARK = '#111827';
const TEXT_MUTED = '#6b7280';

// calc(dvh + vw) so sizes grow with both viewport dimensions — no compression on wide desktops
const H1 = 'clamp(1.75rem, calc(4dvh + 2.5vw), 5rem)';
const BODY = 'clamp(0.82rem, calc(1.2dvh + 0.4vw), 1.0625rem)';
const BADGE = 'clamp(0.6rem, calc(0.6dvh + 0.3vw), 0.75rem)';
const STAT_VAL = 'clamp(1.1rem, calc(2.5dvh + 0.8vw), 1.875rem)';
const STAT_LBL = 'clamp(0.65rem, calc(0.7dvh + 0.3vw), 0.8125rem)';
const BTN_TEXT = 'clamp(0.75rem, calc(1dvh + 0.35vw), 0.9375rem)';
const BTN_PAD = 'clamp(0.4rem, calc(0.8dvh + 0.15vw), 0.875rem) clamp(0.75rem, calc(1.5dvh + 0.5vw), 1.75rem)';
const PAD_TOP = 'clamp(3.5rem, calc(5dvh + 0.8vw), 6rem)';
const PAD_BOT = 'clamp(0.5rem, calc(1.2dvh + 0.2vw), 2rem)';
const GAP = 'clamp(0.5rem, calc(1.2dvh + 0.2vw), 1.5rem)';

export interface HeroSlideProps {
  activeIndex: number;
  stepSlide: (delta: number) => void;
  goToSlide: (index: number) => void;
}

export function HeroSlide({ activeIndex, stepSlide, goToSlide }: HeroSlideProps) {
  return (
    <section
      className="h-full w-full flex flex-col shrink-0 overflow-hidden"
      style={{ background: BG, color: TEXT_DARK }}
    >
      <div
        className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 min-h-0"
        style={{ paddingTop: PAD_TOP, paddingBottom: PAD_BOT, gap: GAP }}
      >
        {/* Eyebrow badge */}
        <div
          className="hero-badge inline-flex items-center px-3 py-1 font-bold uppercase tracking-[0.18em] shrink-0"
          style={{ color: ORANGE, border: `1.5px solid ${ORANGE}`, fontSize: BADGE }}
        >
          AI-Native Restaurant Platform
        </div>

        {/* Heading */}
        <h1
          className="hero-title font-black leading-[1.05] tracking-tight max-w-3xl shrink-0"
          style={{ fontSize: H1, color: TEXT_DARK }}
        >
          The AI Revenue Engine
          <br />
          <span style={{ color: ORANGE }}>for Restaurants.</span>
        </h1>

        {/* Description */}
        <p
          className="hero-sub leading-relaxed max-w-xl sm:max-w-2xl shrink-0"
          style={{ fontSize: BODY, color: TEXT_MUTED }}
        >
          An AI-native ordering layer that turns every restaurant menu into a conversational
          sales representative. It recommends, upsells, and remembers, all on autopilot.
        </p>

        {/* Buttons */}
        <div
          className="hero-cta flex flex-row items-center justify-center w-full shrink-0 flex-wrap"
          style={{ gap: 'clamp(0.6rem, calc(1dvh + 0.3vw), 1rem)', paddingTop: 'clamp(0.75rem, 2dvh, 1.5rem)', paddingBottom: 'clamp(2rem, 5dvh, 3rem)' }}
        >
          <a
            href="mailto:founder@dynamu.ai"
            className="inline-flex items-center gap-2 font-semibold text-white w-auto justify-center flex-1 sm:flex-none"
            style={{
              background: ORANGE,
              borderRadius: '6px',
              fontSize: BTN_TEXT,
              padding: BTN_PAD,
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Request a Demo
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <button
            type="button"
            onClick={() => goToSlide(HOW_IT_WORKS_SLIDE_INDEX)}
            className="inline-flex items-center gap-2 font-semibold w-auto justify-center flex-1 sm:flex-none"
            style={{
              background: 'transparent',
              border: '2px solid #111827',
              borderRadius: '6px',
              color: TEXT_DARK,
              fontSize: BTN_TEXT,
              padding: BTN_PAD,
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            See How It Works
          </button>
        </div>

        {/* Stats */}
        <div className="hero-stats w-full max-w-xl sm:max-w-2xl shrink-0">
          {/* Mobile 2×2 grid */}
          <div className="grid grid-cols-2 sm:hidden" style={{ gap: 'clamp(0.75rem, 1.5dvh, 1.5rem)' }}>
            {HERO_STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div style={{ width: '100%', height: '3px', background: TEXT_DARK, marginBottom: '0.4rem' }} />
                <p className="font-black tabular-nums" style={{ fontSize: STAT_VAL, color: TEXT_DARK }}>{value}</p>
                <p className="font-normal leading-tight" style={{ fontSize: STAT_LBL, color: TEXT_MUTED, marginTop: '0.2rem' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* sm+ single row */}
          <div className="hidden sm:flex items-start" style={{ gap: 'clamp(1.5rem, 3dvh, 2.5rem)' }}>
            {HERO_STATS.map(({ value, label }) => (
              <div key={label} className="text-center flex-1">
                <div style={{ width: '100%', height: '3px', background: TEXT_DARK, marginBottom: '0.5rem' }} />
                <p className="font-black tabular-nums" style={{ fontSize: STAT_VAL, color: TEXT_DARK }}>{value}</p>
                <p className="font-normal" style={{ fontSize: STAT_LBL, color: TEXT_MUTED, marginTop: '0.25rem' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {activeIndex === 0 && (
        <button
          type="button"
          onClick={() => stepSlide(1)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 scroll-indicator pointer-events-auto cursor-pointer bg-transparent border-0 p-2"
          aria-label="Next section"
          style={{ color: TEXT_MUTED }}
        >
          <span style={{ fontSize: '0.5625rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Scroll</span>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </section>
  );
}
