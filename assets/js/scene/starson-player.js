/**
 * TESHIMA LAB Portfolio — B3F STARSON Soccer Ball & YouTube Floating Player
 * Ultra-minimalist: invisible circular hitbox over the Juventus ball,
 * and official YouTube embed floating player (50% translucent chic, draggable).
 */
import { $, plate } from './dom.js';
import { runtime } from './state.js';
import { getCoverRect } from './hotspots.js';
import { MASTER_W, MASTER_H } from './config.js';

// Exact physical pixel boundaries of the soccer ball on master 2752x1536 photography
const BALL_COORDS = Object.freeze({
  x: 804 / MASTER_W,
  y: 1060 / MASTER_H,
  w: 174 / MASTER_W,
  h: 175 / MASTER_H
});

const YOUTUBE_URL = 'https://www.youtube.com/embed/jDQskNZH074?autoplay=1&rel=0&enablejsapi=1&vq=hd1080&playsinline=1';

let ytPlayer = null;

function initYtPlayer() {
  if (window.YT && window.YT.Player && !ytPlayer) {
    try {
      ytPlayer = new window.YT.Player('starsonIframe', {
        events: {
          onReady: (event) => {
            try {
              event.target.setPlaybackQuality('hd1080');
              event.target.setPlaybackQuality('highres');
            } catch (_) {}
          },
          onStateChange: (event) => {
            if (window.YT && window.YT.PlayerState && event.data === window.YT.PlayerState.PLAYING) {
              try {
                event.target.setPlaybackQuality('hd1080');
                event.target.setPlaybackQuality('highres');
              } catch (_) {}
            }
          }
        }
      });
    } catch (_) {}
  }
}

export function updateStarsonHotspotPosition(px = runtime.platePanX, py = runtime.platePanY) {
  const hotspot = $('ballHotspot');
  if (!hotspot || runtime.cur !== 3) return;

  const cover = getCoverRect(MASTER_W, MASTER_H, window.innerWidth, window.innerHeight, px, py);
  let left = cover.offsetX + BALL_COORDS.x * cover.renderW;
  let top = cover.offsetY + BALL_COORDS.y * cover.renderH;
  let width = BALL_COORDS.w * cover.renderW;
  let height = BALL_COORDS.h * cover.renderH;

  const isMobilePortrait = window.innerWidth <= 780 && window.innerHeight > window.innerWidth;
  if (isMobilePortrait) {
    const minTouchSize = 64;
    width = Math.max(width, minTouchSize);
    height = Math.max(height, minTouchSize);
    // Keep touch target on-screen on narrow mobile portrait
    left = Math.max(16, Math.min(left, window.innerWidth - width - 16));
    top = Math.max(90, Math.min(top, window.innerHeight - height - 120));
  }

  hotspot.style.left = `${left}px`;
  hotspot.style.top = `${top}px`;
  hotspot.style.width = `${width}px`;
  hotspot.style.height = `${height}px`;
}

export function stopStarsonVideo() {
  if (ytPlayer && ytPlayer.stopVideo) {
    try { ytPlayer.stopVideo(); } catch (_) {}
  }
  const iframe = $('starsonIframe');
  if (iframe && iframe.src) {
    iframe.src = '';
  }
  ytPlayer = null;
  const modal = $('starsonModal');
  if (modal && !modal.hidden) {
    modal.hidden = true;
    modal.classList.remove('is-active');
  }
}

export function openStarsonModal() {
  const modal = $('starsonModal');
  const iframe = $('starsonIframe');
  if (!modal) return;

  // Clear any inline drag coordinates on mobile so CSS media queries control placement
  if (window.innerWidth <= 780 || (window.matchMedia && window.matchMedia('(max-width: 1024px) and (orientation: portrait)').matches)) {
    modal.style.left = '';
    modal.style.top = '';
    modal.style.right = '';
    modal.style.bottom = '';
  }

  if (iframe) {
    if (!iframe.src || iframe.src === 'about:blank' || iframe.src === window.location.href) {
      iframe.src = YOUTUBE_URL;
    }
    setTimeout(initYtPlayer, 400);
  }
  modal.hidden = false;
  void modal.offsetWidth;
  modal.classList.add('is-active');
}

export function closeStarsonModal() {
  stopStarsonVideo();
}

export function updateStarsonVisibility() {
  const hotspot = $('ballHotspot');
  if (!hotspot) return;

  const isB3 = runtime.state === 'floor' && runtime.cur === 3 && plate && plate.classList.contains('is-end');

  if (isB3) {
    hotspot.hidden = false;
    updateStarsonHotspotPosition();
  } else {
    hotspot.hidden = true;
  }
}

