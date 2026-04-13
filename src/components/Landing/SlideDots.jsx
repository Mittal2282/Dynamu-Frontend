import { ORANGE } from '../../constants/landingConstants';

export function SlideDots({ count, activeIndex, onSelect }) {
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
            background: i === activeIndex ? ORANGE : 'rgba(255,255,255,0.22)',
            transform: i === activeIndex ? 'scale(1.35)' : 'scale(1)',
          }}
          aria-label={`Go to section ${i + 1}`}
        />
      ))}
    </div>
  );
}
