import { ORANGE } from '../../constants/landingConstants';
import { useLandingTheme } from '../../context/LandingThemeContext';

export interface SlideDotsProps {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function SlideDots({ count, activeIndex, onSelect }: SlideDotsProps) {
  const { isDark } = useLandingTheme();

  return (
    <div
      className="fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 pointer-events-auto"
      role="navigation"
      aria-label="Page sections"
    >
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className="w-2 h-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/80"
          style={{
            background: i === activeIndex ? ORANGE : isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)',
            transform: i === activeIndex ? 'scale(1.35)' : 'scale(1)',
          }}
          aria-label={`Go to section ${i + 1}`}
        />
      ))}
    </div>
  );
}
