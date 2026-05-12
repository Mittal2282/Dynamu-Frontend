import React from 'react';

const VARIANT: Record<string, string> = {
  primary:   'btn-primary',
  secondary: 'btn-ghost border border-white/20',
  ghost:     'btn-ghost',
  danger:    'btn-error',
};

const SIZE: Record<string, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
  xl: 'btn-xl',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  disabled  = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  children,
  type      = 'button',
  onClick,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      className={[
        'btn active:scale-[0.97]',
        VARIANT[variant] ?? VARIANT.primary,
        SIZE[size]       ?? '',
        fullWidth && 'w-full',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      <span className={`inline-flex items-center gap-2 ${loading ? 'opacity-0' : ''}`}>
        {leftIcon && <span>{leftIcon}</span>}
        {children}
        {rightIcon && <span>{rightIcon}</span>}
      </span>

      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="loading loading-spinner loading-sm" />
        </span>
      )}
    </button>
  );
}
