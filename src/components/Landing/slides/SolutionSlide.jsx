import { BG, ORANGE } from '../../../constants/landingConstants';
import { SOLUTION_BULLETS } from '../../../constants/landingContent';
import { Eyebrow } from '../Eyebrow';
import { H2 } from '../H2';
import { Reveal } from '../Reveal';

export function SolutionSlide() {
  return (
    <section
      className="min-h-[100dvh] w-full shrink-0 flex flex-col justify-center px-6 py-12 sm:py-16"
      style={{ background: BG }}
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
            <p className="text-slate-300 text-[15px] leading-relaxed mb-10">
              A conversational AI that greets every guest the moment they scan the QR code — guiding through the menu,
              recommending combos, upselling intelligently, and remembering preferences for future visits.
            </p>

            <div className="space-y-0 divide-y" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              {SOLUTION_BULLETS.map(({ label, desc }, i) => (
                <Reveal key={label} animation="revealFade" delay={0.1 + i * 0.1}>
                  <div className="py-4 flex items-start gap-4">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-[7px]" style={{ background: ORANGE }} />
                    <div>
                      <p className="font-semibold text-white text-sm">{label}</p>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Reveal animation="revealRight" delay={0.15}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6B00] to-[#7B00FF] rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <img 
                src="/images/DynamuChat.jpeg" 
                alt="Dynamu AI Chat Interface" 
                className="relative rounded-2xl shadow-2xl border border-white/10 w-full max-w-md lg:max-w-full mx-auto max-h-[580px] lg:max-h-[640px] object-cover object-top"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
