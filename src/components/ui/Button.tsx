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
      disabled={disabled}
      onClick={isDisabled ? undefined : onClick}
      className={[
        'relative btn rounded-xl active:scale-[0.97]',
        VARIANT[variant] ?? VARIANT.primary,
        SIZE[size]       ?? '',
        fullWidth && 'w-full',
        loading && 'pointer-events-none',
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
          <span className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
        </span>
      )}
    </button>
  );
}
