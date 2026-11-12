/**
 * TESHIMA LAB Portfolio — BRAUN Audio System & 2-Album SoundCloud Player
 * Ultra-minimalist: invisible hitbox (no borders/tooltips), 2-album chooser,
 * and official SoundCloud embed player with strict floor-isolation stop.
 */
import { $, plate } from './dom.js';
import { runtime } from './state.js';
import { getCoverRect } from './hotspots.js';
import { MASTER_W, MASTER_H } from './config.js';

// Exact physical pixel boundaries on master 2752x1536 photography
const BRAUN_COORDS = Object.freeze({
  // B2F (LP Floor): BRAUN RT 20 tuner/amp to the left of the MacBook
  2: {
    x: 525 / MASTER_W,
    y: 860 / MASTER_H,
    w: 460 / MASTER_W,
    h: 215 / MASTER_H
  },
  // B3F (WEB Floor): BRAUN desktop radio under the bonsai to the right of the monitor
  3: {
    x: 2185 / MASTER_W,
    y: 1040 / MASTER_H,
    w: 345 / MASTER_W,
    h: 230 / MASTER_H
  }
});

const ALBUMS = Object.freeze({
  noallies: {
    title: 'NO ALLIES',
    url: 'https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/jugend-34903360/sets/noallies&color=%23111111&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false'
  },
  paperscraps: {
    title: 'PAPER SCRAPS',
    url: 'https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/jugend-34903360/sets/paperscraps&color=%23111111&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false'
  }
});

export function updateBraunHotspotPosition(px = runtime.platePanX, py = runtime.platePanY) {
  const hotspot = $('braunHotspot');
  if (!hotspot) return;

  const box = BRAUN_COORDS[runtime.cur];
  if (!box) return;

  const cover = getCoverRect(MASTER_W, MASTER_H, window.innerWidth, window.innerHeight, px, py);
  hotspot.style.left = `${cover.offsetX + box.x * cover.renderW}px`;
  hotspot.style.top = `${cover.offsetY + box.y * cover.renderH}px`;
  hotspot.style.width = `${box.w * cover.renderW}px`;
  hotspot.style.height = `${box.h * cover.renderH}px`;
}

let scWidgetNoAllies = null;
let scWidgetPaperScraps = null;
let isNoAlliesReady = false;
let isPaperScrapsReady = false;

function getWidgets() {
  if (window.SC && window.SC.Widget) {
    const iframeNA = $('braunIframeNoAllies');
    const iframePS = $('braunIframePaperScraps');
    if (iframeNA && !scWidgetNoAllies) {
      scWidgetNoAllies = window.SC.Widget(iframeNA);
      try {
        scWidgetNoAllies.bind(window.SC.Widget.Events.READY, () => {
          isNoAlliesReady = true;
        });
      } catch (_) {}
    }
    if (iframePS && !scWidgetPaperScraps) {
      scWidgetPaperScraps = window.SC.Widget(iframePS);
      try {
        scWidgetPaperScraps.bind(window.SC.Widget.Events.READY, () => {
          isPaperScrapsReady = true;
        });
      } catch (_) {}
    }
  }
}

// Pre-initialize widgets immediately when SC loads
(function startScPoll() {
  let attempts = 0;
  const poll = setInterval(() => {
    attempts++;
    if (window.SC && window.SC.Widget) {
      getWidgets();
      clearInterval(poll);
    } else if (attempts > 60) {
      clearInterval(poll);
    }
  }, 100);
})();

export function stopBraunAudio() {
  getWidgets();
  if (scWidgetNoAllies) {
    try { scWidgetNoAllies.pause(); } catch (_) {}
  }
  if (scWidgetPaperScraps) {
    try { scWidgetPaperScraps.pause(); } catch (_) {}
  }
  const modal = $('braunModal');
  if (modal) {
    modal.classList.remove('is-active');
  }
  showSelectView();
}

export function showSelectView() {
  const selectView = $('braunSelectView');
  const playerView = $('braunPlayerView');
  if (selectView) selectView.classList.remove('is-hidden');
  if (playerView) playerView.classList.add('is-hidden');
}

