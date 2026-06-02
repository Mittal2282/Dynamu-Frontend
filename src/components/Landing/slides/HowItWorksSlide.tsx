import React from 'react';
import { HOW_IT_WORKS_STEPS } from '../../../constants/landingContent';
import { Eyebrow } from '../Eyebrow';
import { Reveal } from '../Reveal';

const BG = '#0A0A0A';
const ACCENT = '#FF4D00';
const TITLE_COLOR = '#FFFFFF';
const DESC_COLOR = 'rgba(255,255,255,0.90)';
const MUTED_COLOR = 'rgba(255,255,255,0.70)';

const H2 = 'clamp(1.4rem, calc(3dvh + 1.8vw), 4.5rem)';
const CARD_NUM = 'clamp(1.6rem, calc(3.2dvh + 0.9vw), 3.25rem)';
const CARD_TITLE = 'clamp(1rem, calc(1.4dvh + 0.5vw), 1.25rem)';
const CARD_DESC = 'clamp(0.875rem, calc(1.1dvh + 0.35vw), 1.0625rem)';
const CARD_PAD = 'clamp(1.25rem, calc(2dvh + 0.6vw), 2.5rem)';
const EYEBROW_SIZE = 'clamp(0.72rem, calc(0.85dvh + 0.3vw), 0.9375rem)';
const PAD_TOP = 'clamp(4rem, calc(7dvh + 1vw), 7rem)';
const PAD_BOT = 'clamp(2rem, calc(4dvh + 0.5vw), 5rem)';

export function HowItWorksSlide() {
  return (
    <section
      id="how-it-works"
      className="h-full w-full flex flex-col justify-center shrink-0 overflow-hidden px-4 sm:px-6"
      style={{ background: BG, paddingTop: PAD_TOP, paddingBottom: PAD_BOT }}
    >
      <div
        className="max-w-6xl mx-auto w-full flex flex-col"
        style={{ gap: 0 }}
      >
        {/* Centered heading */}
        <Reveal>
          <div className="text-center">
            <Eyebrow light color={ACCENT}>How It Works</Eyebrow>
            <h2
              className="font-black leading-tight"
              style={{ fontSize: H2, color: TITLE_COLOR, margin: 'clamp(0.3rem, 0.6dvh, 0.8rem) 0 clamp(0.5rem, 1.2dvh, 1.25rem)' }}
            >
              From scan to upsell in 90 seconds
            </h2>
            <p
              className="font-semibold uppercase tracking-[0.2em]"
              style={{ fontSize: EYEBROW_SIZE, color: MUTED_COLOR, marginTop: 'clamp(0.4rem, 1dvh, 1rem)', marginBottom: 'clamp(1.5rem, calc(3.5dvh + 0.6vw), 4rem)' }}
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
                    borderTop: `3px solid ${ACCENT}`,
                    padding: CARD_PAD,
                    gap: 'clamp(0.5rem, calc(0.9dvh + 0.2vw), 1rem)',
                  }}
                >
                  <p className="font-black tabular-nums leading-none" style={{ fontSize: CARD_NUM, color: ACCENT }}>{step}</p>
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
                    <path d="M3 9h12M11 4.5L15.5 9 11 13.5" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
                  borderTop: `3px solid ${ACCENT}`,
                  padding: CARD_PAD,
                  gap: 'clamp(0.5rem, calc(0.9dvh + 0.2vw), 1rem)',
                }}
              >
                <p className="font-black tabular-nums leading-none" style={{ fontSize: CARD_NUM, color: ACCENT }}>{step}</p>
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
