import React from 'react';

export interface SlideFrameProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Each slide occupies exactly one viewport height.
 * overflow-hidden prevents any inner scroll — all wheel/touch
 * events reach the slide-deck navigator directly.
 */
export function SlideFrame({ children, className = '' }: SlideFrameProps) {
  return (
    <div
      data-slide-scroll
      className={`h-dvh w-full shrink-0 overflow-hidden flex flex-col box-border ${className}`}
    >
      {children}
    </div>
  );
}
