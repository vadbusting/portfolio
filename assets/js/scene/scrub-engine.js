/**
 * TESHIMA LAB Portfolio — Dual Scrub Engine
 * Handles frame-accurate video scrubbing for Hero entrance and Floor dolly-in.
 */
import { heroVideo, dolly, stage, plate, plateB, dollyLayer, scrollCue } from './dom.js';
import { runtime, clamp01, canVideo } from './state.js';
import { updateCenotaphByTime } from './cenotaph.js';
import { seqLoad } from './lobby.js';

export function unlockHeroDecoder() {
  if (runtime.heroUnlocked || runtime.heroUnlocking || !heroVideo) return;
  runtime.heroUnlocking = true;
  try {
    heroVideo.muted = true;
    heroVideo.playbackRate = 0.0001;
    const finishUnlock = () => {
      runtime.heroUnlocking = false;
      runtime.heroUnlocked = true;
      try {
        heroVideo.pause();
        heroVideo.playbackRate = 1;
        const dur = (Number.isFinite(heroVideo.duration) && heroVideo.duration > 0) ? heroVideo.duration : 10.0;
        const t = runtime.state === 'hero' ? Math.max(0.001, Math.min(dur - 0.04, clamp01(runtime.heroQ) * dur)) : (runtime.cur === 0 ? dur * 0.96 : 0.001);
        if (Math.abs(heroVideo.currentTime - t) > 0.02) heroVideo.currentTime = t;
      } catch (e) {}
    };
    const timer = setTimeout(finishUnlock, 24);
    const p = heroVideo.play();
    if (p && typeof p.then === 'function') {
      p.then(() => { clearTimeout(timer); finishUnlock(); }).catch(() => { clearTimeout(timer); runtime.heroUnlocking = false; });
    } else {
      clearTimeout(timer);
      finishUnlock();
    }
  } catch (e) {
    runtime.heroUnlocking = false;
  }
}

export function syncHeroFrame() {
  if (!heroVideo) return;
  try {
    heroVideo.pause();
    const dur = (Number.isFinite(heroVideo.duration) && heroVideo.duration > 0) ? heroVideo.duration : 10.0;
    const targetTime = Math.max(0.001, Math.min(dur - 0.04, clamp01(runtime.heroQ) * dur));
    if (Math.abs(heroVideo.currentTime - targetTime) > 0.02) {
      runtime.lastHeroSeekTime = performance.now();
      heroVideo.currentTime = targetTime;
    }
    updateCenotaphByTime(heroVideo.currentTime);
  } catch (e) {}
}

export function heroLoop(now) {
  const dt = Math.min(0.08, (now - runtime.heroLast) / 1000 || 0.016);
  runtime.heroLast = now;
  const diff = runtime.heroQt - runtime.heroQ;
  if (Math.abs(diff) > 0.0004) {
    runtime.heroQ += diff * Math.min(1, dt * 14);
  } else {
    runtime.heroQ = runtime.heroQt;
  }

  const dur = (heroVideo && Number.isFinite(heroVideo.duration) && heroVideo.duration > 0) ? heroVideo.duration : 10.0;
  const targetTime = Math.max(0.001, Math.min(dur - 0.04, clamp01(runtime.heroQ) * dur));

  if (heroVideo && Number.isFinite(heroVideo.duration) && heroVideo.duration > 0) {
    if (!runtime.heroUnlocking && !heroVideo.paused) heroVideo.pause();
    if (heroVideo.hasAttribute('poster') && targetTime > 0.05 && heroVideo.readyState >= 2) {
      heroVideo.removeAttribute('poster');
    }
    if ((!heroVideo.seeking || (now - runtime.lastHeroSeekTime > 60)) && Math.abs(heroVideo.currentTime - targetTime) > 0.012) {
      runtime.lastHeroSeekTime = now;
      try { heroVideo.currentTime = targetTime; } catch (e) {}
    }
  }

  // Cinematic CENOTAPH movie title synced with actual video frame when available
  const effectiveTime = (heroVideo && heroVideo.readyState >= 2 && Number.isFinite(heroVideo.duration) && heroVideo.duration > 0 && !stage.classList.contains('is-hero-fallback'))
    ? heroVideo.currentTime
    : targetTime;
  updateCenotaphByTime(effectiveTime);

  if (runtime.heroQt <= 0.01 && runtime.heroQ <= 0.02) {
    if (scrollCue) scrollCue.classList.remove('is-hidden');
  }

  // End of HERO video -> Smoothly arrive at 1F Floor Selection (ABOUT)
  if (runtime.heroQt >= 0.99 && runtime.heroQ >= 0.985 && !runtime.busy) {
    runtime.heroQ = runtime.heroQt = 1;
    cancelAnimationFrame(runtime.heroRaf);
    runtime.heroRaf = 0;
    if (runtime.callbacks.arriveLobbyEnd) runtime.callbacks.arriveLobbyEnd();
    return;
  }

  if (Math.abs(runtime.heroQt - runtime.heroQ) > 0.0004) {
    runtime.heroRaf = requestAnimationFrame(heroLoop);
  } else {
    runtime.heroRaf = 0;
    if (heroVideo && Number.isFinite(heroVideo.duration) && heroVideo.duration > 0) {
      runtime.lastHeroSeekTime = now;
      try { heroVideo.currentTime = targetTime; } catch (e) {}
      updateCenotaphByTime(heroVideo.currentTime);
    }
  }
}