export function playAlbum(key) {
  getWidgets();

  const selectView = $('braunSelectView');
  const playerView = $('braunPlayerView');
  const currentTitle = $('braunCurrentAlbum');
  const iframeNA = $('braunIframeNoAllies');
  const iframePS = $('braunIframePaperScraps');

  if (selectView) selectView.classList.add('is-hidden');
  if (playerView) playerView.classList.remove('is-hidden');

  if (key === 'noallies') {
    if (currentTitle) currentTitle.textContent = 'NO ALLIES';
    if (iframeNA) iframeNA.classList.remove('is-hidden');
    if (iframePS) iframePS.classList.add('is-hidden');

    if (scWidgetPaperScraps) {
      try { scWidgetPaperScraps.pause(); } catch (_) {}
    }
    if (scWidgetNoAllies) {
      try {
        scWidgetNoAllies.skip(0);
        scWidgetNoAllies.play();
      } catch (_) {}
      if (!isNoAlliesReady) {
        try {
          scWidgetNoAllies.bind(window.SC.Widget.Events.READY, () => {
            try {
              scWidgetNoAllies.skip(0);
              scWidgetNoAllies.play();
            } catch (_) {}
          });
        } catch (_) {}
      }
    }
  } else if (key === 'paperscraps') {
    if (currentTitle) currentTitle.textContent = 'PAPER SCRAPS';
    if (iframeNA) iframeNA.classList.add('is-hidden');
    if (iframePS) iframePS.classList.remove('is-hidden');

    if (scWidgetNoAllies) {
      try { scWidgetNoAllies.pause(); } catch (_) {}
    }
    if (scWidgetPaperScraps) {
      try {
        scWidgetPaperScraps.skip(0);
        scWidgetPaperScraps.play();
      } catch (_) {}
      if (!isPaperScrapsReady) {
        try {
          scWidgetPaperScraps.bind(window.SC.Widget.Events.READY, () => {
            try {
              scWidgetPaperScraps.skip(0);
              scWidgetPaperScraps.play();
            } catch (_) {}
          });
        } catch (_) {}
      }
    }
  }
}

export function openBraunModal() {
  const modal = $('braunModal');
  if (!modal) return;

  getWidgets();
  showSelectView();
  modal.classList.add('is-active');
}

export function closeBraunModal() {
  stopBraunAudio();
}

export function updateBraunVisibility() {
  const hotspot = $('braunHotspot');
  if (!hotspot) return;

  const isB2orB3 = runtime.state === 'floor' && (runtime.cur === 2 || runtime.cur === 3) && plate && plate.classList.contains('is-end');

  if (isB2orB3) {
    hotspot.hidden = false;
    updateBraunHotspotPosition();
  } else {
    hotspot.hidden = true;
  }
}

// Register with runtime callbacks
runtime.callbacks.updateBraunVisibility = updateBraunVisibility;
runtime.callbacks.updateBraunHotspotPosition = updateBraunHotspotPosition;

export function initBraunPlayer() {
  const hotspot = $('braunHotspot');
  const closeBtn = $('braunModalClose');
  const playerCloseBtn = $('braunPlayerClose');
  const backdrop = $('braunModalBackdrop');
  const backBtn = $('braunBackBtn');

  if (hotspot) {
    const handleTrigger = (e) => {
      e.stopPropagation();
      e.preventDefault();
      const modal = $('braunModal');
      if (modal && !modal.hidden && modal.classList.contains('is-active')) {
        closeBraunModal();
      } else {
        openBraunModal();
      }
    };
    hotspot.addEventListener('click', handleTrigger);
    hotspot.addEventListener('touchend', (e) => {
      if (runtime.isTouchDragging || (performance.now() - runtime.lastDragTime < 350)) {
        return;
      }
      handleTrigger(e);
    });
  }

  // Album card clicks
  document.querySelectorAll('.braunAlbumCard').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = btn.dataset.album;
      playAlbum(key);
    });
  });

  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (scWidgetNoAllies) {
        try { scWidgetNoAllies.pause(); } catch (_) {}
      }
      if (scWidgetPaperScraps) {
        try { scWidgetPaperScraps.pause(); } catch (_) {}
      }
      showSelectView();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeBraunModal();
    });
  }

  if (playerCloseBtn) {
    playerCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeBraunModal();
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      e.stopPropagation();
      closeBraunModal();
    });
  }

  // Draggable floating player (desktop mouse drag & mobile touch drag)
  const modal = $('braunModal');
  if (modal) {
    initDraggableBraunModal(modal);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = $('braunModal');
      if (modal && !modal.hidden) {
        closeBraunModal();
      }
    }
  });

  updateBraunVisibility();
}

function initDraggableBraunModal(modal) {
  let isDragging = false;
  let startPointerX = 0;
  let startPointerY = 0;
  let startModalLeft = 0;
  let startModalTop = 0;

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest('button, a, .braunAlbumCard, .braunIframeWrap, input, select')) {
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

    const iframeWrap = modal.querySelector('.braunIframeWrap');
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

    const iframeWrap = modal.querySelector('.braunIframeWrap');
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
