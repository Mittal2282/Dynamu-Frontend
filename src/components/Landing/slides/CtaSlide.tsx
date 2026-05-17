import { IMG, ORANGE, OVERLAY_CTA, OVERLAY_CTA_DARK } from '../../../constants/landingConstants';
import { Eyebrow } from '../Eyebrow';
import { H2 } from '../H2';
import { ParallaxSection } from '../ParallaxSection';
import { Reveal } from '../Reveal';
import { useLandingTheme } from '../../../context/LandingThemeContext';

export function CtaSlide() {
  const { isDark } = useLandingTheme();
  const bodyColor = isDark ? '#94a3b8' : '#6b7280';
  const secondaryBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const secondaryBorder = isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.15)';
  const secondaryColor = isDark ? '#e2e8f0' : '#374151';

  return (
    <ParallaxSection
      disableParallax
      imageUrl={IMG.cta}
      overlay={OVERLAY_CTA}
      overlayDark={OVERLAY_CTA_DARK}
      className="min-h-dvh w-full shrink-0 flex flex-col justify-center py-12 sm:py-20"
    >
      <div className="max-w-3xl mx-auto px-6 text-center w-full">
        <Reveal animation="revealFade">
          <Eyebrow light>Get in Touch</Eyebrow>
        </Reveal>
        <Reveal animation="revealUp" delay={0.1}>
          <H2 className="mb-5">
            Ready to turn your menu
            <br />
            into a <span style={{ color: ORANGE }}>revenue engine?</span>
          </H2>
        </Reveal>
        <Reveal animation="revealUp" delay={0.22}>
          <p className="text-[15px] leading-relaxed mb-10" style={{ color: bodyColor }}>
            Schedule a demo or reach out directly. Your AI waiter can be live within 24 hours of onboarding.
          </p>
        </Reveal>
        <Reveal animation="revealScale" delay={0.32}>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="https://calendly.com/arorabhavyam"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: ORANGE, boxShadow: '0 0 36px rgba(255,107,0,0.38)' }}
            >
              Request a Demo
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 7h10M8 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a
              href="mailto:founder@dynamu.ai"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-sm transition-all"
              style={{
                background: secondaryBg,
                border: secondaryBorder,
                color: secondaryColor,
                backdropFilter: 'blur(8px)',
              }}
            >
              Contact Team
            </a>
          </div>
        </Reveal>
      </div>
    </ParallaxSection>
  );
}
