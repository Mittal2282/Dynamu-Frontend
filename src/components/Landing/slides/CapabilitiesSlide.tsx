import { ORANGE } from '../../../constants/landingConstants';
import { CAPABILITY_ITEMS } from '../../../constants/landingContent';
import { Eyebrow } from '../Eyebrow';
import { Reveal } from '../Reveal';

const BG = '#FFFFFF';
const CARD_BG = '#FFFFFF';
const CARD_TITLE = '#111827';
const CARD_DESC = '#6b7280';

const H2 = 'clamp(1.4rem, calc(2.5dvh + 1.3vw), 3.75rem)';
const BODY = 'clamp(0.82rem, calc(1.1dvh + 0.4vw), 1rem)';
const CARD_TITLE_SIZE = 'clamp(0.82rem, calc(1dvh + 0.38vw), 1rem)';
const CARD_DESC_SIZE = 'clamp(0.7rem, calc(0.8dvh + 0.25vw), 0.875rem)';
const PAD_TOP = 'clamp(3.5rem, calc(6dvh + 1vw), 7rem)';
const PAD_BOT = 'clamp(2rem, calc(4dvh + 0.5vw), 4.5rem)';
const CARD_PAD = 'clamp(1rem, calc(1.5dvh + 0.6vw), 1.75rem)';

function CapabilityIcon({ iconKey }: { iconKey: string }) {
  const BADGE = 'clamp(32px, calc(3.2dvh + 0.9vw), 42px)';
  const ICO = 'clamp(15px, calc(1.5dvh + 0.5vw), 20px)';
  const props = {
    style: { width: ICO, height: ICO, minWidth: ICO, flexShrink: 0 } as React.CSSProperties,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: '#FFFFFF',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  let icon: React.ReactNode = null;
  switch (iconKey) {
    case 'chat':
      icon = <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
      break;
    case 'upsell':
      icon = <svg {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
      break;
    case 'dashboard':
      icon = <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>;
      break;
    case 'persona':
      icon = <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
      break;
    case 'efficiency':
      icon = (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
      break;
    case 'payments':
      icon = <svg {...props}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
      break;
    case 'inventory':
      icon = (
        <svg {...props}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
      break;
    case 'thirdparty':
      icon = <svg {...props}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
      break;
    case 'revenue':
      icon = <svg {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
      break;
    default:
      break;
  }

  return (
    <div
      style={{
        width: BADGE,
        height: BADGE,
        minWidth: BADGE,
        background: ORANGE,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
  );
}

export function CapabilitiesSlide() {
  return (
    <section
      className="h-full w-full flex flex-col justify-center shrink-0 overflow-hidden px-4 sm:px-6"
      style={{ background: BG, paddingTop: PAD_TOP, paddingBottom: PAD_BOT }}
    >
      <div
        className="max-w-6xl mx-auto w-full flex flex-col"
        style={{ gap: 'clamp(1rem, calc(2dvh + 0.5vw), 2.5rem)' }}
      >
        {/* Centered heading */}
        <Reveal animation="revealUp">
          <div className="text-center">
            <Eyebrow>Product Capabilities</Eyebrow>
            <h2
              className="font-black leading-tight"
              style={{
                fontSize: H2,
                color: '#111827',
                marginTop: 'clamp(0.3rem, 0.7dvh, 1rem)',
                marginBottom: 'clamp(0.3rem, 0.8dvh, 1rem)',
              }}
            >
              A complete revenue layer for the modern restaurant
            </h2>
            <p style={{ fontSize: BODY, color: '#6b7280' }}>
Everything you need in one unified platform, with no new hardware required.
            </p>
          </div>
        </Reveal>

        {/* 3×3 grid — explicit gap + 2px black border on each card */}
        <div
          className="grid grid-cols-2 lg:grid-cols-3"
          style={{ gap: 'clamp(0.5rem, calc(0.8dvh + 0.3vw), 0.875rem)' }}
        >
          {CAPABILITY_ITEMS.map(({ iconKey, label, desc }, i) => {
            const isLastOnMobile = i === CAPABILITY_ITEMS.length - 1;
            return (
              <Reveal
                key={label}
                animation="revealScale"
                delay={i * 0.04}
                className={isLastOnMobile ? 'col-span-2 lg:col-span-1' : ''}
              >
                <div
                  className="h-full flex flex-col"
                  style={{ background: CARD_BG, border: '1.5px solid #111827', padding: CARD_PAD, gap: 'clamp(0.5rem, 1dvh, 1rem)' }}
                >
                  <CapabilityIcon iconKey={iconKey} />
                  <p
                    className="font-semibold leading-snug"
                    style={{ fontSize: CARD_TITLE_SIZE, color: CARD_TITLE }}
                  >
                    {label}
                  </p>
                  <p
                    className="leading-relaxed"
                    style={{ fontSize: CARD_DESC_SIZE, color: CARD_DESC }}
                  >
                    {desc}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
