/**
 * TESHIMA LAB Portfolio — Cinematic Movie Title (A CENOTAPH (for))
 * Synchronizes title opacity, scale, and blur with Hero entrance video time.
 */
import { cenotaph } from './dom.js';

export function updateCenotaphByTime(t) {
  if (!cenotaph) return;
  if (t < 4.2) {
    cenotaph.style.opacity = '1';
    cenotaph.style.filter = 'none';
    cenotaph.style.transform = 'translate(-50%, -50%) scale(1)';
    cenotaph.style.pointerEvents = 'auto';
  } else if (t <= 5.2) {
    const p = (t - 4.2) / 1.0;
    const alpha = Math.max(0, 1 - p);
    cenotaph.style.opacity = alpha.toFixed(4);
    cenotaph.style.filter = `blur(${(p * 8).toFixed(1)}px)`;
    cenotaph.style.transform = 'translate(-50%, -50%) scale(1)';
    cenotaph.style.pointerEvents = alpha > 0.1 ? 'auto' : 'none';
  } else {
    cenotaph.style.opacity = '0';
    cenotaph.style.pointerEvents = 'none';
    cenotaph.style.filter = 'blur(8px)';
    cenotaph.style.transform = 'translate(-50%, -50%) scale(1)';
  }
}
