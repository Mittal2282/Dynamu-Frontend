import React from 'react';
import { ORANGE } from '../../../constants/landingConstants';
import { HOW_IT_WORKS_STEPS } from '../../../constants/landingContent';
import { Eyebrow } from '../Eyebrow';
import { Reveal } from '../Reveal';

const BG = '#0f172a';
const CARD_BG = 'rgba(255,255,255,0.04)';
const TITLE_COLOR = '#f1f5f9';
const DESC_COLOR = '#94a3b8';
const MUTED_COLOR = '#64748b';

const H2 = 'clamp(1.2rem, calc(2.5dvh + 1.5vw), 4rem)';
const CARD_NUM = 'clamp(1.4rem, calc(2.8dvh + 0.8vw), 2.75rem)';
const CARD_TITLE = 'clamp(0.75rem, calc(1dvh + 0.35vw), 0.9375rem)';
const CARD_DESC = 'clamp(0.65rem, calc(0.75dvh + 0.22vw), 0.8125rem)';
const CARD_PAD = 'clamp(0.75rem, calc(1.3dvh + 0.4vw), 1.75rem)';
const EYEBROW_SIZE = 'clamp(0.55rem, calc(0.55dvh + 0.22vw), 0.6875rem)';
const PAD_TOP = 'clamp(3.5rem, calc(5dvh + 0.8vw), 6rem)';
const PAD_BOT = 'clamp(0.75rem, calc(1.2dvh + 0.2vw), 2.5rem)';

export function HowItWorksSlide() {
  return (
    <section
      id="how-it-works"
      className="h-full w-full flex flex-col justify-center shrink-0 overflow-hidden px-4 sm:px-6"
      style={{ background: BG, paddingTop: PAD_TOP, paddingBottom: PAD_BOT }}
    >
      <div
        className="max-w-6xl mx-auto w-full flex flex-col"
        style={{ gap: 'clamp(0.75rem, calc(1.5dvh + 0.4vw), 2.5rem)' }}
      >
        {/* Centered heading */}
        <Reveal>
          <div className="text-center">
            <Eyebrow light>How It Works</Eyebrow>
            <h2
              className="font-black leading-tight"
              style={{ fontSize: H2, color: TITLE_COLOR, margin: 'clamp(0.2rem, 0.5dvh, 0.75rem) 0 clamp(0.2rem, 0.4dvh, 0.5rem)' }}
            >
              From scan to upsell in 90 seconds
            </h2>
            <p
              className="font-semibold uppercase tracking-[0.2em]"
              style={{ fontSize: EYEBROW_SIZE, color: MUTED_COLOR }}
            >
              Zero App Download&nbsp;&nbsp;·&nbsp;&nbsp;Zero Staff Training
            </p>
          </div>
        </Reveal>

        {/* Desktop: flex row with orange arrows between cards */}
        <div className="hidden lg:flex items-stretch">
          {HOW_IT_WORKS_STEPS.map(({ step, title, desc }, i) => (
            <React.Fragment key={step}>
              <Reveal animation="revealUp" delay={i * 0.1} className="flex-1 min-w-0">
                <div
                  className="h-full flex flex-col"
                  style={{
                    background: CARD_BG,
                    borderTop: `3px solid ${ORANGE}`,
                    padding: CARD_PAD,
                    gap: 'clamp(0.25rem, calc(0.5dvh + 0.1vw), 0.6rem)',
                  }}
                >
                  <p className="font-black tabular-nums leading-none" style={{ fontSize: CARD_NUM, color: ORANGE }}>{step}</p>
                  <p className="font-bold" style={{ fontSize: CARD_TITLE, color: TITLE_COLOR }}>{title}</p>
                  <p className="leading-relaxed" style={{ fontSize: CARD_DESC, color: DESC_COLOR }}>{desc}</p>
                </div>
              </Reveal>

              {i < 3 && (
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 'clamp(1.5rem, calc(1.5dvh + 0.5vw), 2.5rem)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <path d="M3 9h12M11 4.5L15.5 9 11 13.5" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile / tablet: 2-col grid, no arrows */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:hidden"
          style={{ gap: 'clamp(0.4rem, calc(0.8dvh + 0.3vw), 1rem)' }}
        >
          {HOW_IT_WORKS_STEPS.map(({ step, title, desc }, i) => (
            <Reveal key={step} animation="revealUp" delay={i * 0.08}>
              <div
                className="h-full flex flex-col"
                style={{
                  background: CARD_BG,
                  borderTop: `3px solid ${ORANGE}`,
                  padding: CARD_PAD,
                  gap: 'clamp(0.2rem, 0.5dvh, 0.5rem)',
                }}
              >
                <p className="font-black tabular-nums leading-none" style={{ fontSize: CARD_NUM, color: ORANGE }}>{step}</p>
                <p className="font-bold" style={{ fontSize: CARD_TITLE, color: TITLE_COLOR }}>{title}</p>
                <p className="leading-relaxed" style={{ fontSize: CARD_DESC, color: DESC_COLOR }}>{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
