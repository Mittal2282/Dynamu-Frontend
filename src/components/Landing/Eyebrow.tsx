import React from 'react';
import { ORANGE } from '../../constants/landingConstants';

export interface EyebrowProps {
  children: React.ReactNode;
  light?: boolean;
  color?: string;
  style?: React.CSSProperties;
}

export function Eyebrow({ children, light = false, color, style }: EyebrowProps) {
  const resolvedColor = color ?? (light ? 'rgba(255,107,0,0.95)' : ORANGE);
  return (
    <p
      className="text-[11px] font-bold uppercase tracking-[0.24em] mb-3"
      style={{ color: resolvedColor, ...style }}
    >
      {children}
    </p>
  );
}
