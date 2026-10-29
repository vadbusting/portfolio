/**
 * TESHIMA LAB - Scene Orchestrator (Main Entrypoint)
 * Bootstraps modules, event listeners, lifecycle observers, and URL hash routing.
 */

import { FLOORS } from './config.js';
import {
  $, stage, rail, heroVideo, cenotaph, dolly, keyInput
} from './dom.js';
import { runtime, setState } from './state.js';
import { videoBlobCache } from './blob-cache.js';
import { seqSize, seqLoad } from './lobby.js';
import { syncHeroFrame } from './scrub-engine.js';
import { initHotspotListeners } from './hotspots.js';
import { initAtomListeners } from './atom.js';
import {
  initModalListeners, isSecretUnlocked, openCipherModal,
  resetViewportZoomAndScroll
} from './modals.js';
import { initInputListeners } from './input.js';
import {
  goHero, goLobbyEnd, toLobbyState, goFloor, jump
} from './navigation.js';

export function initScene() {
  // Initialize modular subsystems
  initHotspotListeners();
  initAtomListeners();
  initModalListeners();
  initInputListeners();

  // Rail floor buttons navigation
  if (rail) {
    rail.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      const targetIdx = +b.dataset.stageJump - 1;
      if (targetIdx === 5) {
        if (isSecretUnlocked()) {
          jump(5);
          return;
        }
        openCipherModal();
        return;
      }
      jump(targetIdx);
    });
  }

  // Brand header logo returns to HERO
  const brand = $('brand');
  if (brand) {
    brand.addEventListener('click', e => {
      e.preventDefault();
      goHero();
    });
  }

  // Key input iOS zoom reset
  if (keyInput) {
    keyInput.addEventListener('blur', () => {
      setTimeout(resetViewportZoomAndScroll, 60);
    });
  }

  // Debug hotspots overlay
  const params = new URLSearchParams(location.search);
  if (params.get('debug') === 'hotspots' || params.get('debug') === '1') {
    if (stage) stage.classList.add('is-debug-hotspots');
  }

  // Tab switch / bfcache lifecycle handlers
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (heroVideo && !heroVideo.paused) {
        try { heroVideo.pause(); } catch (e) {}
      }
      if (dolly && !dolly.paused) {
        try { dolly.pause(); } catch (e) {}
      }
    } else {
      if (runtime.state === 'hero' && heroVideo) {
        syncHeroFrame();
      }
    }
  });

  window.addEventListener('pageshow', e => {
    if (e.persisted) {
      if (heroVideo && !heroVideo.paused) {
        try { heroVideo.pause(); } catch (e) {}
      }
      if (dolly && !dolly.paused) {
        try { dolly.pause(); } catch (e) {}
      }
      if (runtime.state === 'hero' && heroVideo) {
        syncHeroFrame();
      }
    }
  });

  window.addEventListener('beforeunload', () => {
    for (const blobUrl of videoBlobCache.values()) {
      try { URL.revokeObjectURL(blobUrl); } catch (e) {}
    }
    videoBlobCache.clear();
  });

  // URL Hash Change Handler
  window.addEventListener('hashchange', () => {
    const k = location.hash.replace('#', '');
    const j = FLOORS.findIndex(f => f.key === k);
    if (j === 5 && !isSecretUnlocked()) {
      history.replaceState(null, '', location.pathname + (runtime.cur >= 0 ? '#' + FLOORS[runtime.cur].key : ''));
      openCipherModal();
      return;
    }
    if (j >= 0 && j !== runtime.cur) {
      if (j === 0) goLobbyEnd();
      else goFloor(j, { instant: false, force: true });
    } else if (k === 'top' || k === '') {
      goHero();
    }
  });

  /* ---------------- Initial Routing ---------------- */
  const hash = location.hash.replace('#', '');
  const idx = FLOORS.findIndex(f => f.key === hash);
  seqSize();

  if (idx === 5 && !isSecretUnlocked()) {
    history.replaceState(null, '', location.pathname);
    setState('hero');
    seqLoad();
    if (heroVideo) {
      heroVideo.pause();
      try { heroVideo.currentTime = 0; } catch (e) {}
    }
    openCipherModal();
  } else if (idx === 0) {
    setState('lobby');
    goLobbyEnd();
  } else if (idx > 0) {
    setState('floor');
    goFloor(idx, { instant: true, force: true });
  } else if (hash === 'lobby') {
    seqLoad();
    toLobbyState(0);
  } else {
    setState('hero');
    seqLoad();
    if (heroVideo) {
      heroVideo.pause();
      try { heroVideo.currentTime = 0; } catch (e) {}
    }
    if (cenotaph) {
      cenotaph.style.opacity = '1';
      cenotaph.style.pointerEvents = 'auto';
      cenotaph.style.filter = 'none';
      cenotaph.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  }
}

// Auto-run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScene);
} else {
  initScene();
}
