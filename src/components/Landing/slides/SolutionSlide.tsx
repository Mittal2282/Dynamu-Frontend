import { ORANGE } from '../../../constants/landingConstants';
import { SOLUTION_BULLETS } from '../../../constants/landingContent';
import { Eyebrow } from '../Eyebrow';
import { Reveal } from '../Reveal';

const BG = '#F5F7FA';
const TEXT_DARK = '#111827';
const TEXT_MUTED = '#6b7280';
const DIVIDER = 'rgba(0,0,0,0.08)';

const H2 = 'clamp(1.2rem, calc(2.5dvh + 1.3vw), 3.5rem)';
const BODY = 'clamp(0.8rem, calc(1.1dvh + 0.38vw), 1rem)';
const BLT_LABEL = 'clamp(0.75rem, calc(1dvh + 0.35vw), 0.9375rem)';
const BLT_DESC = 'clamp(0.65rem, calc(0.75dvh + 0.22vw), 0.8125rem)';
const PAD_TOP = 'clamp(3.5rem, calc(5dvh + 0.8vw), 6rem)';
const PAD_BOT = 'clamp(0.75rem, calc(1.2dvh + 0.2vw), 2.5rem)';

export function SolutionSlide() {
  return (
    <section
      className="h-full w-full shrink-0 flex flex-col justify-center overflow-hidden px-4 sm:px-6"
      style={{ background: BG, paddingTop: PAD_TOP, paddingBottom: PAD_BOT }}
    >
      <div className="max-w-6xl mx-auto w-full h-full flex items-center">
        <div
          className="grid grid-cols-1 lg:grid-cols-2 w-full"
          style={{ gap: 'clamp(1rem, calc(2.5dvh + 1vw), 4.5rem)', alignItems: 'center' }}
        >
          {/* Text column */}
          <Reveal animation="revealLeft">
            <div className="flex flex-col" style={{ gap: 'clamp(0.4rem, calc(0.8dvh + 0.2vw), 1rem)' }}>
              <Eyebrow>The Solution</Eyebrow>
              <h2
                className="font-black leading-tight"
                style={{ fontSize: H2, color: TEXT_DARK }}
              >
                Dynamu, your AI
                <br />
                <span style={{ color: ORANGE }}>sales rep at every table</span>
              </h2>
              <p className="leading-relaxed" style={{ fontSize: BODY, color: TEXT_MUTED }}>
                A conversational AI that greets every guest the moment they scan the QR code —
                guiding through the menu, recommending combos, upselling intelligently, and
                remembering preferences for future visits.
              </p>

              <div
                className="flex flex-col divide-y"
                style={{ borderColor: DIVIDER, marginTop: 'clamp(0.2rem, 0.5dvh, 0.5rem)' }}
              >
                {SOLUTION_BULLETS.map(({ label, desc }, i) => (
                  <Reveal key={label} animation="revealFade" delay={0.08 + i * 0.08}>
                    <div
                      className="flex items-start"
                      style={{
                        gap: 'clamp(0.5rem, calc(0.8dvh + 0.3vw), 1rem)',
                        padding: 'clamp(0.3rem, calc(0.7dvh + 0.15vw), 0.875rem) 0',
                      }}
                    >
                      {/* Square bullet */}
                      <div
                        className="shrink-0"
                        style={{
                          width: 'clamp(0.4rem, calc(0.65dvh + 0.15vw), 0.5rem)',
                          height: 'clamp(0.4rem, calc(0.65dvh + 0.15vw), 0.5rem)',
                          background: ORANGE,
                          marginTop: '0.3em',
                        }}
                      />
                      <div>
                        <p className="font-semibold" style={{ fontSize: BLT_LABEL, color: TEXT_DARK }}>{label}</p>
                        <p className="leading-relaxed" style={{ fontSize: BLT_DESC, color: TEXT_MUTED, marginTop: '0.1em' }}>{desc}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Image column — light mode only, constrained height */}
          <Reveal animation="revealRight" delay={0.12} className="hidden lg:block">
            <div className="relative group">
              <div
                className="absolute -inset-1 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"
                style={{ background: `linear-gradient(to right, ${ORANGE}, #7B00FF)` }}
              />
              <img
                src="/images/LightChatMode.jpeg"
                alt="Dynamu AI Chat Interface"
                className="relative rounded-2xl shadow-xl border border-black/10 w-full mx-auto object-cover object-top"
                style={{ maxHeight: 'clamp(14rem, calc(40dvh + 5vw), 38rem)' }}
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
