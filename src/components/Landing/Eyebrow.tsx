import React from 'react';
import { ORANGE } from '../../constants/landingConstants';

export interface EyebrowProps {
  children: React.ReactNode;
  light?: boolean;
}

export function Eyebrow({ children, light = false }: EyebrowProps) {
  return (
    <p
      className="text-[11px] font-bold uppercase tracking-[0.24em] mb-3"
      style={{ color: light ? 'rgba(255,107,0,0.95)' : ORANGE }}
    >
      {children}
    </p>
  );
}
