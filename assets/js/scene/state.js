/**
 * TESHIMA LAB Portfolio — Scene State Machine & Runtime Store
 */
import { stage, lab, plate, dollyLayer, rail, atomLayer } from './dom.js';

export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export const runtime = {
  state: 'hero',
  cur: -1,
  token: 0,
  busy: false,
  usedKeyboard: false,
  platePanX: 0.5,
  platePanY: 0.5,
  floorArrivedTime: 0,
  isTouchDragging: false,
  lastDragTime: 0,
  videoBroken: false,
  heroUnlocking: false,
  heroUnlocked: false,
  heroQ: 0,
  heroQt: 0,
  heroRaf: 0,
  heroLast: 0,
  lastHeroSeekTime: 0,
  floorQ: 0,
  floorQt: 0,
  floorRaf: 0,
  floorLast: 0,
  callbacks: {
    updateAtomVisibility: null,
    updateCreditBtnVisibility: null,
    updateStageHotspot: null,
    updateAtomDollPosition: null,
    drawSeq: null,
    seq: null
  }
};

export const alive = (t) => t === runtime.token;

export const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
export const conn = typeof navigator !== 'undefined' ? (navigator.connection || {}) : {};
export const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();

export const canVideo = () => !runtime.videoBroken && !mq.matches && params.get('novideo') !== '1';
export const lightNet = () => Boolean(conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''));

export function setState(s) {
  runtime.state = s;
  if (stage) {
    stage.dataset.state = s;
    stage.dataset.floor = String(runtime.cur);
  }
  if (lab) {
    lab.dataset.stage = s === 'hero' ? '0' : (s === 'floor' ? String(runtime.cur + 1) : 'L');
  }
  if (runtime.callbacks.updateAtomVisibility) runtime.callbacks.updateAtomVisibility();
  if (runtime.callbacks.updateCreditBtnVisibility) runtime.callbacks.updateCreditBtnVisibility();
}

export function setDip(on) {
  const dip = document.getElementById('dip');
  if (dip) dip.classList.toggle('is-on', on);
  if (on && atomLayer) atomLayer.hidden = true;
}

export function setRail(i) {
  if (!rail) return;
  const jumpTarget = i >= 0 ? String(i + 1) : null;
  rail.querySelectorAll('.rail__btn').forEach((b) => {
    b.classList.toggle('is-active', jumpTarget !== null && b.getAttribute('data-stage-jump') === jumpTarget);
  });
}

export function resetPlatePan() {
  runtime.platePanX = 0.5;
  runtime.platePanY = 0.5;
  const posVal = '50.0% 50.0%';
  if (plate) plate.style.setProperty('--pos', posVal);
  if (dollyLayer) dollyLayer.style.setProperty('--pos', posVal);
  if (runtime.callbacks.updateStageHotspot) runtime.callbacks.updateStageHotspot();
  if (runtime.callbacks.updateAtomDollPosition) runtime.callbacks.updateAtomDollPosition();
  if (runtime.callbacks.seq && runtime.cur === 0) {
    runtime.callbacks.seq.dirty = true;
    if (runtime.callbacks.drawSeq) runtime.callbacks.drawSeq();
  }
}
