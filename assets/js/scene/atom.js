/**
 * TESHIMA LAB Portfolio — B2F Atom Doll Interactive Layer
 * Synchronized with B2F master scene photography, bobblehead animation, and keyword clipboard copy.
 */
import { atomLayer, atomDollWrap, atomBubble, atomCopyBtn, plate } from './dom.js';
import { runtime } from './state.js';
import { getCoverRect } from './hotspots.js';
import { AUTH_CONFIG } from './config.js';

let bubbleTimer = 0;

export function updateAtomDollPosition(px = runtime.platePanX, py = runtime.platePanY) {
  if (!atomDollWrap) return;
  const cover = getCoverRect(1920, 1080, window.innerWidth, window.innerHeight, px, py);
  // Verified exact match against lp_dolly.mp4 video end frame (1920x1080):
  // Coordinates: left=1244, top=608, width=93, height=195
  const dollLeft = cover.offsetX + (1244 / 1920) * cover.renderW;
  const dollTop = cover.offsetY + (608 / 1080) * cover.renderH;
  const dollW = (93 / 1920) * cover.renderW;
  const dollH = (195 / 1080) * cover.renderH;

  atomDollWrap.style.left = `${dollLeft}px`;
  atomDollWrap.style.top = `${dollTop}px`;
  atomDollWrap.style.width = `${dollW}px`;
  atomDollWrap.style.height = `${dollH}px`;
}

runtime.callbacks.updateAtomDollPosition = updateAtomDollPosition;

export function updateAtomVisibility() {
  if (!atomLayer) return;
  // B2F (LP floor) is cur === 2, ONLY visible when arrived at the desk end plate
  if (runtime.state === 'floor' && runtime.cur === 2 && plate && plate.classList.contains('is-end')) {
    atomLayer.hidden = false;
    updateAtomDollPosition();
  } else {
    atomLayer.hidden = true;
    if (atomBubble) {
      atomBubble.hidden = true;
      atomBubble.classList.remove('is-hiding');
    }
    clearTimeout(bubbleTimer);
  }
}

runtime.callbacks.updateAtomVisibility = updateAtomVisibility;

export function initAtomListeners() {
  if (atomDollWrap) {
    atomDollWrap.addEventListener('click', (e) => {
      e.stopPropagation(); // MUST NOT navigate away to LP link
      // Bobblehead animation
      atomDollWrap.classList.remove('is-bobbling');
      void atomDollWrap.offsetWidth;
      atomDollWrap.classList.add('is-bobbling');
      setTimeout(() => { atomDollWrap.classList.remove('is-bobbling'); }, 1200);

      if (!atomBubble) return;
      clearTimeout(bubbleTimer);
      atomBubble.hidden = false;
      atomBubble.classList.remove('is-hiding');
      bubbleTimer = setTimeout(() => {
        atomBubble.classList.add('is-hiding');
        setTimeout(() => {
          atomBubble.hidden = true;
          atomBubble.classList.remove('is-hiding');
        }, 350);
      }, 8000);
    });
  }

  if (atomCopyBtn) {
    atomCopyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => {
        atomBubble.classList.add('is-hiding');
        setTimeout(() => {
          atomBubble.hidden = true;
          atomBubble.classList.remove('is-hiding');
        }, 350);
      }, 4000);

      const keyword = AUTH_CONFIG.VALID_KEYWORD;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(keyword);
        } else {
          throw new Error('fallback');
        }
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = keyword;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e2) {}
        document.body.removeChild(ta);
      }
      atomCopyBtn.classList.add('is-copied');
      setTimeout(() => {
        atomCopyBtn.classList.remove('is-copied');
      }, 1500);
    });
  }
}
