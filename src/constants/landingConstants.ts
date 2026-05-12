/** @see landingContent.js for copy data */

export const IMG: Record<string, string> = {
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
export const BG = '#F5F7FA';
export const BORDER = 'rgba(0,0,0,0.10)';

/** Card glass background — used in slides */
export const CARD_BG = 'rgba(255,255,255,0.88)';
export const CARD_BG_HOVER = 'rgba(255,255,255,0.97)';

/** White-tinted overlay lets photos show through while keeping dark text readable. */
export const OVERLAY_HERO = [
  'radial-gradient(ellipse 92% 72% at 50% 42%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 55%, transparent 72%)',
  'linear-gradient(to bottom, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.48) 32%, rgba(255,255,255,0.58) 52%, rgba(245,247,250,0.93) 88%, #F5F7FA 100%)',
].join(', ');

export const OVERLAY_PROBLEM =
  'linear-gradient(to bottom, #F5F7FA 0%, rgba(245,247,250,0.90) 15%, rgba(245,247,250,0.90) 85%, #F5F7FA 100%)';

export const OVERLAY_HOW_IT_WORKS =
  'linear-gradient(to bottom, #F5F7FA 0%, rgba(245,247,250,0.88) 12%, rgba(245,247,250,0.88) 88%, #F5F7FA 100%)';

export const OVERLAY_CAPABILITIES =
  'linear-gradient(to bottom, #F5F7FA 0%, rgba(245,247,250,0.92) 10%, rgba(245,247,250,0.92) 90%, #F5F7FA 100%)';

export const OVERLAY_TRACTION =
  'linear-gradient(to bottom, #F5F7FA 0%, rgba(245,247,250,0.88) 12%, rgba(245,247,250,0.88) 88%, #F5F7FA 100%)';

export const OVERLAY_CTA =
  'linear-gradient(to bottom, #F5F7FA 0%, rgba(245,247,250,0.88) 10%, rgba(245,247,250,0.88) 90%, #F5F7FA 100%)';

export const SLIDE_LOCK_MS = 900;

/** Index of "How it works" slide (for CTA from hero). */
export const HOW_IT_WORKS_SLIDE_INDEX = 3;

/** Light text shadow for dark text on photos */
export const HERO_TEXT_SHADOW = '0 1px 2px rgba(255,255,255,0.7)';
