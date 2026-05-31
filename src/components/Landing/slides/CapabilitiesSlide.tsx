import { ORANGE } from '../../../constants/landingConstants';
import { CAPABILITY_ITEMS } from '../../../constants/landingContent';
import { Eyebrow } from '../Eyebrow';
import { Reveal } from '../Reveal';

const BG = '#F5F7FA';
const CARD_BG = '#111827';
const CARD_TITLE = '#f1f5f9';
const CARD_DESC = '#64748b';

// Scale with both viewport height AND width so large monitors get big text too
const H2 = 'clamp(1.2rem, calc(2.2dvh + 1.2vw), 3.5rem)';
const BODY = 'clamp(0.75rem, calc(1dvh + 0.35vw), 1rem)';
const CARD_TITLE_SIZE = 'clamp(0.72rem, calc(0.9dvh + 0.35vw), 0.9375rem)';
const CARD_DESC_SIZE = 'clamp(0.6rem, calc(0.65dvh + 0.22vw), 0.8125rem)';
const PAD_TOP = 'clamp(3.5rem, calc(5dvh + 0.8vw), 6rem)';
const PAD_BOT = 'clamp(0.5rem, calc(1.2dvh + 0.2vw), 2rem)';
const CARD_PAD = 'clamp(0.65rem, calc(1dvh + 0.4vw), 1.5rem)';

function CapabilityIcon({ iconKey }: { iconKey: string }) {
  // Icon size scales with viewport
  const sz = 'clamp(16px, calc(1.6dvh + 0.6vw), 24px)';
  const props = {
    style: { width: sz, height: sz, minWidth: sz, flexShrink: 0 } as React.CSSProperties,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: ORANGE,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (iconKey) {
    case 'chat':
      return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case 'upsell':
      return <svg {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
    case 'dashboard':
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>;
    case 'persona':
      return <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case 'efficiency':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 'payments':
      return <svg {...props}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
    case 'inventory':
      return (
        <svg {...props}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case 'thirdparty':
      return <svg {...props}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
    case 'revenue':
      return <svg {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
    default:
      return null;
  }
}

export function CapabilitiesSlide() {
  return (
    <section
      className="h-full w-full flex flex-col justify-center shrink-0 overflow-hidden px-4 sm:px-6"
      style={{ background: BG, paddingTop: PAD_TOP, paddingBottom: PAD_BOT }}
    >
      <div
        className="max-w-6xl mx-auto w-full flex flex-col"
        style={{ gap: 'clamp(0.6rem, calc(1.2dvh + 0.3vw), 2rem)' }}
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
                marginTop: 'clamp(0.2rem, 0.5dvh, 0.75rem)',
                marginBottom: 'clamp(0.15rem, 0.4dvh, 0.5rem)',
              }}
            >
              A complete revenue layer for the modern restaurant
            </h2>
            <p style={{ fontSize: BODY, color: '#6b7280' }}>
              Nine capabilities in one unified platform, with no new hardware required.
            </p>
          </div>
        </Reveal>

        {/*
          Mobile:  grid-cols-2  (5 rows × 2 cols, last card in col 1)
          lg+:     grid-cols-3  (3 rows × 3 cols)
          Pseudo-borders: gray-200 background + 1px gap
        */}
        <div
          className="grid grid-cols-2 lg:grid-cols-3 bg-gray-200"
          style={{ gap: '1px' }}
        >
          {CAPABILITY_ITEMS.map(({ iconKey, label, desc }, i) => {
            // On mobile (2-col), make 9th card (index 8) span both columns
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
                  style={{ background: CARD_BG, padding: CARD_PAD, gap: 'clamp(0.25rem, 0.5dvh, 0.6rem)' }}
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
