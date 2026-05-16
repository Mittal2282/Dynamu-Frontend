import React from 'react';
import { useLandingTheme } from '../../context/LandingThemeContext';

export interface H2Props {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function H2({ children, className = '', style = {} }: H2Props) {
  const { isDark } = useLandingTheme();
  const textColor = isDark ? '#f1f5f9' : '#111827';

  return (
    <h2
      className={`text-3xl sm:text-4xl font-bold leading-[1.12] ${className}`}
      style={{ color: textColor, ...style }}
    >
      {children}
    </h2>
  );
}
