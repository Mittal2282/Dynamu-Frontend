import { ORANGE } from '../../constants/landingConstants';

export interface SlideDotsProps {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}

/** Odd-indexed slides are dark; even-indexed slides are light. */
export function SlideDots({ count, activeIndex, onSelect }: SlideDotsProps) {
  const isDarkSlide = activeIndex % 2 === 1;
  const inactiveColor = isDarkSlide ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.25)';

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
            background: i === activeIndex ? ORANGE : inactiveColor,
            transform: i === activeIndex ? 'scale(1.35)' : 'scale(1)',
          }}
          aria-label={`Go to section ${i + 1}`}
        />
      ))}
    </div>
  );
}
