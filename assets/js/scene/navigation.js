/**
 * TESHIMA LAB Portfolio — Floor & Cinematic Navigation Transitions
 */
import { FLOORS, PATH } from './config.js';
import {
  dolly, dollyLayer, plate, plateA, plateB, heroVideo,
  cenotaph, scrollCue, seqCv, seqCtx, portalLink,
  atomLayer, atomBubble
} from './dom.js';
import {
  runtime, setState, setDip, setRail, resetPlatePan,
  alive, wait, clamp01, canVideo, lightNet
} from './state.js';
import { preloadVideoBlob, getVideoSrc, videoBlobCache } from './blob-cache.js';
import { seq, seqLoad, drawSeq, startSeqLoop } from './lobby.js';
import { startHeroLoop } from './scrub-engine.js';
import { showPortal, hidePortal, loadImg, setPos, updateStageHotspot } from './hotspots.js';
import { updateAtomVisibility } from './atom.js';
import { updateCreditBtnVisibility, isSecretUnlocked, openCipherModal } from './modals.js';

const warmed = new Set();
export function warm(i) {
  if (i < 1 || i >= FLOORS.length || warmed.has(i) || lightNet()) return;
  warmed.add(i);
  const f = FLOORS[i];
  [PATH.plate(f.key, 'start'), PATH.plate(f.key, 'end')].forEach((s) => {
    const im = new Image();
    im.decoding = 'async';
    im.src = s;
  });
  if (canVideo()) {
    preloadVideoBlob(PATH.dolly(f.key));
  }
}

export async function goHero(opts = {}) {
  runtime.token++;
  if (runtime.floorRaf) { cancelAnimationFrame(runtime.floorRaf); runtime.floorRaf = 0; }
  if (runtime.heroRaf) { cancelAnimationFrame(runtime.heroRaf); runtime.heroRaf = 0; }
  if (seq.raf) { cancelAnimationFrame(seq.raf); seq.raf = 0; }
  if (dolly) dolly.pause();
  runtime.busy = false;

  if (!opts.fromLobby) {
    setDip(true);
    await wait(220);
  }
  hidePortal();
  setRail(-1);
  runtime.cur = -1;
  if (dollyLayer) dollyLayer.classList.remove('is-on');
  if (plate) {
    plate.classList.add('no-fade');
    plate.classList.remove('is-end');
  }
  if (plateB) plateB.style.opacity = '0';
  const stage = document.getElementById('stage');
  if (stage) stage.classList.remove('is-waiting-scroll');

  seq.last = 0;
  seq.auto = false;
  seq.q = 0;
  seq.qt = 0;
  seq.dirty = false;
  if (seqCtx && seqCv) {
    seqCtx.clearRect(0, 0, seqCv.width, seqCv.height);
  }
  setState('hero');

  if (opts.fromLobby) {
    runtime.heroQ = 0.96;
    runtime.heroQt = typeof opts.initialQt === 'number' ? clamp01(opts.initialQt) : 0.90;
    if (heroVideo) {
      const cachedBlob = videoBlobCache.get(PATH.heroVideo);
      if (cachedBlob && heroVideo.src !== cachedBlob) {
        heroVideo.src = cachedBlob;
        heroVideo.load();
      }
      if (heroVideo.hasAttribute('poster')) heroVideo.removeAttribute('poster');
      const setLobbyBackTime = () => {
        const dur = (Number.isFinite(heroVideo.duration) && heroVideo.duration > 0) ? heroVideo.duration : 10.0;
        runtime.lastHeroSeekTime = performance.now();
        try { heroVideo.currentTime = dur * runtime.heroQ; } catch (e) {}
      };
      if (heroVideo.readyState >= 1) setLobbyBackTime();
      else heroVideo.addEventListener('loadedmetadata', setLobbyBackTime, { once: true });
    }
    if (cenotaph) {
      cenotaph.style.opacity = '0';
      cenotaph.style.pointerEvents = 'none';
    }
    if (scrollCue) scrollCue.classList.add('is-hidden');
    startHeroLoop();
  } else {
    runtime.heroQ = runtime.heroQt = 0;
    if (heroVideo) {
      heroVideo.pause();
      try { heroVideo.currentTime = 0.001; } catch (e) {}
    }
    if (cenotaph) {
      cenotaph.style.opacity = '1';
      cenotaph.style.transform = 'translate(-50%, -50%) scale(1)';
      cenotaph.style.filter = 'none';
      cenotaph.style.pointerEvents = 'auto';
    }
    if (scrollCue) scrollCue.classList.remove('is-hidden');
  }
  document.documentElement.removeAttribute('data-page-floor');
  history.replaceState(null, '', location.pathname + location.search);
  if (!opts.fromLobby) {
    setDip(false);
  }
}

