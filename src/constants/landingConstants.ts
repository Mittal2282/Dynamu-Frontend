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

/** Dark mode colors */
export const BG_DARK = '#0f172a';
export const BORDER_DARK = 'rgba(255,255,255,0.10)';

/** Card glass background — used in slides */
export const CARD_BG = 'rgba(255,255,255,0.88)';
export const CARD_BG_HOVER = 'rgba(255,255,255,0.97)';

/** Dark mode card backgrounds */
export const CARD_BG_DARK = 'rgba(15,23,42,0.88)';
export const CARD_BG_DARK_HOVER = 'rgba(15,23,42,0.97)';

/** Light-mode overlays — white-tinted so dark text stays readable over photos */
export const OVERLAY_HERO = [
  'radial-gradient(ellipse 92% 72% at 50% 42%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 55%, transparent 72%)',
  'linear-gradient(to bottom, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.48) 32%, rgba(255,255,255,0.58) 52%, rgba(245,247,250,0.93) 88%, #F5F7FA 100%)',
].join(', ');

export const OVERLAY_PROBLEM =
  'linear-gradient(to bottom, #F5F7FA 0%, rgba(245,247,250,0.96) 10%, rgba(245,247,250,0.96) 90%, #F5F7FA 100%)';

export const OVERLAY_HOW_IT_WORKS =
  'linear-gradient(to bottom, #F5F7FA 0%, rgba(245,247,250,0.94) 12%, rgba(245,247,250,0.94) 88%, #F5F7FA 100%)';

export const OVERLAY_CAPABILITIES =
  'linear-gradient(to bottom, #F5F7FA 0%, rgba(245,247,250,0.96) 10%, rgba(245,247,250,0.96) 90%, #F5F7FA 100%)';

export const OVERLAY_TRACTION =
  'linear-gradient(to bottom, #F5F7FA 0%, rgba(245,247,250,0.94) 12%, rgba(245,247,250,0.94) 88%, #F5F7FA 100%)';

export const OVERLAY_CTA =
  'linear-gradient(to bottom, #F5F7FA 0%, rgba(245,247,250,0.94) 10%, rgba(245,247,250,0.94) 90%, #F5F7FA 100%)';

/** Dark-mode overlays — deep navy tint, lets photos show through subtly */
export const OVERLAY_HERO_DARK = [
  'radial-gradient(ellipse 92% 72% at 50% 42%, rgba(15,23,42,0.30) 0%, rgba(15,23,42,0.10) 55%, transparent 72%)',
  'linear-gradient(to bottom, rgba(15,23,42,0.50) 0%, rgba(15,23,42,0.28) 32%, rgba(15,23,42,0.42) 52%, rgba(15,23,42,0.92) 88%, #0f172a 100%)',
].join(', ');

export const OVERLAY_PROBLEM_DARK =
  'linear-gradient(to bottom, #0f172a 0%, rgba(15,23,42,0.80) 12%, rgba(15,23,42,0.80) 88%, #0f172a 100%)';

export const OVERLAY_HOW_IT_WORKS_DARK =
  'linear-gradient(to bottom, #0f172a 0%, rgba(15,23,42,0.78) 12%, rgba(15,23,42,0.78) 88%, #0f172a 100%)';

export const OVERLAY_CAPABILITIES_DARK =
  'linear-gradient(to bottom, #0f172a 0%, rgba(15,23,42,0.80) 10%, rgba(15,23,42,0.80) 90%, #0f172a 100%)';

export const OVERLAY_TRACTION_DARK =
  'linear-gradient(to bottom, #0f172a 0%, rgba(15,23,42,0.80) 12%, rgba(15,23,42,0.80) 88%, #0f172a 100%)';

export const OVERLAY_CTA_DARK =
  'linear-gradient(to bottom, #0f172a 0%, rgba(15,23,42,0.80) 10%, rgba(15,23,42,0.80) 90%, #0f172a 100%)';

export const SLIDE_LOCK_MS = 900;

/** Index of "How it works" slide (for CTA from hero). */
export const HOW_IT_WORKS_SLIDE_INDEX = 3;

/** Light text shadow for dark text on photos */
export const HERO_TEXT_SHADOW = '0 1px 2px rgba(255,255,255,0.7)';