export function startHeroLoop() {
  if (!runtime.heroRaf) {
    runtime.heroLast = performance.now();
    runtime.heroRaf = requestAnimationFrame(heroLoop);
  }
}

export function heroNudge(d) {
  if (runtime.busy || runtime.state !== 'hero') return;
  seqLoad();
  runtime.heroQt = clamp01(runtime.heroQt + d);
  startHeroLoop();
}

export function floorLoop(now) {
  const dt = Math.min(0.08, (now - runtime.floorLast) / 1000 || 0.016);
  runtime.floorLast = now;
  const diff = runtime.floorQt - runtime.floorQ;
  if (Math.abs(diff) > 0.0004) {
    runtime.floorQ += diff * Math.min(1, dt * 14);
  } else {
    runtime.floorQ = runtime.floorQt;
  }

  // Mid-scrub: keep plate hidden so video is visible, hide portal
  if (runtime.floorQ > 0.005 && runtime.floorQ < 0.985) {
    if (plate) plate.classList.remove('is-end');
    if (runtime.callbacks.hidePortal) runtime.callbacks.hidePortal();
    if (runtime.callbacks.updateStageHotspot) runtime.callbacks.updateStageHotspot();
    if (runtime.callbacks.updateCreditBtnVisibility) runtime.callbacks.updateCreditBtnVisibility();
    if (runtime.callbacks.updateAtomVisibility) runtime.callbacks.updateAtomVisibility();
  }

  const panX = 0.5 + (runtime.platePanX - 0.5) * clamp01(runtime.floorQ);
  const loopPosVal = `${(panX * 100).toFixed(1)}% 50.0%`;
  if (dollyLayer) dollyLayer.style.setProperty('--pos', loopPosVal);
  if (plate) plate.style.setProperty('--pos', loopPosVal);

  if (!canVideo()) {
    if (plateB) plateB.style.opacity = clamp01(runtime.floorQ);
  } else if (dolly && Number.isFinite(dolly.duration) && dolly.duration > 0) {
    if (!dolly.paused) dolly.pause();
    const targetTime = clamp01(runtime.floorQ) * dolly.duration;
    if (!dolly.seeking && Math.abs(dolly.currentTime - targetTime) > 0.012) {
      try { dolly.currentTime = targetTime; } catch (e) {}
    }
  }

  // Settle at End Frame: high-res plateB (_end.webp) + show OPEN PAGE & hotspot
  if (runtime.floorQt >= 0.99 && runtime.floorQ >= 0.985 && !runtime.busy) {
    runtime.floorQ = runtime.floorQt = 1;
    if (plateB) plateB.style.opacity = '1';
    if (dolly && Number.isFinite(dolly.duration)) {
      try { dolly.currentTime = dolly.duration; } catch (e) {}
    }
    if (plate) {
      plate.classList.remove('no-fade');
      plate.classList.add('is-end');
    }
    if (scrollCue) scrollCue.classList.add('is-hidden');
    if (stage) stage.classList.remove('is-waiting-scroll');
    if (runtime.callbacks.updateCreditBtnVisibility) runtime.callbacks.updateCreditBtnVisibility();
    if (runtime.callbacks.updateAtomVisibility) runtime.callbacks.updateAtomVisibility();
    runtime.floorRaf = 0;
    if (runtime.callbacks.arrive) runtime.callbacks.arrive(runtime.cur, runtime.token);
    return;
  }

  // Settle back at Start Frame: video's first frame directly (currentTime = 0) + show SCROLL cue
  if (runtime.floorQt <= 0.001 && runtime.floorQ <= 0.005 && !runtime.busy) {
    runtime.floorQ = runtime.floorQt = 0;
    if (plateB) plateB.style.opacity = '0';
    runtime.platePanX = 0.5;
    runtime.platePanY = 0.5;
    if (dollyLayer) dollyLayer.style.setProperty('--pos', '50.0% 50.0%');
    if (plate) plate.style.setProperty('--pos', '50.0% 50.0%');
    if (dolly && Number.isFinite(dolly.duration)) {
      try { dolly.currentTime = 0; } catch (e) {}
    }
    if (plate) plate.classList.remove('is-end');
    if (stage) stage.classList.add('is-waiting-scroll');
    if (scrollCue) scrollCue.classList.remove('is-hidden');
    if (runtime.callbacks.updateStageHotspot) runtime.callbacks.updateStageHotspot();
    if (runtime.callbacks.updateCreditBtnVisibility) runtime.callbacks.updateCreditBtnVisibility();
    if (runtime.callbacks.updateAtomVisibility) runtime.callbacks.updateAtomVisibility();
    runtime.floorRaf = 0;
    return;
  }

  if (Math.abs(runtime.floorQt - runtime.floorQ) > 0.0004) {
    runtime.floorRaf = requestAnimationFrame(floorLoop);
  } else {
    runtime.floorRaf = 0;
  }
}

