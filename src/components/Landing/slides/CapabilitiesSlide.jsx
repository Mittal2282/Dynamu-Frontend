import { CYAN, IMG, ORANGE, OVERLAY_CAPABILITIES, PURPLE } from '../../../constants/landingConstants';
import { CAPABILITY_ITEMS } from '../../../constants/landingContent';
import { Eyebrow } from '../Eyebrow';
import { H2 } from '../H2';
import { ParallaxSection } from '../ParallaxSection';
import { Reveal } from '../Reveal';

const COLOR_MAP = { orange: ORANGE, cyan: CYAN, purple: PURPLE };

export function CapabilitiesSlide() {
  return (
    <ParallaxSection
      disableParallax
      imageUrl={IMG.capabilities}
      overlay={OVERLAY_CAPABILITIES}
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
            <p className="text-slate-300 text-sm max-w-xs leading-relaxed sm:text-right">
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
                    background: 'rgba(10,12,16,0.78)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(14px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${color}40`;
                    e.currentTarget.style.background = 'rgba(10,12,16,0.88)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.background = 'rgba(10,12,16,0.78)';
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black shrink-0"
                    style={{ background: `${color}18`, color }}
                  >
                    {letter}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm mb-1.5">{label}</p>
                    <p className="text-slate-300 text-xs leading-relaxed">{desc}</p>
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
