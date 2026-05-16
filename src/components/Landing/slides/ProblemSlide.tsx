import { BORDER, BORDER_DARK, CARD_BG, CARD_BG_DARK, IMG, ORANGE, OVERLAY_PROBLEM, OVERLAY_PROBLEM_DARK } from '../../../constants/landingConstants';
import { PROBLEM_CARDS } from '../../../constants/landingContent';
import { Eyebrow } from '../Eyebrow';
import { H2 } from '../H2';
import { ParallaxSection } from '../ParallaxSection';
import { Reveal } from '../Reveal';
import { useLandingTheme } from '../../../context/LandingThemeContext';

export function ProblemSlide() {
  const { isDark } = useLandingTheme();
  const cardBg = isDark ? CARD_BG_DARK : CARD_BG;
  const borderColor = isDark ? BORDER_DARK : BORDER;
  const titleColor = isDark ? '#f1f5f9' : '#111827';
  const descColor = isDark ? '#cbd5e1' : '#4b5563';
  const bodyColor = isDark ? '#94a3b8' : '#6b7280';

  return (
    <ParallaxSection
      disableParallax
      imageUrl={IMG.problem}
      overlay={OVERLAY_PROBLEM}
      overlayDark={OVERLAY_PROBLEM_DARK}
      className="min-h-[100dvh] w-full flex flex-col justify-center py-12 sm:py-16 lg:py-20 shrink-0"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <Reveal animation="revealLeft">
            <Eyebrow light>The Problem</Eyebrow>
            <H2>
              Restaurants are losing revenue
              <br />
              <span style={{ color: ORANGE }}>because menus don&apos;t sell.</span>
            </H2>
            <p className="mt-5 text-[15px] leading-relaxed" style={{ color: bodyColor }}>
              15M+ restaurants worldwide treat menus as static information sheets. The result: untapped upsells,
              overwhelmed staff, and customers who leave without spending their full potential.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROBLEM_CARDS.map(({ num, title, desc }, i) => (
            <Reveal key={num} animation="revealScale" delay={i * 0.12}>
              <div
                className="h-full p-6 rounded-xl"
                style={{
                  background: cardBg,
                  border: `1px solid ${borderColor}`,
                  backdropFilter: 'blur(12px)',
                }}
              >
                <p className="text-[36px] font-black tabular-nums mb-4 leading-none" style={{ color: ORANGE, opacity: 0.5 }}>
                  {num}
                </p>
                <p className="font-semibold text-sm mb-2 leading-snug" style={{ color: titleColor }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: descColor }}>{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </ParallaxSection>
  );
}
