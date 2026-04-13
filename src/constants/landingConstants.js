/** @see landingContent.js for copy data */

export const IMG = {
  hero: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=85',
  problem: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&q=85',
  howItWorks: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1920&q=85',
  capabilities: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1920&q=85',
  traction: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1920&q=85',
  cta: 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=1920&q=85',
};

export const ORANGE = '#FF6B00';
export const CYAN = '#00F0FF';
export const PURPLE = '#7B00FF';
export const BG = '#0A0C10';
export const BORDER = 'rgba(255,255,255,0.08)';

/** Radial readbility well + vertical gradient (first layer on top in CSS). */
export const OVERLAY_HERO = [
  'radial-gradient(ellipse 92% 72% at 50% 42%, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 55%, transparent 72%)',
  'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.58) 32%, rgba(0,0,0,0.66) 52%, rgba(10,12,16,0.95) 88%, #0A0C10 100%)',
].join(', ');

export const OVERLAY_PROBLEM =
  'linear-gradient(to bottom, #0A0C10 0%, rgba(0,0,0,0.88) 15%, rgba(0,0,0,0.88) 85%, #0A0C10 100%)';

export const OVERLAY_HOW_IT_WORKS =
  'linear-gradient(to bottom, #0A0C10 0%, rgba(0,0,0,0.86) 12%, rgba(0,0,0,0.84) 88%, #0A0C10 100%)';

export const OVERLAY_CAPABILITIES =
  'linear-gradient(to bottom, #0A0C10 0%, rgba(10,12,16,0.92) 10%, rgba(10,12,16,0.92) 90%, #0A0C10 100%)';

export const OVERLAY_TRACTION =
  'linear-gradient(to bottom, #0A0C10 0%, rgba(0,0,0,0.84) 12%, rgba(0,0,0,0.84) 88%, #0A0C10 100%)';

export const OVERLAY_CTA =
  'linear-gradient(to bottom, #0A0C10 0%, rgba(0,0,0,0.84) 10%, rgba(0,0,0,0.84) 90%, #0A0C10 100%)';

export const SLIDE_LOCK_MS = 900;

/** Index of “How it works” slide (for CTA from hero). */
export const HOW_IT_WORKS_SLIDE_INDEX = 3;

/** Legibility on busy photos */
export const HERO_TEXT_SHADOW = '0 1px 3px rgba(0,0,0,0.9), 0 2px 14px rgba(0,0,0,0.45)';
