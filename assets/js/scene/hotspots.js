/**
 * TESHIMA LAB Portfolio — Interactive Floor Hotspots & Portal Navigation
 */
import { MASTER_W, MASTER_H, FLOORS, FLOOR_HOTSPOTS } from './config.js';
import { stageHotspot, emailHotspot, portal, portalTitle, portalLink, plate, dollyLayer } from './dom.js';
import { runtime } from './state.js';

export function getCoverRect(imgW, imgH, vw, vh, posX = 0.5, posY = 0.5) {
  const imgRatio = imgW / imgH;
  const boxRatio = vw / vh;
  let renderW, renderH, offsetX, offsetY;
  if (boxRatio > imgRatio) {
    renderW = vw;
    renderH = vw / imgRatio;
    offsetX = 0;
    offsetY = (vh - renderH) * posY;
  } else {
    renderH = vh;
    renderW = vh * imgRatio;
    offsetX = (vw - renderW) * posX;
    offsetY = 0;
  }
  return { renderW, renderH, offsetX, offsetY };
}

export function updateStageHotspot(px = runtime.platePanX, py = runtime.platePanY) {
  if (!stageHotspot) return;

  if (runtime.state === 'floor' && runtime.cur >= 0 && (runtime.cur === 0 || (plate && plate.classList.contains('is-end')))) {
    const f = FLOORS[runtime.cur];
    const box = FLOOR_HOTSPOTS[runtime.cur];
    if (box && f && f.href) {
      const cover = getCoverRect(MASTER_W, MASTER_H, window.innerWidth, window.innerHeight, px, py);
      stageHotspot.style.left = `${cover.offsetX + box.x * cover.renderW}px`;
      stageHotspot.style.top = `${cover.offsetY + box.y * cover.renderH}px`;
      stageHotspot.style.width = `${box.w * cover.renderW}px`;
      stageHotspot.style.height = `${box.h * cover.renderH}px`;
      stageHotspot.style.clipPath = box.clipPath || '';
      stageHotspot.style.borderRadius = box.borderRadius || '';
      const targetHref = f.href || '';
      stageHotspot.href = targetHref;
      if (f.external) {
        stageHotspot.target = '_blank';
        stageHotspot.rel = 'noopener noreferrer';
      } else {
        stageHotspot.removeAttribute('target');
        stageHotspot.removeAttribute('rel');
      }
      stageHotspot.hidden = false;
      stageHotspot.style.display = 'block';

      if (emailHotspot) {
        if (runtime.cur === 0) {
          // 1F vadbusting@gmail.com exact text hotspot (1783, 928, 336, 30)
          emailHotspot.style.left = `${cover.offsetX + (1783 / MASTER_W) * cover.renderW}px`;
          emailHotspot.style.top = `${cover.offsetY + (928 / MASTER_H) * cover.renderH}px`;
          emailHotspot.style.width = `${(336 / MASTER_W) * cover.renderW}px`;
          emailHotspot.style.height = `${(30 / MASTER_H) * cover.renderH}px`;
          emailHotspot.href = 'mailto:vadbusting@gmail.com';
          emailHotspot.hidden = false;
          emailHotspot.style.display = 'block';
        } else {
          emailHotspot.hidden = true;
          emailHotspot.style.display = 'none';
        }
      }
    } else {
      stageHotspot.hidden = true;
      stageHotspot.style.display = 'none';
      if (emailHotspot) { emailHotspot.hidden = true; emailHotspot.style.display = 'none'; }
    }
  } else {
    stageHotspot.hidden = true;
    stageHotspot.style.display = 'none';
    if (emailHotspot) { emailHotspot.hidden = true; emailHotspot.style.display = 'none'; }
  }
}

runtime.callbacks.updateStageHotspot = updateStageHotspot;

export function showPortal(i) {
  const f = FLOORS[i];
  if (!f || !portal || !portalTitle || !portalLink) return;
  portalTitle.textContent = f.name;
  const targetHref = f.href || '';
  portalLink.href = targetHref;
  if (f.external) {
    portalLink.target = '_blank';
    portalLink.rel = 'noopener';
  } else {
    portalLink.removeAttribute('target');
    portalLink.removeAttribute('rel');
  }
  portal.classList.add('is-visible');
  portal.setAttribute('aria-hidden', 'false');
  portalLink.tabIndex = 0;
  updateStageHotspot();
}

export function hidePortal() {
  if (runtime.callbacks.hideCreditBtn) runtime.callbacks.hideCreditBtn();
  if (portal) {
    portal.classList.remove('is-visible');
    portal.setAttribute('aria-hidden', 'true');
  }
  if (portalLink) portalLink.tabIndex = -1;
  if (stageHotspot) stageHotspot.hidden = true;
}

runtime.callbacks.hidePortal = hidePortal;

export async function loadImg(img, src) {
  if (!img) return;
  if (img.getAttribute('src') !== src) img.src = src;
  try { await img.decode(); } catch (e) { /* ignore */ }
}

export const getFloorPos = (f) => f.pos || '50% 50%';
export const setPos = (f) => {
  if (plate) plate.style.setProperty('--pos', getFloorPos(f));
  if (dollyLayer) dollyLayer.style.setProperty('--pos', '50% 50%');
};

export function initHotspotListeners() {
  if (stageHotspot) {
    stageHotspot.addEventListener('click', (e) => {
      if (runtime.isTouchDragging || (performance.now() - runtime.lastDragTime < 350)) {
        e.preventDefault();
        e.stopPropagation();
        runtime.isTouchDragging = false;
        return;
      }
      e.stopPropagation();
      if (runtime.cur >= 0) {
        const f = FLOORS[runtime.cur];
        if (f && f.href) {
          const targetHref = f.href;
          if (f.external) {
            window.open(targetHref, '_blank', 'noopener noreferrer');
          } else {
            location.href = targetHref;
          }
        }
      }
    });
  }

  if (emailHotspot) {
    emailHotspot.addEventListener('click', (e) => {
      if (runtime.isTouchDragging || (performance.now() - runtime.lastDragTime < 350)) {
        e.preventDefault();
        e.stopPropagation();
        runtime.isTouchDragging = false;
        return;
      }
      e.stopPropagation();
    });
  }
}
