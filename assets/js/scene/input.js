/**
 * TESHIMA LAB - Scene Input Controller
 * Handles wheel, touch gestures, mouse drag-to-pan, keyboard shortcuts,
 * and responsive orientation / layout resize observers.
 */

import { PATH } from './config.js';
import {
  $, stage, plate, plateA, plateB, dollyLayer, scrollCue,
  cipherModal, creditModal
} from './dom.js';
import { runtime, clamp01 } from './state.js';
import { heroNudge, floorNudge, startFloorLoop } from './scrub-engine.js';
import { seq, seqNudge, seqSize, drawSeq } from './lobby.js';
import { updateStageHotspot } from './hotspots.js';
import { updateAtomDollPosition } from './atom.js';
import {
  updateCreditBtnVisibility, updateCreditBtnPosition,
  closeCreditModal, closeCipherModal
} from './modals.js';
import { goHero, jump } from './navigation.js';

let touchStartX = null, touchStartY = null;
let touchOriginX = null, touchOriginY = null;
let isMouseDown = false;
let mouseStartX = null, mouseStartY = null;
let mouseOriginX = null, mouseOriginY = null;

export function onLayoutOrOrientationChange() {
  seq.dirty = true;
  seqSize();
  if (runtime.state === 'lobby' || (runtime.state === 'floor' && runtime.cur === 0)) {
    drawSeq();
  }
  if (runtime.state === 'floor') {
    const boxRatio = window.innerWidth / window.innerHeight;
    const isLandscape = boxRatio >= 1.05;
    const isMobileLandscape = ('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
      window.innerWidth <= 950 && window.innerHeight <= 560 && isLandscape;

    if (isMobileLandscape) {
      runtime.platePanX = 0.5;
      runtime.platePanY = 0.5;
      const pVal = '50.0% 50.0%';
      if (plate) plate.style.setProperty('--pos', pVal);
      if (dollyLayer) dollyLayer.style.setProperty('--pos', pVal);
      updateStageHotspot(0.5, 0.5);
      if (runtime.cur === 2) updateAtomDollPosition(0.5, 0.5);
    } else if (isLandscape) {
      runtime.platePanX = 0.5;
      const pVal = `50.0% ${(runtime.platePanY * 100).toFixed(1)}%`;
      if (plate) plate.style.setProperty('--pos', pVal);
      if (dollyLayer) dollyLayer.style.setProperty('--pos', pVal);
      updateStageHotspot(0.5, runtime.platePanY);
      if (runtime.cur === 2) updateAtomDollPosition(0.5, runtime.platePanY);
    } else {
      runtime.platePanY = 0.5;
      const pVal = `${(runtime.platePanX * 100).toFixed(1)}% 50.0%`;
      if (plate) plate.style.setProperty('--pos', pVal);
      if (dollyLayer) dollyLayer.style.setProperty('--pos', pVal);
      updateStageHotspot(runtime.platePanX, 0.5);
      if (runtime.cur === 2) updateAtomDollPosition(runtime.platePanX, 0.5);
    }

    if (runtime.cur === 0) {
      if (plateA && !plateA.src.includes('lobby_end')) plateA.src = PATH.lobbyEnd;
      if (plateB && !plateB.src.includes('lobby_end')) plateB.src = PATH.lobbyEnd;
      if (plate) plate.classList.add('is-end');
    }
  }
  updateCreditBtnVisibility();
  updateCreditBtnPosition();
}

export function initInputListeners() {
  /* ---------------- Wheel Handling ---------------- */
  window.addEventListener('wheel', e => {
    if (creditModal && !creditModal.hidden) return;
    e.preventDefault();

    if (runtime.state === 'hero') {
      if (scrollCue) scrollCue.classList.add('is-hidden');
      heroNudge(e.deltaY / 4800);
    } else if (runtime.state === 'lobby') {
      seqNudge(e.deltaY / 2400);
    } else if (runtime.state === 'floor') {
      if (runtime.cur === 0 || (plate && plate.classList.contains('is-end'))) {
        if (performance.now() - runtime.floorArrivedTime < 250) {
          return;
        }

        const boxRatio = window.innerWidth / window.innerHeight;
        const isLandscape = boxRatio >= 1.05;

        if (isLandscape) {
          const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);

          if (isHorizontal) {
            const isMobileLandscape = ('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
              window.innerWidth <= 950 && window.innerHeight <= 560;
            const isStandardPC = !('ontouchstart' in window) && window.innerWidth >= 1024 && boxRatio <= 2.1;
            if (isStandardPC || isMobileLandscape) {
              return;
            }

            if (Math.abs(e.deltaX) > 0.5) {
              runtime.platePanY = clamp01(runtime.platePanY + e.deltaX / (window.innerHeight * 1.5));
            }
            runtime.platePanX = 0.5;

            const pVal = `50.0% ${(runtime.platePanY * 100).toFixed(1)}%`;
            if (plate) plate.style.setProperty('--pos', pVal);
            if (dollyLayer) dollyLayer.style.setProperty('--pos', pVal);
            updateStageHotspot(0.5, runtime.platePanY);
            if (runtime.cur === 2) updateAtomDollPosition(0.5, runtime.platePanY);
            if (runtime.cur === 0) {
              seq.dirty = true;
              drawSeq();
            }
            return;
          } else {
            if (e.deltaY < -15) {
              runtime.platePanX = 0.5;
              runtime.platePanY = 0.5;
              if (plate) plate.style.setProperty('--pos', '50.0% 50.0%');
              if (dollyLayer) dollyLayer.style.setProperty('--pos', '50.0% 50.0%');
              updateStageHotspot(0.5, 0.5);
              if (runtime.cur === 2) updateAtomDollPosition(0.5, 0.5);

              if (runtime.cur === 0) {
                const initQt = Math.min(0.90, 0.96 + e.deltaY / 2400);
                goHero({ fromLobby: true, initialQt: initQt });
                return;
              }
              if (scrollCue) scrollCue.classList.add('is-hidden');
              stage.classList.remove('is-waiting-scroll');
              runtime.floorQ.qt = Math.min(0.90, runtime.floorQ.qt + e.deltaY / 2400);
              startFloorLoop();
              return;
            }
            return;
          }
        } else {
          const isHorizontalSwipe = Math.abs(e.deltaX) > Math.abs(e.deltaY);

          if (isHorizontalSwipe) {
            if (Math.abs(e.deltaX) > 0.5) {
              runtime.platePanX = clamp01(runtime.platePanX + e.deltaX / (window.innerWidth * 1.5));
            }
            runtime.platePanY = 0.5;

            const pVal = `${(runtime.platePanX * 100).toFixed(1)}% 50.0%`;
            if (plate) plate.style.setProperty('--pos', pVal);
            if (dollyLayer) dollyLayer.style.setProperty('--pos', pVal);
            updateStageHotspot(runtime.platePanX, 0.5);
            if (runtime.cur === 2) updateAtomDollPosition(runtime.platePanX, 0.5);
            if (runtime.cur === 0) {
              seq.dirty = true;
              drawSeq();
            }
            return;
          } else {
            if (e.deltaY < -15) {
              if (runtime.cur === 0) {
                const initQt = Math.min(0.90, 0.96 + e.deltaY / 2400);
                goHero({ fromLobby: true, initialQt: initQt });
                return;
              }
              if (scrollCue) scrollCue.classList.add('is-hidden');
              stage.classList.remove('is-waiting-scroll');
              runtime.floorQ.qt = Math.min(0.90, runtime.floorQ.qt + e.deltaY / 2400);
              startFloorLoop();
              return;
            }
            return;
          }
        }
      }
      if (scrollCue) scrollCue.classList.add('is-hidden');
      stage.classList.remove('is-waiting-scroll');
      floorNudge(e.deltaY / 2400);
    }
  }, { passive: false });

  /* ---------------- Touch Handling ---------------- */
  stage.addEventListener('touchstart', e => {
    if (creditModal && !creditModal.hidden) {
      touchStartX = null;
      touchStartY = null;
      return;
    }
    const isBlockingUI = e.target.closest('.contactLayer, .cipherModal, .creditModal, .cipherHintModal, .lab__header, .lab__rail, .atomBubble, button');
    if (isBlockingUI) {
      touchStartX = null;
      touchStartY = null;
      return;
    }
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchOriginX = touchStartX;
    touchOriginY = touchStartY;
  }, { passive: true });

  stage.addEventListener('touchmove', e => {
    if (creditModal && !creditModal.hidden) return;
    if (touchStartY == null || touchStartX == null) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const dx = touchStartX - x;
    const dy = touchStartY - y;

    if (touchOriginX != null && touchOriginY != null) {
      const dist = Math.hypot(x - touchOriginX, y - touchOriginY);
      if (dist > 8) {
        runtime.isTouchDragging = true;
        runtime.lastDragTime = performance.now();
      }
    }

    if (runtime.state === 'hero') {
      if (scrollCue) scrollCue.classList.add('is-hidden');
      const step = dy < 0
        ? Math.max(-0.028, dy / (window.innerHeight * 3.0))
        : Math.min(0.012, dy / (window.innerHeight * 5));
      heroNudge(step);
      touchStartY = y;
      touchStartX = x;
    } else if (runtime.state === 'lobby') {
      seqNudge((touchStartY - y) / (window.innerHeight * 3.0));
      touchStartY = y;
      touchStartX = x;
    } else if (runtime.state === 'floor') {
      if (runtime.cur === 0 || (plate && plate.classList.contains('is-end'))) {
        if (performance.now() - runtime.floorArrivedTime < 250) {
          touchStartY = y;
          touchStartX = x;
          return;
        }

        const boxRatio = window.innerWidth / window.innerHeight;
        const isLandscape = boxRatio >= 1.05;

        if (isLandscape) {
          const isHorizontal = Math.abs(dx) > Math.abs(dy);

          if (isHorizontal) {
            touchStartY = y;
            touchStartX = x;
            return;
          } else {
            if (dy < -12) {
              runtime.platePanX = 0.5;
              runtime.platePanY = 0.5;
              if (plate) plate.style.setProperty('--pos', '50.0% 50.0%');
              if (dollyLayer) dollyLayer.style.setProperty('--pos', '50.0% 50.0%');
              updateStageHotspot(0.5, 0.5);
              if (runtime.cur === 2) updateAtomDollPosition(0.5, 0.5);

              touchStartY = y;
              touchStartX = x;
              if (runtime.cur === 0) {
                const initQt = Math.min(0.90, 0.96 + dy / (window.innerHeight * 3.0));
                goHero({ fromLobby: true, initialQt: initQt });
                return;
              }
              if (scrollCue) scrollCue.classList.add('is-hidden');
              stage.classList.remove('is-waiting-scroll');
              runtime.floorQ.qt = Math.min(0.90, runtime.floorQ.qt + dy / (window.innerHeight * 3.0));
              startFloorLoop();
              return;
            }
            if (dy > 0) {
              touchStartY = y;
              touchStartX = x;
            }
            return;
          }
        } else {
          const isHorizontalSwipe = Math.abs(dx) > Math.abs(dy);

          if (isHorizontalSwipe) {
            if (Math.abs(dx) > 0.8) {
              runtime.platePanX = clamp01(runtime.platePanX + dx / (window.innerWidth * 1.2));
            }
            runtime.platePanY = 0.5;

            const pVal = `${(runtime.platePanX * 100).toFixed(1)}% 50.0%`;
            if (plate) plate.style.setProperty('--pos', pVal);
            if (dollyLayer) dollyLayer.style.setProperty('--pos', pVal);
            updateStageHotspot(runtime.platePanX, 0.5);
            if (runtime.cur === 2) updateAtomDollPosition(runtime.platePanX, 0.5);
            if (runtime.cur === 0) {
              seq.dirty = true;
              drawSeq();
            }
            touchStartY = y;
            touchStartX = x;
            return;
          } else {
            if (dy < -12) {
              runtime.platePanX = 0.5;
              runtime.platePanY = 0.5;
              if (plate) plate.style.setProperty('--pos', '50.0% 50.0%');
              if (dollyLayer) dollyLayer.style.setProperty('--pos', '50.0% 50.0%');
              updateStageHotspot(0.5, 0.5);
              if (runtime.cur === 2) updateAtomDollPosition(0.5, 0.5);

              touchStartY = y;
              touchStartX = x;
              if (runtime.cur === 0) {
                const initQt = Math.min(0.90, 0.96 + dy / (window.innerHeight * 3.0));
                goHero({ fromLobby: true, initialQt: initQt });
                return;
              }
              if (scrollCue) scrollCue.classList.add('is-hidden');
              stage.classList.remove('is-waiting-scroll');
              runtime.floorQ.qt = Math.min(0.90, runtime.floorQ.qt + dy / (window.innerHeight * 3.0));
              startFloorLoop();
              return;
            }
            if (dy > 0) {
              touchStartY = y;
              touchStartX = x;
            }
            return;
          }
        }
      }
      touchStartY = y;
      touchStartX = x;
      if (scrollCue) scrollCue.classList.add('is-hidden');
      stage.classList.remove('is-waiting-scroll');
      floorNudge(dy / (window.innerHeight * 3.0));
    }
  }, { passive: true });

  ['touchend', 'touchcancel'].forEach(ev => {
    stage.addEventListener(ev, () => {
      touchStartX = null;
      touchStartY = null;
      touchOriginX = null;
      touchOriginY = null;
      setTimeout(() => {
        runtime.isTouchDragging = false;
      }, 150);
    }, { passive: true });
  });

  /* ---------------- Desktop Mouse Drag-to-Pan ---------------- */
  stage.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    if (creditModal && !creditModal.hidden) return;
    const isBlockingUI = e.target.closest('.contactLayer, .cipherModal, .creditModal, .cipherHintModal, .lab__header, .lab__rail, .atomBubble, button');
    if (isBlockingUI) return;

    isMouseDown = true;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
    mouseOriginX = mouseStartX;
    mouseOriginY = mouseStartY;
  });

  window.addEventListener('mousemove', e => {
    if (!isMouseDown || mouseStartX == null || mouseStartY == null) return;
    const x = e.clientX;
    const y = e.clientY;
    const dx = mouseStartX - x;
    const dy = mouseStartY - y;

    const dist = Math.hypot(x - mouseOriginX, y - mouseOriginY);
    if (dist > 8) {
      runtime.isTouchDragging = true;
      runtime.lastDragTime = performance.now();
    }

    if (runtime.state === 'floor') {
      if (runtime.cur === 0 || (plate && plate.classList.contains('is-end'))) {
        const boxRatio = window.innerWidth / window.innerHeight;
        const isLandscape = boxRatio >= 1.05;

        if (isLandscape) {
          const isHorizontal = Math.abs(dx) > Math.abs(dy);
          if (isHorizontal && Math.abs(dx) > 0.8) {
            runtime.platePanY = clamp01(runtime.platePanY + dx / (window.innerHeight * 1.5));
            runtime.platePanX = 0.5;
            const pVal = `50.0% ${(runtime.platePanY * 100).toFixed(1)}%`;
            if (plate) plate.style.setProperty('--pos', pVal);
            if (dollyLayer) dollyLayer.style.setProperty('--pos', pVal);
            updateStageHotspot(0.5, runtime.platePanY);
            if (runtime.cur === 2) updateAtomDollPosition(0.5, runtime.platePanY);
            if (runtime.cur === 0) { seq.dirty = true; drawSeq(); }
          }
        } else {
          const isHorizontalSwipe = Math.abs(dx) > Math.abs(dy);
          if (isHorizontalSwipe && Math.abs(dx) > 0.8) {
            runtime.platePanX = clamp01(runtime.platePanX + dx / (window.innerWidth * 1.2));
            runtime.platePanY = 0.5;
            const pVal = `${(runtime.platePanX * 100).toFixed(1)}% 50.0%`;
            if (plate) plate.style.setProperty('--pos', pVal);
            if (dollyLayer) dollyLayer.style.setProperty('--pos', pVal);
            updateStageHotspot(runtime.platePanX, 0.5);
            if (runtime.cur === 2) updateAtomDollPosition(runtime.platePanX, 0.5);
            if (runtime.cur === 0) { seq.dirty = true; drawSeq(); }
          }
        }
      }
    }
    mouseStartX = x;
    mouseStartY = y;
  });

  window.addEventListener('mouseup', () => {
    isMouseDown = false;
    mouseStartX = null;
    mouseStartY = null;
    mouseOriginX = null;
    mouseOriginY = null;
    setTimeout(() => { runtime.isTouchDragging = false; }, 150);
  });

  /* ---------------- Keyboard Shortcuts ---------------- */
  window.addEventListener('keydown', e => {
    runtime.usedKeyboard = true;
    if (e.key === 'Escape') {
      if (cipherModal && !cipherModal.hidden) closeCipherModal();
      if (creditModal && !creditModal.hidden) closeCreditModal();
      return;
    }

    const adv = e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ' || e.key === 'Enter';
    const rev = e.key === 'ArrowUp' || e.key === 'PageUp';

    if (runtime.state === 'hero') {
      if (adv) {
        if (e.target.closest && e.target.closest('button,a')) return;
        e.preventDefault();
        if (scrollCue) scrollCue.classList.add('is-hidden');
        heroNudge(0.006);
      } else if (rev) {
        e.preventDefault();
        heroNudge(-0.006);
      }
      return;
    }
    if (runtime.state === 'lobby') {
      if (adv) {
        if (e.target.closest && e.target.closest('button,a')) return;
        e.preventDefault();
        seq.auto = true;
      } else if (rev) {
        e.preventDefault();
        seqNudge(-0.008);
      }
      return;
    }
    if (runtime.state === 'floor') {
      if (runtime.cur === 0) {
        if (rev) {
          e.preventDefault();
          goHero({ fromLobby: true });
          return;
        }
      } else {
        if (adv) {
          if (e.target.closest && e.target.closest('button,a')) return;
          e.preventDefault();
          if (scrollCue) scrollCue.classList.add('is-hidden');
          stage.classList.remove('is-waiting-scroll');
          floorNudge(0.012);
          return;
        } else if (rev) {
          e.preventDefault();
          floorNudge(-0.012);
          return;
        }
      }
    }
    if (/^[1-6]$/.test(e.key) && runtime.state === 'floor') {
      jump(+e.key - 1);
    }
  });

  window.addEventListener('pointerdown', () => {
    runtime.usedKeyboard = false;
  }, { passive: true });

  /* ---------------- Layout & Orientation Observers ---------------- */
  window.addEventListener('resize', onLayoutOrOrientationChange, { passive: true });

  const handleOrientation = () => {
    [0, 60, 150, 300, 500].forEach(delay => {
      setTimeout(onLayoutOrOrientationChange, delay);
    });
  };
  if (window.screen && window.screen.orientation) {
    window.screen.orientation.addEventListener('change', handleOrientation);
  }
  window.addEventListener('orientationchange', handleOrientation);

  if (window.ResizeObserver) {
    const stageObserver = new ResizeObserver(() => {
      onLayoutOrOrientationChange();
    });
    stageObserver.observe(stage);
  }

  // Prevent accidental pinch-to-zoom on iOS Safari that causes viewport clipping
  document.addEventListener('gesturestart', e => {
    e.preventDefault();
  }, { passive: false });
}
