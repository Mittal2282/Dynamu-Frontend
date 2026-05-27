import React from 'react';
import { Button as AntdButton } from 'antd';

const TYPE_MAP = {
  primary:   'primary',
  secondary: 'default',
  ghost:     'text',
  danger:    'primary',
} as const;

const SIZE_MAP = {
  sm: 'small',
  md: 'middle',
  lg: 'large',
  xl: 'large',
} as const;

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'size'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  htmlType?: 'button' | 'submit' | 'reset';
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
  htmlType  = 'button',
  onClick,
  ...rest
}: ButtonProps) {
  return (
    <AntdButton
      type={TYPE_MAP[variant] ?? 'primary'}
      danger={variant === 'danger'}
      size={SIZE_MAP[size] ?? 'middle'}
      loading={loading}
      disabled={disabled}
      block={fullWidth}
      htmlType={htmlType}
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      className={`rounded-xl active:scale-[0.97] ${className}`}
      {...(rest as object)}
    >
      {leftIcon && <span className={children ? 'mr-1.5' : ''}>{leftIcon}</span>}
      {children}
      {rightIcon && <span className={children ? 'ml-1.5' : ''}>{rightIcon}</span>}
    </AntdButton>
  );
}
