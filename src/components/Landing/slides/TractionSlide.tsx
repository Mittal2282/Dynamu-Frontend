import { BORDER, BORDER_DARK, CARD_BG, CARD_BG_DARK, IMG, ORANGE, OVERLAY_TRACTION, OVERLAY_TRACTION_DARK } from '../../../constants/landingConstants';
import { TRACTION_STATS } from '../../../constants/landingContent';
import { ParallaxSection } from '../ParallaxSection';
import { Reveal } from '../Reveal';
import { useLandingTheme } from '../../../context/LandingThemeContext';

export function TractionSlide() {
  const { isDark } = useLandingTheme();
  const cardBg = isDark ? CARD_BG_DARK : CARD_BG;
  const borderColor = isDark ? BORDER_DARK : BORDER;
  const headingColor = isDark ? '#f1f5f9' : '#111827';
  const bodyColor = isDark ? '#94a3b8' : '#6b7280';
  const labelColor = isDark ? '#cbd5e1' : '#4b5563';

  return (
    <ParallaxSection
      disableParallax
      imageUrl={IMG.traction}
      overlay={OVERLAY_TRACTION}
      overlayDark={OVERLAY_TRACTION_DARK}
      className="min-h-[100dvh] w-full flex flex-col justify-center py-12 sm:py-16 lg:py-20 shrink-0"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
          <div className="lg:col-span-2">
            <Reveal animation="revealLeft">
              <div className="inline-flex items-center gap-2 mb-5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Pilot Live</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold mb-4 leading-tight" style={{ color: headingColor }}>
                Heeralal Hotel,
                <br />
                Bikaner
              </p>
              <p className="text-[15px] leading-relaxed max-w-lg" style={{ color: bodyColor }}>
                First flagship deployment at one of Bikaner&apos;s most established dining destinations. Real tables. Real
                guests. Measurable revenue impact.
              </p>
            </Reveal>
          </div>

          <div className="flex flex-col gap-3">
            {TRACTION_STATS.map(({ label, value }, i) => (
              <Reveal key={label} animation="revealRight" delay={0.1 + i * 0.1}>
                <div
                  className="flex items-center justify-between px-5 py-4 rounded-xl"
                  style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <p className="text-xs" style={{ color: labelColor }}>{label}</p>
                  <p className="text-xs font-bold" style={{ color: ORANGE }}>
                    {value}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </ParallaxSection>
  );
}
