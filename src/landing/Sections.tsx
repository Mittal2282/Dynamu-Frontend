import { forwardRef } from 'react';
import {
  BRAND,
  CALENDLY_URL,
  CONTACT_MAILTO,
  HERO_STATS,
  PROBLEM_CARDS,
  SOLUTION_BULLETS,
  HOW_IT_WORKS_STEPS,
  CAPABILITY_ITEMS,
} from './content';

const Arrow = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// The scroll spine: 7 full-height acts over the 3D film. All copy is verbatim
// from the previous landing page.
const Sections = forwardRef<HTMLDivElement>(function Sections(_, ref) {
  return (
    <div className="dyn-scroll" ref={ref}>
      {/* 01 — HERO */}
      <section className="dyn-act dyn-act-hero" data-act={0}>
        <div className="dyn-copy dyn-copy-center dyn-scrim" data-copy>
          <p className="dyn-eyebrow dyn-mono">AI-Native Restaurant Platform</p>
          <h1 className="dyn-headline dyn-headline-hero">
            The AI Revenue Engine
            <br />
            <em>for Restaurants.</em>
          </h1>
          <p className="dyn-body">
            An AI-native ordering layer that turns every restaurant menu into a conversational sales
            representative. It recommends, upsells, and remembers, all on autopilot.
          </p>
          <div className="dyn-cta-row">
            <a className="dyn-btn dyn-btn-brass" href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
              Request a Demo <Arrow />
            </a>
            <a className="dyn-btn dyn-btn-ghost" href="#how-it-works">
              See How It Works
            </a>
          </div>
          <dl className="dyn-stats">
            {HERO_STATS.map(({ value, label }) => (
              <div key={label} className="dyn-stat">
                <dd className="dyn-stat-value dyn-mono">{value}</dd>
                <dt className="dyn-stat-label">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 02 — THE PROBLEM */}
      <section className="dyn-act" data-act={1}>
        <div className="dyn-copy dyn-copy-wide dyn-scrim" data-copy>
          <p className="dyn-eyebrow dyn-mono">The Problem</p>
          <h2 className="dyn-headline">
            Restaurants are losing revenue because <em>menus don&apos;t sell.</em>
          </h2>
          <p className="dyn-body">
            More than 15 million restaurants worldwide treat menus as static information sheets. The result is
            untapped upsells, overwhelmed staff, and customers who leave without spending their full potential.
          </p>
          <div className="dyn-cards dyn-cards-4">
            {PROBLEM_CARDS.map(({ num, title, desc }) => (
              <div key={num} className="dyn-card dyn-card-wine">
                <p className="dyn-card-num dyn-mono">{num}</p>
                <p className="dyn-card-title">{title}</p>
                <p className="dyn-card-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 03 — THE SOLUTION */}
      <section className="dyn-act dyn-act-right" data-act={2}>
        <div className="dyn-copy dyn-scrim dyn-scrim-right" data-copy>
          <p className="dyn-eyebrow dyn-mono">The Solution</p>
          <h2 className="dyn-headline">
            Dynamu, your AI <em>sales representative at every table</em>
          </h2>
          <p className="dyn-body">
            A conversational AI that greets every guest the moment they scan the QR code, guiding through the
            menu, recommending combos, upselling intelligently, and remembering preferences for future visits.
          </p>
          <ul className="dyn-bullets">
            {SOLUTION_BULLETS.map(({ label, desc }) => (
              <li key={label}>
                <p className="dyn-bullet-label">{label}</p>
                <p className="dyn-bullet-desc">{desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 04 — HOW IT WORKS */}
      <section className="dyn-act" id="how-it-works" data-act={3}>
        <div className="dyn-copy dyn-copy-wide dyn-scrim" data-copy>
          <p className="dyn-eyebrow dyn-mono">How It Works</p>
          <h2 className="dyn-headline">From scan to upsell in 90 seconds</h2>
          <p className="dyn-kicker dyn-mono">Zero App Download&nbsp;&nbsp;·&nbsp;&nbsp;Zero Staff Training</p>
          <div className="dyn-cards dyn-cards-4">
            {HOW_IT_WORKS_STEPS.map(({ step, title, desc }) => (
              <div key={step} className="dyn-card dyn-card-brass">
                <p className="dyn-card-num dyn-card-num-big dyn-mono">{step}</p>
                <p className="dyn-card-title">{title}</p>
                <p className="dyn-card-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 05 — PRODUCT CAPABILITIES */}
      <section className="dyn-act" data-act={4}>
        <div className="dyn-copy dyn-copy-wide dyn-scrim" data-copy>
          <p className="dyn-eyebrow dyn-mono">Product Capabilities</p>
          <h2 className="dyn-headline">A complete revenue layer for the modern restaurant</h2>
          <p className="dyn-body">Everything you need in one unified platform, with no new hardware required.</p>
          <div className="dyn-cards dyn-cards-3">
            {CAPABILITY_ITEMS.map(({ label, desc }) => (
              <div key={label} className="dyn-card dyn-card-line">
                <p className="dyn-card-title">{label}</p>
                <p className="dyn-card-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 06 — CTA */}
      <section className="dyn-act dyn-act-cta" id="book-demo" data-act={5}>
        <div className="dyn-copy dyn-copy-center" data-copy>
          <p className="dyn-eyebrow dyn-mono">Get Started</p>
          <h2 className="dyn-headline">
            Ready to turn your menu
            <br />
            into a <em>revenue engine?</em>
          </h2>
          <p className="dyn-body">
            Schedule a demo or reach out directly. Your AI waiter can be live within 24 hours of onboarding.
          </p>
          <div className="dyn-cta-row">
            <a className="dyn-btn dyn-btn-brass" href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
              Request a Demo <Arrow />
            </a>
            <a className="dyn-btn dyn-btn-ghost" href={CONTACT_MAILTO}>
              Contact Team
            </a>
          </div>
        </div>
      </section>
    </div>
  );
});

export default Sections;
