import React from 'react';

export interface H2Props {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function H2({ children, className = '', style = {} }: H2Props) {
  return (
    <h2 className={`text-3xl sm:text-4xl font-bold text-white leading-[1.12] ${className}`} style={style}>
      {children}
    </h2>
  );
}
