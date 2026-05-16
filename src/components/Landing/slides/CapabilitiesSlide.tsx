import { CARD_BG, CARD_BG_DARK, CARD_BG_DARK_HOVER, CARD_BG_HOVER, CYAN, IMG, ORANGE, OVERLAY_CAPABILITIES, OVERLAY_CAPABILITIES_DARK, PURPLE } from '../../../constants/landingConstants';
import { CAPABILITY_ITEMS } from '../../../constants/landingContent';
import { Eyebrow } from '../Eyebrow';
import { H2 } from '../H2';
import { ParallaxSection } from '../ParallaxSection';
import { Reveal } from '../Reveal';
import { useLandingTheme } from '../../../context/LandingThemeContext';

const COLOR_MAP: Record<string, string> = { orange: ORANGE, cyan: CYAN, purple: PURPLE };

export function CapabilitiesSlide() {
  const { isDark } = useLandingTheme();
  const cardBg = isDark ? CARD_BG_DARK : CARD_BG;
  const cardBgHover = isDark ? CARD_BG_DARK_HOVER : CARD_BG_HOVER;
  const borderColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
  const titleColor = isDark ? '#f1f5f9' : '#111827';
  const descColor = isDark ? '#cbd5e1' : '#4b5563';
  const subColor = isDark ? '#94a3b8' : '#6b7280';

  return (
    <ParallaxSection
      disableParallax
      imageUrl={IMG.capabilities}
      overlay={OVERLAY_CAPABILITIES}
      overlayDark={OVERLAY_CAPABILITIES_DARK}
      className="min-h-[100dvh] w-full flex flex-col justify-center py-12 sm:py-16 lg:py-20 shrink-0"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <Reveal animation="revealLeft">
            <Eyebrow light>Product Capabilities</Eyebrow>
            <H2>
              A complete revenue layer
              <br />
              for the modern restaurant
            </H2>
          </Reveal>
          <Reveal animation="revealRight" delay={0.1}>
            <p className="text-sm max-w-xs leading-relaxed sm:text-right" style={{ color: subColor }}>
              Six capabilities. One unified platform.
              <br />
              No new hardware required.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPABILITY_ITEMS.map(({ letter, label, desc, colorKey }, i) => {
            const color = COLOR_MAP[colorKey];
            return (
              <Reveal key={label} animation="revealScale" delay={i * 0.09}>
                <div
                  className="group h-full flex items-start gap-4 p-6 rounded-xl transition-all duration-300 cursor-default"
                  style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                    backdropFilter: 'blur(14px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${color}40`;
                    e.currentTarget.style.background = cardBgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = borderColor;
                    e.currentTarget.style.background = cardBg;
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black shrink-0"
                    style={{ background: `${color}18`, color }}
                  >
                    {letter}
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1.5" style={{ color: titleColor }}>{label}</p>
                    <p className="text-xs leading-relaxed" style={{ color: descColor }}>{desc}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </ParallaxSection>
  );
}
