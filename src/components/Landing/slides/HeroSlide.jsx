import {
  HERO_TEXT_SHADOW,
  HOW_IT_WORKS_SLIDE_INDEX,
  IMG,
  ORANGE,
  OVERLAY_HERO,
} from '../../../constants/landingConstants';
import { HERO_STATS } from '../../../constants/landingContent';

export function HeroSlide({ activeIndex, stepSlide, goToSlide }) {
  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden flex flex-col shrink-0">
      <img
        src={IMG.hero}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      />
      <div className="absolute inset-0" style={{ background: OVERLAY_HERO }} />
      <div
        className="absolute inset-0 pointer-events-none glow-drift"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 38%, rgba(255,107,0,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 h-16 w-full shrink-0 pointer-events-none" aria-hidden />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-6 py-20 w-full max-w-5xl mx-auto rounded-3xl sm:bg-black/20 sm:backdrop-blur-[2px] sm:px-8 sm:py-6">
        <h1 className="hero-title text-5xl sm:text-6xl lg:text-[76px] font-black leading-[1.03] tracking-tight mb-7 max-w-4xl">
          <span className="text-white" style={{ textShadow: HERO_TEXT_SHADOW }}>
            The AI Revenue
          </span>
          <br />
          <span
            className="inline-block"
            style={{
              background: `linear-gradient(92deg, ${ORANGE} 0%, #FF9F45 55%, ${ORANGE} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.85))',
            }}
          >
            Engine for Restaurants
          </span>
        </h1>

        <p
          className="hero-sub text-lg sm:text-xl leading-relaxed max-w-2xl mb-11 text-slate-100"
          style={{ textShadow: HERO_TEXT_SHADOW }}
        >
          An AI-native ordering layer that turns every restaurant menu into a conversational sales representative —
          recommending, upselling, and remembering. On autopilot.
        </p>

        <div className="hero-stats flex flex-wrap justify-center gap-3 mb-10">
          {HERO_STATS.map(({ value, label }) => (
            <div
              key={label}
              className="px-6 py-3.5 rounded-xl text-center"
              style={{
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <p className="text-[22px] font-black tabular-nums" style={{ color: ORANGE }}>
                {value}
              </p>
              <p className="text-[11px] mt-0.5 font-medium text-slate-200">{label}</p>
            </div>
          ))}
        </div>

        <div className="hero-cta flex flex-wrap justify-center gap-3">
          <a
            href="mailto:founder@dynamu.ai"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: ORANGE, boxShadow: '0 0 32px rgba(255,107,0,0.4)' }}
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
          <button
            type="button"
            onClick={() => goToSlide(HOW_IT_WORKS_SLIDE_INDEX)}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-semibold text-sm transition-all hover:bg-white/10"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.22)',
              color: '#f1f5f9',
              backdropFilter: 'blur(8px)',
              textShadow: HERO_TEXT_SHADOW,
            }}
          >
            See How It Works
          </button>
        </div>
      </div>

      {activeIndex === 0 && (
        <button
          type="button"
          onClick={() => stepSlide(1)}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 scroll-indicator pointer-events-auto cursor-pointer bg-transparent border-0 p-2 rounded-xl hover:opacity-95"
          style={{ textShadow: HERO_TEXT_SHADOW }}
          aria-label="Next section"
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/90">Next</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
          >
            <path
              d="M3 6l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </section>
  );
}
