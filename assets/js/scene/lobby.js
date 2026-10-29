/**
 * TESHIMA LAB Portfolio — 1F ABOUT Sequence (Canvas Scrubber & Endplate)
 */
import { PATH } from './config.js';
import { stage, seqCv, seqCtx } from './dom.js';
import { runtime, clamp01 } from './state.js';

export const seq = { end: new Image(), endOk: false, q: 1, qt: 1, dirty: true, raf: 0, last: 0, auto: false };
seq.end.onload = () => { seq.endOk = true; seq.dirty = true; drawSeq(); };
seq.end.src = PATH.lobbyEnd;

runtime.callbacks.seq = seq;
runtime.callbacks.drawSeq = drawSeq;

export function seqLoad() {
  if (!seq.endOk && !seq.end.src) {
    seq.end.src = PATH.lobbyEnd;
  }
}

export function seqSize() {
  if (!seqCv || !stage) return;
  const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 780 ? 1.5 : 1.75);
  const w = Math.round((stage.clientWidth || window.innerWidth) * dpr);
  const h = Math.round((stage.clientHeight || window.innerHeight) * dpr);
  if (seqCv.width !== w || seqCv.height !== h) {
    seqCv.width = w;
    seqCv.height = h;
    seq.dirty = true;
  }
}

export function getSeqPanX() {
  if (runtime.state === 'floor' && runtime.cur === 0) return runtime.platePanX;
  return 0.5;
}

export function getSeqPanY() {
  if (runtime.state === 'floor' && runtime.cur === 0) return runtime.platePanY;
  return 0.5;
}

function cover(img, a = 1) {
  if (!seqCv || !seqCtx) return;
  const cw = seqCv.width, ch = seqCv.height, iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const s = Math.max(cw / iw, ch / ih);
  const w = iw * s, h = ih * s;
  const px = getSeqPanX();
  const py = getSeqPanY();
  const ox = (cw - w) * px;
  const oy = (ch - h) * py;
  seqCtx.globalAlpha = a;
  seqCtx.drawImage(img, ox, oy, w, h);
}

export function drawSeq() {
  if (!seqCv || !seqCtx) return;
  seqSize();
  if (!seq.dirty) return;
  seq.dirty = false;
  seqCtx.globalCompositeOperation = 'source-over';
  seqCtx.clearRect(0, 0, seqCv.width, seqCv.height);
  if (seq.endOk || (seq.end && seq.end.complete && seq.end.naturalWidth > 0)) {
    cover(seq.end, 1);
  }
  seqCtx.globalAlpha = 1;
}

export function setSeq(q) {
  seq.q = clamp01(q);
  seq.dirty = true;
  drawSeq();
}

export function seqLoop(now) {
  if (runtime.state !== 'lobby') { seq.raf = 0; return; }
  const dt = seq.last ? Math.min(0.08, (now - seq.last) / 1000) : 0;
  seq.last = now;
  if (seq.auto) seq.qt = clamp01(seq.qt + dt * 0.012);
  const diff = seq.qt - seq.q;
  if (Math.abs(diff) > 0.0002) {
    seq.q += diff * Math.min(1, dt * 7);
    seq.dirty = true;
    drawSeq();
  }
  if (seq.qt >= 0.999 && seq.q >= 0.994 && !runtime.busy) {
    setSeq(1);
    seq.raf = 0;
    if (runtime.callbacks.arriveLobbyEnd) runtime.callbacks.arriveLobbyEnd();
    return;
  }
  seq.raf = requestAnimationFrame(seqLoop);
}

export const startSeqLoop = () => {
  if (!seq.raf) {
    seq.last = 0;
    seq.raf = requestAnimationFrame(seqLoop);
  }
};

export function seqNudge(d) {
  if (runtime.busy) return;
  seq.auto = false;
  if (seq.qt <= 0.001 && d < -0.004) {
    if (runtime.callbacks.goHero) runtime.callbacks.goHero({ fromLobby: true });
    return;
  }
  seq.qt = clamp01(seq.qt + d);
  startSeqLoop();
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    seq.dirty = true;
    if (runtime.state === 'lobby' || (runtime.state === 'floor' && runtime.cur === 0)) drawSeq();
  }, { passive: true });
}
