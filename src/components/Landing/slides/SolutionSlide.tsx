import { BG, BG_DARK, ORANGE } from '../../../constants/landingConstants';
import { SOLUTION_BULLETS } from '../../../constants/landingContent';
import { Eyebrow } from '../Eyebrow';
import { H2 } from '../H2';
import { Reveal } from '../Reveal';
import { useLandingTheme } from '../../../context/LandingThemeContext';

export function SolutionSlide() {
  const { isDark } = useLandingTheme();
  const bg = isDark ? BG_DARK : BG;
  const bodyColor = isDark ? '#94a3b8' : '#6b7280';
  const labelColor = isDark ? '#f1f5f9' : '#111827';
  const descColor = isDark ? '#64748b' : '#9ca3af';
  const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  return (
    <section
      className="min-h-dvh w-full shrink-0 flex flex-col justify-center px-6 py-12 sm:py-16"
      style={{ background: bg }}
    >
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Reveal animation="revealLeft">
            <Eyebrow>The Solution</Eyebrow>
            <H2 className="mb-5">
              Dynamu — your AI
              <br />
              <span style={{ color: ORANGE }}>sales rep at every table</span>
            </H2>
            <p className="text-[15px] leading-relaxed mb-10" style={{ color: bodyColor }}>
              A conversational AI that greets every guest the moment they scan the QR code — guiding through the menu,
              recommending combos, upselling intelligently, and remembering preferences for future visits.
            </p>

            <div className="space-y-0 divide-y" style={{ borderColor: dividerColor }}>
              {SOLUTION_BULLETS.map(({ label, desc }, i) => (
                <Reveal key={label} animation="revealFade" delay={0.1 + i * 0.1}>
                  <div className="py-4 flex items-start gap-4">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.75" style={{ background: ORANGE }} />
                    <div>
                      <p className="font-semibold text-sm" style={{ color: labelColor }}>{label}</p>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: descColor }}>{desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Reveal animation="revealRight" delay={0.15}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-linear-to-r from-[#FF6B00] to-[#7B00FF] rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <img
                src={isDark ? "/images/DarkChatMode.jpeg" : "/images/LightChatMode.jpeg"} 
                alt="Dynamu AI Chat Interface"
                className="relative rounded-2xl shadow-2xl border border-black/10 w-full max-w-md lg:max-w-full mx-auto max-h-145 lg:max-h-160 object-cover object-top"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
