import { useNavigate } from 'react-router-dom';
import { LandingNav } from '../components/Landing/LandingNav';
import { SlideDots } from '../components/Landing/SlideDots';
import { SlideFrame } from '../components/Landing/SlideFrame';
import { SLIDE_COMPONENTS } from '../components/Landing/slides';
import { BG } from '../constants/landingConstants';
import { useSlideDeck } from './useSlideDeck';
import '../styles/landing.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const slideCount = SLIDE_COMPONENTS.length;
  const {
    viewportRef,
    activeIndex,
    reduceMotion,
    goToSlide,
    stepSlide,
    onTouchStart,
    onTouchEnd,
  } = useSlideDeck(slideCount);

  const trackClass = reduceMotion ? '' : 'page-slide-track';
  const slideProps = { activeIndex, stepSlide, goToSlide };

  return (
    <div
      className="fixed inset-0 text-white overflow-hidden touch-pan-x"
      style={{ background: BG, fontFamily: "'Outfit', sans-serif" }}
      ref={viewportRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <LandingNav onAdminLogin={() => navigate('/login')} />
      <SlideDots count={slideCount} activeIndex={activeIndex} onSelect={goToSlide} />

      <div
        className={`flex flex-col ${trackClass}`}
        style={{
          transform: `translate3d(0, calc(-${activeIndex} * 100dvh), 0)`,
          ...(reduceMotion ? { transition: 'none' } : {}),
        }}
      >
        {SLIDE_COMPONENTS.map((Slide, i) => (
          <SlideFrame key={i}>
            <Slide {...slideProps} />
          </SlideFrame>
        ))}
      </div>
    </div>
  );
}
