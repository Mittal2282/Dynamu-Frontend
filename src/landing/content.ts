// Copy comes verbatim from the previous landing page (constants/landingContent.ts).
export {
  HERO_STATS,
  PROBLEM_CARDS,
  SOLUTION_BULLETS,
  HOW_IT_WORKS_STEPS,
  CAPABILITY_ITEMS,
  TRACTION_STATS,
} from '../constants/landingContent';

export const BRAND = 'DynamuAI';
export const CALENDLY_URL = 'https://calendly.com/arorabhavyam';
export const CONTACT_MAILTO = 'mailto:founder@dynamu.ai';

// Decorative receipt printed onto the 3D ticket (imagery, not page copy).
export const RECEIPT_LINES: string[] = [
  '        DYNAMUAI         ',
  '  TABLE 12 · GUESTS 3    ',
  '  19:42 · CHIT #0847     ',
  '-------------------------',
  '1  GARLIC NAAN         55',
  '1  CHICKEN CHETTINAD  420',
  '1  MANGO LASSI        120',
  '   " chef\'s pick "       ',
  '-------------------------',
  'AI SUGGESTED COMBO   +120',
  'HAPPY-HOUR 20% DRINKS    ',
  'ORDERED IN: 90 seconds   ',
  '-------------------------',
  'SENT TO KITCHEN   19:43  ',
  'NO WAITER LOOP    +0 min ',
  '-------------------------',
  'SUBTOTAL              595',
  'GST 5%                 30',
  'TOTAL             INR 625',
  '-------------------------',
  '  every table, every     ',
  '  night, on autopilot    ',
];

// Section ids drive backdrop file names (bg-<id>.webp) and camera acts.
export const ACT_IDS = ['hero', 'problem', 'solution', 'how', 'caps', 'cta'] as const;
export const ACT_COUNT = ACT_IDS.length;
