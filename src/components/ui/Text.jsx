import React from 'react';

const SIZE_CLASSES = {
  xs:  'text-[10px] leading-[14px]',
  sm:  'text-xs leading-[18px]',
  md:  'text-sm leading-[20px]',
  lg:  'text-base leading-[24px]',
  xl:  'text-lg leading-[28px]',
  '2xl': 'text-2xl leading-[32px]',
};

const WEIGHT_CLASSES = {
  normal:    'font-normal',
  medium:    'font-medium',
  semibold:  'font-semibold',
  bold:      'font-bold',
};

const COLOR_CLASSES = {
  primary:   'text-[var(--color-text-primary)]',
  secondary: 'text-[var(--color-text-secondary)]',
  muted:     'text-[var(--color-text-muted)]',
  brand:     'text-[var(--color-brand-primary)]',
  success:   'text-[var(--color-success)]',
  error:     'text-[var(--color-error)]',
  white:     'text-white',
  inherit:   'text-inherit',
};

/**
 * Consistent text component.
 *
 * @param {{ as?: string, size?: 'xs'|'sm'|'md'|'lg'|'xl'|'2xl',
 *           weight?: 'normal'|'medium'|'semibold'|'bold',
 *           color?: 'primary'|'secondary'|'muted'|'brand'|'success'|'error'|'white'|'inherit',
 *           className?: string, children?: ReactNode }} props
 */
export default function Text({
  as        = 'p',
  size      = 'md',
  weight    = 'normal',
  color     = 'primary',
  className = '',
  children,
  ...rest
}) {
  const Tag = as;

  return (
    <Tag
      className={[
        SIZE_CLASSES[size]     ?? SIZE_CLASSES.md,
        WEIGHT_CLASSES[weight] ?? WEIGHT_CLASSES.normal,
        COLOR_CLASSES[color]   ?? COLOR_CLASSES.primary,
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  );
}