runtime.callbacks.goHero = goHero;

export function toLobbyState(q) {
  runtime.cur = -1;
  seq.q = seq.qt = (typeof q === 'number') ? q : 0;
  seq.auto = false;
  seq.dirty = true;
  const stage = document.getElementById('stage');
  if (stage) stage.classList.remove('is-waiting-scroll');
  if (scrollCue) scrollCue.classList.add('is-hidden');
  drawSeq();
  setState('lobby');
  setRail(-1);
  hidePortal();
  history.replaceState(null, '', '#lobby');
  startSeqLoop();
}

export function arriveLobbyEnd() {
  runtime.busy = false;
  runtime.cur = 0;
  runtime.floorArrivedTime = performance.now();
  resetPlatePan();
  if (plateA) plateA.src = PATH.lobbyEnd;
  if (plateB) {
    plateB.src = PATH.lobbyEnd;
    plateB.style.opacity = '1';
  }
  if (plate) {
    plate.classList.add('is-end');
    plate.classList.remove('no-fade');
    plate.style.setProperty('--pos', '50.0% 50.0%');
  }
  if (dollyLayer) dollyLayer.classList.remove('is-on');
  if (heroVideo) {
    heroVideo.pause();
    if (Number.isFinite(heroVideo.duration) && heroVideo.duration > 0) {
      try { heroVideo.currentTime = heroVideo.duration * 0.96; } catch (e) {}
    }
  }
  seqLoad();
  seq.q = seq.qt = 1;
  seq.dirty = true;
  drawSeq();
  setState('floor');
  showPortal(0);
  setRail(0);
  updateStageHotspot();
  updateCreditBtnVisibility();
  updateAtomVisibility();
  if (scrollCue) scrollCue.classList.add('is-hidden');
  const stage = document.getElementById('stage');
  if (stage) stage.classList.remove('is-waiting-scroll');
  document.documentElement.removeAttribute('data-page-floor');
  history.replaceState(null, '', '#about');
}

runtime.callbacks.arriveLobbyEnd = arriveLobbyEnd;

export async function goLobbyEnd() {
  const t = ++runtime.token;
  runtime.busy = true;
  hidePortal();
  seqLoad();
  if (!seq.endOk) {
    await new Promise((r) => {
      const iv = setInterval(() => { if (seq.endOk) { clearInterval(iv); r(); } }, 40);
      setTimeout(() => { clearInterval(iv); r(); }, 2500);
    });
  }
  if (runtime.state !== 'lobby') {
    setDip(true);
    await wait(280);
    if (!alive(t)) return;
  }
  if (dolly) {
    dolly.pause();
    try { dolly.currentTime = 0; } catch (e) {}
  }
  if (runtime.floorRaf) {
    cancelAnimationFrame(runtime.floorRaf);
    runtime.floorRaf = 0;
  }
  if (dollyLayer) dollyLayer.classList.remove('is-on');
  arriveLobbyEnd();
  setDip(false);
}

