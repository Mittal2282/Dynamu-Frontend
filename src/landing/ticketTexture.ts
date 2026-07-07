import * as THREE from 'three';
import { RECEIPT_LINES } from './content';

const W = 512;
const H = 716; // ~1 : 1.4, matches the ticket mesh

export interface TicketTexture {
  texture: THREE.CanvasTexture;
  /** reveal ∈ [0,1] → redraws only when the printed line count changes */
  draw(reveal: number): void;
}

// Receipt content is drawn onto a 2D canvas over the Higgsfield paper scan,
// then used as the ticket material's map. Cheap, crisp, no 3D text.
export function createTicketTexture(paper: HTMLImageElement | null): TicketTexture {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  let lastCount = -1;

  function draw(reveal: number) {
    const count = Math.round(reveal * RECEIPT_LINES.length);
    if (count === lastCount) return;
    lastCount = count;

    if (paper) {
      ctx.drawImage(paper, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#F1E9DC';
      ctx.fillRect(0, 0, W, H);
    }
    // warm candlelight wash so the paper never reads as a white slab
    ctx.globalCompositeOperation = 'multiply';
    const warm = ctx.createLinearGradient(0, 0, W, H);
    warm.addColorStop(0, '#E5CFA8');
    warm.addColorStop(1, '#C9A97C');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    ctx.fillStyle = 'rgba(40, 30, 24, 0.88)';
    ctx.font = '500 19px "IBM Plex Mono", monospace';
    ctx.textBaseline = 'top';

    const top = 52;
    const lineH = 25;
    for (let i = 0; i < count; i++) {
      const line = RECEIPT_LINES[i];
      if (i === 0) {
        ctx.font = '700 24px "IBM Plex Mono", monospace';
        ctx.fillText(line.trim(), W / 2 - ctx.measureText(line.trim()).width / 2, top);
        ctx.font = '500 19px "IBM Plex Mono", monospace';
      } else {
        ctx.fillText(line, 36, top + i * lineH + 8);
      }
    }
    // fresh-off-the-printer edge under the last line
    if (count > 0 && count < RECEIPT_LINES.length) {
      ctx.fillStyle = 'rgba(122, 46, 46, 0.45)';
      ctx.fillRect(28, top + count * lineH + 10, W - 56, 2);
    }
    texture.needsUpdate = true;
  }

  draw(0);
  return { texture, draw };
}
