import { BORDER, BORDER_DARK, CARD_BG, CARD_BG_DARK, IMG, ORANGE, OVERLAY_HOW_IT_WORKS, OVERLAY_HOW_IT_WORKS_DARK } from '../../../constants/landingConstants';
import { HOW_IT_WORKS_STEPS } from '../../../constants/landingContent';
import { Eyebrow } from '../Eyebrow';
import { H2 } from '../H2';
import { ParallaxSection } from '../ParallaxSection';
import { Reveal } from '../Reveal';
import { useLandingTheme } from '../../../context/LandingThemeContext';

export function HowItWorksSlide() {
  const { isDark } = useLandingTheme();
  const cardBg = isDark ? CARD_BG_DARK : CARD_BG;
  const borderColor = isDark ? BORDER_DARK : BORDER;
  const circleArrowBg = isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)';
  const arrowColor = isDark ? '#cbd5e1' : '#3f4652';

  return (
    <ParallaxSection
      id="how-it-works"
      disableParallax
      imageUrl={IMG.howItWorks}
      overlay={OVERLAY_HOW_IT_WORKS}
      overlayDark={OVERLAY_HOW_IT_WORKS_DARK}
      className="min-h-dvh w-full flex flex-col justify-center py-12 sm:py-16 lg:py-20 shrink-0"
    >
      <div className="max-w-6xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-16">
            <Eyebrow light>How It Works</Eyebrow>
            <H2>From scan to upsell in 90 seconds</H2>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] mt-3" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>
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
                  background: cardBg,
                  border: `1px solid ${borderColor}`,
                  backdropFilter: 'blur(14px)',
                }}
              >
                {i < 3 && (
                  <div
                    className="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full items-center justify-center shadow-sm"
                    style={{
                      background: circleArrowBg,
                      border: `1.5px solid ${borderColor}`,
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5h6M6 2.5L8.5 5 6 7.5"
                        stroke={arrowColor}
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
                <p className="font-bold text-sm mb-2" style={{ color: isDark ? '#f1f5f9' : '#111827' }}>
                  {title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: isDark ? '#cbd5e1' : '#4b5563' }}>
                  {desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </ParallaxSection>
  );
}
