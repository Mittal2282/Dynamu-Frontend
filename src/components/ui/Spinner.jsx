import React from 'react';

const SIZES = {
  xs: 'w-3 h-3 border-[2px]',
  sm: 'w-4 h-4 border-[2px]',
  md: 'w-6 h-6 border-[2px]',
  lg: 'w-8 h-8 border-[3px]',
  xl: 'w-10 h-10 border-[3px]',
};

/**
 * Consistent loading spinner.
 *
 * @param {{ size?: 'xs'|'sm'|'md'|'lg'|'xl', className?: string }} props
 */
export function Spinner({ size = 'md', className = '' }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={[
        'inline-block rounded-full border-white/30 border-t-white animate-spin',
        SIZES[size] ?? SIZES.md,
        className,
      ].filter(Boolean).join(' ')}
    />
  );
}