export function startFloorLoop() {
  if (!runtime.floorRaf) {
    runtime.floorLast = performance.now();
    runtime.floorRaf = requestAnimationFrame(floorLoop);
  }
}

export function floorNudge(d) {
  if (runtime.busy || runtime.state !== 'floor' || runtime.cur < 1) return;
  runtime.floorQt = clamp01(runtime.floorQt + d);
  startFloorLoop();
}

// Media event bindings for video decoder stability
if (dolly) {
  ['play', 'playing'].forEach((ev) => {
    dolly.addEventListener(ev, () => { try { dolly.pause(); } catch (e) {} });
  });
  dolly.addEventListener('loadedmetadata', () => {
    dolly.pause();
    if (runtime.state === 'floor' && Number.isFinite(dolly.duration) && dolly.duration > 0) {
      try { dolly.currentTime = clamp01(runtime.floorQ) * dolly.duration; } catch (e) {}
    }
  });
  dolly.addEventListener('error', () => {
    const s = dolly.currentSrc || dolly.getAttribute('src');
    if (!s || s === window.location.href || s === 'about:blank') return;
    runtime.videoBroken = true;
    if (stage) stage.classList.add('is-video-fallback');
    if (plate) plate.classList.remove('no-fade');
  });
}

if (heroVideo) {
  ['play', 'playing', 'timeupdate'].forEach((ev) => {
    heroVideo.addEventListener(ev, () => {
      if (!runtime.heroUnlocking && !heroVideo.paused) {
        try { heroVideo.pause(); } catch (e) {}
      }
    });
  });
  if (heroVideo.readyState >= 1) {
    syncHeroFrame();
  } else {
    heroVideo.addEventListener('loadedmetadata', syncHeroFrame, { once: true });
    heroVideo.addEventListener('loadeddata', syncHeroFrame, { once: true });
  }
  window.addEventListener('touchstart', unlockHeroDecoder, { passive: true });
  window.addEventListener('pointerdown', unlockHeroDecoder, { passive: true });
}
