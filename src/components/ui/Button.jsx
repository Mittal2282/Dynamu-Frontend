import React from 'react';
import { Spinner } from './Spinner';

/**
 * Variant styles map.
 * @type {Record<string, { base: string, hover: string, active: string, disabled: string }>}
 */
const VARIANTS = {
  primary: {
    base:     'bg-brand text-white',
    hover:    'hover:opacity-90',
    active:   'active:scale-[0.97]',
    disabled: 'opacity-50 cursor-not-allowed',
  },
  secondary: {
    base:     'bg-white/10 text-white border border-white/20',
    hover:    'hover:bg-white/20',
    active:   'active:scale-[0.97]',
    disabled: 'opacity-50 cursor-not-allowed',
  },
  ghost: {
    base:     'bg-transparent text-white/70',
    hover:    'hover:text-white hover:bg-white/10',
    active:   'active:scale-[0.97]',
    disabled: 'opacity-50 cursor-not-allowed',
  },
  danger: {
    base:     'bg-red-500 text-white',
    hover:    'hover:bg-red-600',
    active:   'active:scale-[0.97]',
    disabled: 'opacity-50 cursor-not-allowed',
  },
};

const SIZES = {
  sm:  'px-3 py-1.5 text-xs rounded-lg',
  md:  'px-5 py-2.5 text-sm rounded-xl',
  lg:  'px-6 py-3.5 text-base rounded-2xl',
  xl:  'px-8 py-4 text-base rounded-2xl',
};

/**
 * Consistent button component.
 *
 * @param {{ variant?: 'primary'|'secondary'|'ghost'|'danger', size?: 'sm'|'md'|'lg'|'xl',
 *           loading?: boolean, disabled?: boolean, leftIcon?: ReactNode, rightIcon?: ReactNode,
 *           fullWidth?: boolean, className?: string, onClick?: function, type?: string,
 *           children: ReactNode }} props
 */
export default function Button({
  variant    = 'primary',
  size       = 'md',
  loading    = false,
  disabled   = false,
  leftIcon,
  rightIcon,
  fullWidth  = false,
  className  = '',
  children,
  type       = 'button',
  onClick,
  ...rest
}) {
  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const s = SIZES[size]       ?? SIZES.md;
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      className={[
        'relative inline-flex items-center justify-center gap-2 font-semibold',
        'transition-all duration-150',
        v.base,
        !isDisabled && v.hover,
        !isDisabled && v.active,
        isDisabled  && v.disabled,
        fullWidth   && 'w-full',
        !isDisabled && 'hover:cursor-pointer',
        isDisabled && 'cursor-not-allowed',
        s,
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {/* Hidden content during loading (preserves button width) */}
      <span className={`inline-flex items-center gap-2 ${loading ? 'opacity-0' : ''}`}>
        {leftIcon && <span>{leftIcon}</span>}
        {children}
        {rightIcon && <span>{rightIcon}</span>}
      </span>

      {/* Spinner overlay */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" />
        </span>
      )}
    </button>
  );
}
