export type Tier = 'full' | 'static';

// Decided once at load. Static tier = same copy/form, zero WebGL/GSAP.
export function getTier(): Tier {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'static';

  const canvas = document.createElement('canvas');
  if (!canvas.getContext('webgl2')) return 'static';

  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  if (mem !== undefined && mem < 4) return 'static';

  // ponytail: coarse pointer + small screen ≈ phone; swap for a real GPU probe if this misclassifies
  const smallTouch =
    window.matchMedia('(pointer: coarse)').matches &&
    Math.min(window.screen.width, window.screen.height) < 768;
  if (smallTouch) return 'static';

  return 'full';
}
