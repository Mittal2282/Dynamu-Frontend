import { Spin } from 'antd';

const ANT_SIZE: Record<string, 'small' | 'default' | 'large'> = {
  xs: 'small',
  sm: 'small',
  md: 'default',
  lg: 'large',
  xl: 'large',
};

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <span role="status" aria-label="Loading" className={`inline-flex items-center justify-center ${className}`}>
      <Spin size={ANT_SIZE[size] ?? 'default'} />
    </span>
  );
}
