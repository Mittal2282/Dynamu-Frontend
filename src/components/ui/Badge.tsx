interface VegBadgeProps {
  isVeg?: boolean | null | 'mixed';
  size?: 'sm' | 'md';
  className?: string;
}

interface CountBadgeProps {
  count: number;
  className?: string;
  showZero?: boolean;
}

/** VegBadge — green/red dot indicator (kept custom — specific ◉ shape). */
export function VegBadge({ isVeg, size = 'md', className = '' }: VegBadgeProps) {
  const dim = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';

  if (isVeg === 'mixed') {
    return (
      <span
        role="img"
        aria-label="Contains both veg and non-veg options"
        className={`flex items-center gap-[2px] shrink-0 ${className}`}
      >
        <span className={`block rounded-full ${dim}`} style={{ backgroundColor: '#22c55e' }} />
        <span className={`block rounded-full ${dim}`} style={{ backgroundColor: '#ef4444' }} />
      </span>
    );
  }

  const color =
    isVeg === true  ? '#22c55e' :
    isVeg === false ? '#ef4444' :
                      '#94a3b8';

  return (
    <span
      role="img"
      aria-label={isVeg === true ? 'Vegetarian' : isVeg === false ? 'Non-vegetarian' : 'Unknown'}
      className={`block rounded-full shrink-0 ${dim} ${className}`}
      style={{ backgroundColor: color }}
    />
  );
}

/** CountBadge — absolute-positioned numeric pill (e.g. cart count). */
export function CountBadge({ count, className = '', showZero = false }: CountBadgeProps) {
  if (!showZero && count === 0) return null;
  return (
    <span
      className={`badge badge-primary badge-sm absolute -top-2 -right-2 text-[10px] font-bold px-0.5 ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
