/**
 * Theme system — 4 restaurant themes, 10 colors each.
 *
 * The backend sends `restaurant.branding.theme` as a number (1–4).
 * Missing / invalid values fall back to Theme 1 (Ember Dark).
 *
 * ─── 10 semantic colors per theme ───────────────────────────────────────────
 *  --t-accent    Primary brand accent  (buttons, icons, prices, highlights)
 *  --t-accent2   Secondary accent      (AI chat, decorations, badges)
 *  --t-accent3   Tertiary accent       (extra highlights, tags)
 *  --t-bg        Page background       (deepest / nav / drawer bg)
 *  --t-surface   Raised surface        (cards, sections, list rows)
 *  --t-float     Elevated surface      (modals, overlays, input bg)
 *  --t-text      Primary text          (headings, main body)
 *  --t-dim       Muted / secondary text (subtitles, descriptions)
 *  --t-line      Border / divider
 *  --t-glow      Glow / shadow base color
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Auto-generated alpha variants (set on :root at runtime):
 *   --t-accent-10/20/40  --t-accent2-10/20/40  --t-accent3-10/20/40
 *   --t-glow-20/40
 *
 * Nav-derived helpers:
 *   --t-nav-active  (active tab tile bg)
 *   --t-nav-muted   (inactive tab icon + label)
 *
 * Fixed semantic (same across all themes):
 *   --t-success  --t-warning  --t-error
 */

export const THEMES = {
  /** Theme 1 — Ember Dark  (warm orange / cyan on near-black) */
  1: {
    name:    'Ember Dark',
    accent:  '#FF6B00',
    accent2: '#00F0FF',
    accent3: '#7B00FF',
    bg:      '#0A0C10',
    surface: '#11141C',
    float:   '#1A1D26',
    text:    '#F5F6FA',
    dim:     '#7B8594',
    line:    'rgba(255,255,255,0.08)',
    glow:    '#FF6B00',
  },

  /** Theme 2 — Gilded Night  (gold / copper on very dark warm black) */
  2: {
    name:    'Gilded Night',
    accent:  '#D4AF37',
    accent2: '#E8D09A',
    accent3: '#C97D4E',
    bg:      '#0D0B08',
    surface: '#171310',
    float:   '#221D17',
    text:    '#F5F0E8',
    dim:     '#8A7E6E',
    line:    'rgba(212,175,55,0.10)',
    glow:    '#D4AF37',
  },

  /** Theme 3 — Ocean Depth  (blue / teal on deep navy) */
  3: {
    name:    'Ocean Depth',
    accent:  '#3B82F6',
    accent2: '#06B6D4',
    accent3: '#818CF8',
    bg:      '#070B18',
    surface: '#0F1629',
    float:   '#182038',
    text:    '#E2E8F0',
    dim:     '#64748B',
    line:    'rgba(59,130,246,0.10)',
    glow:    '#3B82F6',
  },

  /** Theme 4 — Crimson Night  (rose / amber on dark burgundy-black) */
  4: {
    name:    'Crimson Night',
    accent:  '#F43F5E',
    accent2: '#FB923C',
    accent3: '#C084FC',
    bg:      '#0C080A',
    surface: '#180D10',
    float:   '#221318',
    text:    '#FDF2F8',
    dim:     '#9D7B87',
    line:    'rgba(244,63,94,0.10)',
    glow:    '#F43F5E',
  },
};

export const DEFAULT_THEME_NUMBER = 1;

/**
 * Return a theme object by number (1–4).  Falls back to Theme 1.
 * @param {number|string} themeNumber
 */
export function getTheme(themeNumber) {
  return THEMES[Number(themeNumber)] ?? THEMES[DEFAULT_THEME_NUMBER];
}

/**
 * Build the full set of CSS custom properties from a theme number.
 * @param {number|string} themeNumber
 * @returns {Record<string, string>}
 */
export function buildCssTokens(themeNumber = DEFAULT_THEME_NUMBER) {
  const t = getTheme(themeNumber);

  return {
    // ── Core 10 ──────────────────────────────────────────────────────────
    '--t-accent':  t.accent,
    '--t-accent2': t.accent2,
    '--t-accent3': t.accent3,
    '--t-bg':      t.bg,
    '--t-surface': t.surface,
    '--t-float':   t.float,
    '--t-text':    t.text,
    '--t-dim':     t.dim,
    '--t-line':    t.line,
    '--t-glow':    t.glow,

    // ── Alpha variants (auto-generated from hex) ──────────────────────────
    '--t-accent-10':  `${t.accent}1A`,   // 10 % opacity
    '--t-accent-20':  `${t.accent}33`,   // 20 %
    '--t-accent-40':  `${t.accent}66`,   // 40 %

    '--t-accent2-10': `${t.accent2}1A`,
    '--t-accent2-20': `${t.accent2}33`,
    '--t-accent2-40': `${t.accent2}66`,

    '--t-accent3-10': `${t.accent3}1A`,
    '--t-accent3-20': `${t.accent3}33`,
    '--t-accent3-40': `${t.accent3}66`,

    '--t-glow-20': `${t.glow}33`,
    '--t-glow-40': `${t.glow}66`,

    // ── Nav-derived helpers ───────────────────────────────────────────────
    '--t-nav-active': `color-mix(in srgb, ${t.bg} 85%, white 15%)`,
    '--t-nav-muted':  `color-mix(in srgb, ${t.bg} 28%, white 72%)`,

    // ── Fixed semantic (not theme-dependent) ─────────────────────────────
    '--t-success': '#22c55e',
    '--t-warning': '#f59e0b',
    '--t-error':   '#ef4444',
  };
}

/**
 * Apply CSS custom properties to :root.
 * @param {Record<string, string>} tokens
 */
export function applyCssTokens(tokens) {
  const root = document.documentElement;
  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
