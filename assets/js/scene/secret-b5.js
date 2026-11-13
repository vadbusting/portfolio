/**
 * TESHIMA LAB Portfolio — B???F Secret Hotspots (Down Jacket & Fedora Hat)
 * Ultra-minimalist: invisible hitboxes with default cursor (hidden easter eggs).
 * Jacket -> https://jugendtechnokrat.netlify.app
 * Hat    -> https://jp.pinterest.com/JugendTechnokrat
 */
import { $, plate } from './dom.js';
import { runtime, canVideo } from './state.js';
import { MASTER_W, MASTER_H } from './config.js';

const JACKET_COORDS = Object.freeze({
  x: 330 / MASTER_W,
  y: 440 / MASTER_H,
  w: 480 / MASTER_W,
  h: 740 / MASTER_H
});

const HAT_COORDS = Object.freeze({
  x: 300 / MASTER_W,
  y: 135 / MASTER_H,
  w: 250 / MASTER_W,
  h: 300 / MASTER_H
});

export const JACKET_URL = 'https://jugendtechnokrat.netlify.app';
export const HAT_URL = 'https://jp.pinterest.com/JugendTechnokrat';

function getCoverRect(imgW, imgH, vw, vh, posX = 0.5, posY = 0.5) {
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

export function updateSecretHotspots(px = runtime.platePanX, py = runtime.platePanY) {
  const jacket = $('jacketHotspot') || document.getElementById('jacketHotspot');
  const hat = $('hatHotspot') || document.getElementById('hatHotspot');
  const plateEl = plate || document.getElementById('plate');

  const isB5 = runtime.state === 'floor' && runtime.cur === 5;
  const isB5End = isB5 && (plateEl && (plateEl.classList.contains('is-end') || runtime.floorQ >= 0.98 || !canVideo()));

  if (!isB5End) {
    if (jacket) { jacket.hidden = true; jacket.style.display = 'none'; }
    if (hat) { hat.hidden = true; hat.style.display = 'none'; }
    return;
  }

  const cover = getCoverRect(MASTER_W, MASTER_H, window.innerWidth, window.innerHeight, px, py);

  if (jacket) {
    jacket.style.left = `${cover.offsetX + JACKET_COORDS.x * cover.renderW}px`;
    jacket.style.top = `${cover.offsetY + JACKET_COORDS.y * cover.renderH}px`;
    jacket.style.width = `${JACKET_COORDS.w * cover.renderW}px`;
    jacket.style.height = `${JACKET_COORDS.h * cover.renderH}px`;
    jacket.hidden = false;
    jacket.style.display = 'block';
  }

  if (hat) {
    hat.style.left = `${cover.offsetX + HAT_COORDS.x * cover.renderW}px`;
    hat.style.top = `${cover.offsetY + HAT_COORDS.y * cover.renderH}px`;
    hat.style.width = `${HAT_COORDS.w * cover.renderW}px`;
    hat.style.height = `${HAT_COORDS.h * cover.renderH}px`;
    hat.hidden = false;
    hat.style.display = 'block';
  }
}

runtime.callbacks.updateSecretHotspots = updateSecretHotspots;

export function initSecretHotspots() {
  const jacket = $('jacketHotspot') || document.getElementById('jacketHotspot');
  const hat = $('hatHotspot') || document.getElementById('hatHotspot');

  const bindTrigger = (el, url) => {
    if (!el) return;
    let lastTriggerTime = 0;
    const trigger = (e) => {
      const now = performance.now();
      if (now - lastTriggerTime < 800) return;
      lastTriggerTime = now;
      if (e) {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
      }
      window.open(url, '_blank', 'noopener noreferrer');
    };

    el.addEventListener('click', (e) => {
      if (runtime.isTouchDragging || (performance.now() - runtime.lastDragTime < 350)) {
        if (e && e.cancelable) e.preventDefault();
        runtime.isTouchDragging = false;
        return;
      }
      trigger(e);
    });

    el.addEventListener('touchend', (e) => {
      if (runtime.isTouchDragging || (performance.now() - runtime.lastDragTime < 350)) {
        return;
      }
      trigger(e);
    }, { passive: false });
  };

  bindTrigger(jacket, JACKET_URL);
  bindTrigger(hat, HAT_URL);
  window.addEventListener('resize', () => updateSecretHotspots(), { passive: true });
  updateSecretHotspots();
}
