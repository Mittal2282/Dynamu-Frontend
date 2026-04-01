/**
 * VegBadge — green/red dot indicator for veg/non-veg items.
 *
 * @param {{ isVeg: boolean|null, size?: 'sm'|'md' }} props
 */
export function VegBadge({ isVeg, size = 'md', className='' }) {
  const dim = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  const color =
    isVeg === true  ? '#22c55e' :   // green
    isVeg === false ? '#ef4444' :   // red
                      '#94a3b8';   // unknown → slate

  return (
    <span
      role="img"
      aria-label={isVeg === true ? 'Vegetarian' : isVeg === false ? 'Non-vegetarian' : 'Unknown'}
      className={`block rounded-full shrink-0 ${dim} ${className}`}
      style={{ backgroundColor: color }}
    />
  );
}

/**
 * CountBadge — small numeric badge (e.g. cart count).
 *
 * @param {{ count: number, className?: string }} props
 */
export function CountBadge({ count, className = '', showZero = false }) {
  if (!showZero && !count) return null;
  return (
    <span
      className={[
        'absolute -top-2 -right-2',
        'text-[10px] font-bold min-w-[1.25rem] h-5 px-0.5 rounded-full',
        'flex items-center justify-center text-white',
        className,
      ].join(' ')}
      style={{ backgroundColor: 'var(--color-brand-primary)' }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
