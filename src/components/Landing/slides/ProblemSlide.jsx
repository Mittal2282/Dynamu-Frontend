import { BORDER, IMG, ORANGE, OVERLAY_PROBLEM } from '../../../constants/landingConstants';
import { PROBLEM_CARDS } from '../../../constants/landingContent';
import { Eyebrow } from '../Eyebrow';
import { H2 } from '../H2';
import { ParallaxSection } from '../ParallaxSection';
import { Reveal } from '../Reveal';

export function ProblemSlide() {
  return (
    <ParallaxSection
      disableParallax
      imageUrl={IMG.problem}
      overlay={OVERLAY_PROBLEM}
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
            <p className="text-slate-300 mt-5 text-[15px] leading-relaxed">
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
                  background: 'rgba(10,12,16,0.78)',
                  border: `1px solid ${BORDER}`,
                  backdropFilter: 'blur(12px)',
                }}
              >
                <p className="text-[36px] font-black tabular-nums mb-4 leading-none" style={{ color: ORANGE, opacity: 0.5 }}>
                  {num}
                </p>
                <p className="font-semibold text-white text-sm mb-2 leading-snug">{title}</p>
                <p className="text-slate-300 text-xs leading-relaxed">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </ParallaxSection>
  );
}