export async function goFloor(i, opts = {}) {
  if (i < 0 || i >= FLOORS.length) return;
  if (i === 5 && !isSecretUnlocked()) {
    openCipherModal();
    return;
  }
  if (i === 0) return goLobbyEnd();
  if (runtime.busy && !opts.force) return;

  const t = ++runtime.token;
  runtime.busy = true;
  hidePortal();
  if (atomLayer) atomLayer.hidden = true;
  if (atomBubble) {
    atomBubble.hidden = true;
    atomBubble.classList.remove('is-hiding');
  }
  const f = FLOORS[i];
  runtime.cur = i;
  setRail(i);
  warm(i);
  warm(i + 1);
  history.replaceState(null, '', '#' + f.key);

  if (runtime.floorRaf) {
    cancelAnimationFrame(runtime.floorRaf);
    runtime.floorRaf = 0;
  }
  runtime.floorQ = 0;
  runtime.floorQt = 0;
  runtime.floorLast = 0;

  const stage = document.getElementById('stage');
  const reset = () => {
    setPos(f);
    resetPlatePan();
    if (plate) {
      plate.classList.add('no-fade');
      plate.classList.remove('is-end');
    }
    if (plateB) plateB.style.opacity = opts.instant ? '1' : '0';
    if (canVideo()) {
      if (stage) stage.classList.remove('is-video-fallback');
      if (dolly) {
        dolly.pause();
        try { dolly.currentTime = 0; } catch (e) {}
        const dollyUrl = PATH.dolly(f.key);
        dolly.src = getVideoSrc(dollyUrl);
        dolly.load();
        preloadVideoBlob(dollyUrl);
        const syncDollyFrame = () => {
          try {
            dolly.pause();
            const dur = (Number.isFinite(dolly.duration) && dolly.duration > 0) ? dolly.duration : 0;
            dolly.currentTime = (runtime.floorQt > 0 && dur > 0) ? clamp01(runtime.floorQ) * dur : 0.001;
          } catch (e) {}
        };
        if (dolly.readyState >= 1) syncDollyFrame();
        else dolly.addEventListener('loadedmetadata', syncDollyFrame, { once: true });
      }
    } else {
      if (stage) stage.classList.add('is-video-fallback');
      if (dolly) {
        dolly.pause();
        dolly.removeAttribute('src');
      }
    }
    if (dollyLayer) dollyLayer.classList.remove('is-on');
    if (stage) stage.classList.remove('is-waiting-scroll');
    if (scrollCue) scrollCue.classList.add('is-hidden');
    updateAtomVisibility();
  };

  const loadPlates = () => Promise.all([
    loadImg(plateA, PATH.plate(f.key, 'start')),
    loadImg(plateB, PATH.plate(f.key, 'end'))
  ]);

  if (opts.instant) {
    reset();
    await loadPlates();
    if (!alive(t)) return;
    runtime.floorQ = runtime.floorQt = 1;
    if (dolly) {
      const syncEnd = () => {
        if (Number.isFinite(dolly.duration) && dolly.duration > 0) {
          try { dolly.currentTime = dolly.duration; } catch (e) {}
        }
      };
      if (dolly.readyState >= 1) syncEnd();
      else dolly.addEventListener('loadedmetadata', syncEnd, { once: true });
    }
    if (plate) plate.classList.add('is-end');
    setDip(false);
    return arrive(i, t);
  }

  setDip(true);
  await wait(280);
  if (!alive(t)) return;
  reset();
  await loadPlates();
  if (!alive(t)) return;

  setState('floor');
  if (plate) plate.classList.remove('no-fade');
  document.documentElement.removeAttribute('data-page-floor');
  setDip(false);

  // Freeze on Start Still Frame — waiting for scroll trigger
  if (stage) stage.classList.add('is-waiting-scroll');
  if (scrollCue) scrollCue.classList.remove('is-hidden');
  runtime.busy = false;
}

export function arrive(i, t) {
  if (!alive(t)) return;
  runtime.floorArrivedTime = performance.now();
  setState('floor');
  const stage = document.getElementById('stage');
  if (stage) stage.classList.remove('is-waiting-scroll');
  document.documentElement.removeAttribute('data-page-floor');
  if (scrollCue) scrollCue.classList.add('is-hidden');
  resetPlatePan();
  showPortal(i);
  setRail(i);
  runtime.busy = false;
  updateAtomVisibility();
  updateStageHotspot();
  updateCreditBtnVisibility();
  if (runtime.usedKeyboard && portalLink) {
    setTimeout(() => portalLink.focus({ preventScroll: true }), 400);
  }
}

runtime.callbacks.arrive = arrive;

export function jump(i) {
  if (i === runtime.cur) return;
  if (i === 5 && !isSecretUnlocked()) {
    openCipherModal();
    return;
  }
  runtime.token++;
  if (runtime.floorRaf) {
    cancelAnimationFrame(runtime.floorRaf);
    runtime.floorRaf = 0;
  }
  if (dolly) dolly.pause();
  runtime.busy = false;
  goFloor(i, { force: true });
}

runtime.callbacks.jump = jump;
