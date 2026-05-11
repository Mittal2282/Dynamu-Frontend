import { BG, BORDER, IMG, ORANGE, OVERLAY_HOW_IT_WORKS } from '../../../constants/landingConstants';
import { HOW_IT_WORKS_STEPS } from '../../../constants/landingContent';
import { Eyebrow } from '../Eyebrow';
import { H2 } from '../H2';
import { ParallaxSection } from '../ParallaxSection';
import { Reveal } from '../Reveal';

export function HowItWorksSlide() {
  return (
    <ParallaxSection
      id="how-it-works"
      disableParallax
      imageUrl={IMG.howItWorks}
      overlay={OVERLAY_HOW_IT_WORKS}
      className="min-h-[100dvh] w-full flex flex-col justify-center py-12 sm:py-16 lg:py-20 shrink-0"
    >
      <div className="max-w-6xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-16">
            <Eyebrow light>How It Works</Eyebrow>
            <H2>From scan to upsell in 90 seconds</H2>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] mt-3 text-slate-300">
              Zero App Download &nbsp;·&nbsp; Zero Staff Training
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {HOW_IT_WORKS_STEPS.map(({ step, title, desc }, i) => (
            <Reveal key={step} animation="revealUp" delay={i * 0.14}>
              <div
                className="relative h-full p-6 rounded-xl"
                style={{
                  background: 'rgba(10,12,16,0.78)',
                  border: `1px solid ${BORDER}`,
                  backdropFilter: 'blur(14px)',
                }}
              >
                {i < 3 && (
                  <div
                    className="hidden lg:flex absolute -right-3.5 top-8 z-10 w-6 h-6 rounded-full items-center justify-center"
                    style={{ background: BG, border: `1px solid ${BORDER}` }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5h6M6 2.5L8.5 5 6 7.5"
                        stroke="#64748b"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
                <p className="text-[42px] font-black tabular-nums mb-4 leading-none" style={{ color: ORANGE, opacity: 0.55 }}>
                  {step}
                </p>
                <p className="font-bold text-white text-sm mb-2">{title}</p>
                <p className="text-slate-300 text-xs leading-relaxed">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </ParallaxSection>
  );
}
