import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import '@fontsource-variable/fraunces/index.css';
import '@fontsource-variable/inter/index.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/700.css';
import Experience, { ProgressRef } from './Experience';
import Sections from './Sections';
import StaticPage from './StaticPage';
import { getTier } from './deviceTier';
import { BRAND, ACT_COUNT } from './content';
import './landing.css';

gsap.registerPlugin(ScrollTrigger);

function Nav() {
  return (
    <header className="dyn-nav">
      <span className="dyn-nav-brand dyn-mono">{BRAND}</span>
      <nav>
        <a className="dyn-nav-link" href="#book-demo">
          Request a Demo
        </a>
        <Link className="dyn-nav-link dyn-nav-dim" to="/login">
          Restaurant login
        </Link>
      </nav>
    </header>
  );
}

function Cinematic() {
  const progress = useRef<ProgressRef>({ t: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.12 });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      // The one signature scrub: scroll position ↔ master timeline t.
      gsap.to(progress.current, {
        t: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: scrollRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
        },
        onUpdate: () => {
          const t = progress.current.t;
          // hero video lives in the DOM for native sharpness; fade + pause it past act 1
          const v = videoRef.current;
          if (v) {
            const fade = Math.min(1, Math.max(0, (t - (1 / ACT_COUNT - 0.05)) / 0.09));
            v.style.opacity = String(1 - fade);
            if (fade >= 1 && !v.paused) v.pause();
            else if (fade < 1 && v.paused) v.play().catch(() => undefined);
          }
        },
      });

      // Copy blocks fade in/out on the same scrub (CSS transform/opacity only).
      const acts = gsap.utils.toArray<HTMLElement>('.dyn-act');
      acts.forEach((act, i) => {
        const copy = act.querySelector('[data-copy]');
        if (!copy) return;
        if (i === acts.length - 1) {
          // Final act stays visible once reached — CTA/footer never hides
          gsap.fromTo(
            copy,
            { autoAlpha: 0, y: 40 },
            {
              autoAlpha: 1,
              y: 0,
              ease: 'none',
              scrollTrigger: { trigger: act, start: 'top 80%', end: 'top 35%', scrub: true },
            },
          );
        } else {
          gsap
            .timeline({
              scrollTrigger: { trigger: act, start: 'top bottom', end: 'bottom top', scrub: true },
            })
            .fromTo(copy, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.25 }, 0.12)
            .to(copy, { autoAlpha: 0, y: -40, duration: 0.25 }, 0.63);
        }
      });
    });

    return () => {
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="dyn-landing">
      <video
        ref={videoRef}
        className="dyn-hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/landing/bg-hero.webp"
        aria-hidden="true"
      >
        <source src="/landing/hero.mp4" type="video/mp4" />
      </video>
      <Experience progress={progress} />
      <div className="dyn-vignette" aria-hidden="true" />
      <Nav />
      <Sections ref={scrollRef} />
    </div>
  );
}

export default function LandingPage() {
  const [tier] = useState(getTier);

  if (tier === 'static') {
    return (
      <div className="dyn-landing">
        <Nav />
        <StaticPage />
      </div>
    );
  }
  return <Cinematic />;
}