// Register with runtime callbacks
runtime.callbacks.updateStarsonVisibility = updateStarsonVisibility;
runtime.callbacks.updateStarsonHotspotPosition = updateStarsonHotspotPosition;

export function initStarsonPlayer() {
  const hotspot = $('ballHotspot');
  const closeBtn = $('starsonModalClose');
  const modal = $('starsonModal');

  if (hotspot) {
    let lastTriggerTime = 0;
    const handleTrigger = (e) => {
      const now = performance.now();
      if (now - lastTriggerTime < 450) return;
      lastTriggerTime = now;
      if (e) {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
      }
      if (modal && !modal.hidden && modal.classList.contains('is-active')) {
        closeStarsonModal();
      } else {
        openStarsonModal();
      }
    };
    hotspot.addEventListener('click', handleTrigger);
    hotspot.addEventListener('touchend', (e) => {
      if (runtime.isTouchDragging || (performance.now() - runtime.lastDragTime < 350)) {
        return;
      }
      handleTrigger(e);
    }, { passive: false });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeStarsonModal();
    });
  }

  if (modal) {
    initDraggableStarsonModal(modal);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modal && !modal.hidden) {
        closeStarsonModal();
      }
    }
  });

  const forceHd = () => {
    if (ytPlayer && ytPlayer.setPlaybackQuality) {
      try {
        ytPlayer.setPlaybackQuality('hd1080');
        ytPlayer.setPlaybackQuality('highres');
      } catch (_) {}
    }
  };

  document.addEventListener('fullscreenchange', forceHd);
  document.addEventListener('webkitfullscreenchange', forceHd);

  updateStarsonVisibility();
}

function initDraggableStarsonModal(modal) {
  let isDragging = false;
  let startPointerX = 0;
  let startPointerY = 0;
  let startModalLeft = 0;
  let startModalTop = 0;

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest('button, a, .starsonIframeWrap, input, select')) {
      return;
    }

    const rect = modal.getBoundingClientRect();
    isDragging = true;
    startPointerX = e.clientX;
    startPointerY = e.clientY;
    startModalLeft = rect.left;
    startModalTop = rect.top;

    modal.style.left = `${rect.left}px`;
    modal.style.top = `${rect.top}px`;
    modal.style.bottom = 'auto';
    modal.style.right = 'auto';
    modal.classList.add('is-dragging');

    const iframeWrap = modal.querySelector('.starsonIframeWrap');
    if (iframeWrap) iframeWrap.style.pointerEvents = 'none';

    if (modal.setPointerCapture) {
      try {
        modal.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    e.preventDefault();
    e.stopPropagation();
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;

    const dx = e.clientX - startPointerX;
    const dy = e.clientY - startPointerY;

    const modalW = modal.offsetWidth;
    const modalH = modal.offsetHeight;
    const pad = 8;
    const minX = pad;
    const maxX = Math.max(pad, window.innerWidth - modalW - pad);
    const minY = pad;
    const maxY = Math.max(pad, window.innerHeight - modalH - pad);

    let newLeft = startModalLeft + dx;
    let newTop = startModalTop + dy;

    newLeft = Math.max(minX, Math.min(newLeft, maxX));
    newTop = Math.max(minY, Math.min(newTop, maxY));

    modal.style.left = `${newLeft}px`;
    modal.style.top = `${newTop}px`;

    e.preventDefault();
    e.stopPropagation();
  };

  const onPointerUp = (e) => {
    if (!isDragging) return;
    isDragging = false;
    modal.classList.remove('is-dragging');

    const iframeWrap = modal.querySelector('.starsonIframeWrap');
    if (iframeWrap) iframeWrap.style.pointerEvents = '';

    if (modal.releasePointerCapture) {
      try {
        modal.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  const onResize = () => {
    if (modal.hidden || modal.style.top === 'auto' || !modal.style.top) return;
    const rect = modal.getBoundingClientRect();
    const pad = 8;
    const minX = pad;
    const maxX = Math.max(pad, window.innerWidth - rect.width - pad);
    const minY = pad;
    const maxY = Math.max(pad, window.innerHeight - rect.height - pad);

    const clampedX = Math.max(minX, Math.min(rect.left, maxX));
    const clampedY = Math.max(minY, Math.min(rect.top, maxY));

    modal.style.left = `${clampedX}px`;
    modal.style.top = `${clampedY}px`;
  };

  modal.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('resize', onResize);
}
