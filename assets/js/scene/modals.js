/**
 * TESHIMA LAB Portfolio — Modal Controllers
 * Handles HAL 9000 Cipher Terminal, Hint Dialog, and Production Credit Modal.
 */
import {
  $, headerCreditBtn, creditModal, creditModalClose,
  cipherModal, authCard, keyInput, cipherForm,
  cipherHintModal, cipherHintOkBtn, plate
} from './dom.js';
import { runtime } from './state.js';
import { AUTH_CONFIG } from './config.js';

export function updateCreditBtnPosition() {
  const btn = headerCreditBtn || $('headerCreditBtn');
  const rail = $('rail');
  const headerLeft = document.querySelector('.lab__header-left');
  const headerRight = document.querySelector('.lab__header-right');
  if (!btn || !rail || !headerLeft || !headerRight) return;

  const boxRatio = window.innerWidth / window.innerHeight;
  const isLandscape = boxRatio >= 1.05;
  const stageEl = $('stage');
  const isFloorState = runtime.state === 'floor' || (stageEl && stageEl.dataset.state === 'floor');

  let isColliding = false;
  if (isFloorState && isLandscape) {
    const railRect = rail.getBoundingClientRect();
    const headerRect = document.querySelector('.lab__header')?.getBoundingClientRect();
    const headerBottom = headerRect ? headerRect.bottom : 65;

    if (railRect.top <= headerBottom + 50 || window.innerHeight <= 720) {
      isColliding = true;
    }
  }

  if (isColliding) {
    if (btn.parentElement !== headerLeft) {
      headerLeft.appendChild(btn);
    }
    btn.classList.add('is-next-to-portfolio');
  } else {
    if (btn.parentElement !== headerRight) {
      headerRight.appendChild(btn);
    }
    btn.classList.remove('is-next-to-portfolio');
  }
}

export function hideCreditBtn() {
  const btn = headerCreditBtn || $('headerCreditBtn');
  if (!btn) return;
  btn.hidden = true;
  btn.style.display = 'none';
}

runtime.callbacks.hideCreditBtn = hideCreditBtn;

export function updateCreditBtnVisibility() {
  const btn = headerCreditBtn || $('headerCreditBtn');
  if (!btn) return;
  if (runtime.state === 'floor' && runtime.cur === 5 && plate && plate.classList.contains('is-end')) {
    btn.hidden = false;
    btn.style.display = 'inline-block';
  } else {
    btn.hidden = true;
    btn.style.display = 'none';
  }
  updateCreditBtnPosition();
}

runtime.callbacks.updateCreditBtnVisibility = updateCreditBtnVisibility;

export function openCreditModal() {
  const modal = creditModal || $('creditModal');
  if (!modal) return;
  modal.hidden = false;
}

export function closeCreditModal() {
  const modal = creditModal || $('creditModal');
  if (!modal) return;
  modal.hidden = true;
  updateCreditBtnVisibility();
}

/* ---------------- B???F Secured Access Terminal ---------------- */

export function isSecretUnlocked() {
  try {
    const raw = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY) || sessionStorage.getItem(AUTH_CONFIG.STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data && data.unlocked && data.expiresAt > Date.now()) {
      return true;
    }
  } catch (e) {
    if (sessionStorage.getItem(AUTH_CONFIG.STORAGE_KEY) === 'unlocked') return true;
  }
  return false;
}

export function setSecretUnlocked() {
  const payload = JSON.stringify({
    unlocked: true,
    expiresAt: Date.now() + AUTH_CONFIG.EXPIRATION_MS
  });
  try { localStorage.setItem(AUTH_CONFIG.STORAGE_KEY, payload); } catch (e) {}
  try { sessionStorage.setItem(AUTH_CONFIG.STORAGE_KEY, payload); } catch (e) {}
}

export function resetViewportZoomAndScroll() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.documentElement.scrollLeft = 0;
  document.body.scrollTop = 0;
  document.body.scrollLeft = 0;
}

export function openCipherModal() {
  if (!cipherModal) return;
  const authBtn = $('btn');
  document.body.classList.add('cipher-locked');
  cipherModal.hidden = false;
  cipherModal.style.display = 'flex';
  cipherModal.style.opacity = '1';
  if (authCard) authCard.classList.remove('is-authenticated', 'success-border');
  if (authBtn) {
    authBtn.textContent = '認証';
    authBtn.classList.remove('btn-success');
    authBtn.disabled = false;
  }
  if (keyInput) {
    keyInput.value = '';
    keyInput.classList.remove('input-valid', 'is-error');
    keyInput.disabled = false;
    keyInput.blur();
  }
  if (document.activeElement && document.activeElement.blur) {
    document.activeElement.blur();
  }
}

export function closeCipherModal() {
  if (!cipherModal) return;
  if (keyInput) keyInput.blur();
  document.body.classList.remove('cipher-locked');
  cipherModal.hidden = true;
  cipherModal.style.display = 'none';
  cipherModal.style.opacity = '';
  resetViewportZoomAndScroll();
  if (runtime.callbacks.onLayoutOrOrientationChange) {
    runtime.callbacks.onLayoutOrOrientationChange();
  }
}

export function handleCipherUnlock() {
  setSecretUnlocked();
  const authBtn = $('btn');

  if (keyInput) {
    keyInput.blur();
    keyInput.classList.add('input-valid');
    keyInput.disabled = true;
  }
  resetViewportZoomAndScroll();
  if (authCard) {
    authCard.classList.add('is-authenticated', 'success-border');
  }
  if (authBtn) {
    authBtn.classList.add('btn-success');
    authBtn.textContent = '承認完了';
    authBtn.disabled = true;
  }

  setTimeout(() => {
    cipherModal.style.transition = 'opacity 0.35s ease';
    cipherModal.style.opacity = '0';
    setTimeout(() => {
      closeCipherModal();
      if (runtime.callbacks.jump) {
        runtime.callbacks.jump(5); // Transition to B???F
      }
    }, 350);
  }, 950);
}

export function handleCipherError() {
  if (keyInput) {
    keyInput.classList.add('is-error');
    setTimeout(() => {
      keyInput.classList.remove('is-error');
    }, 600);
  }
}

export function openCipherHint() {
  if (cipherHintModal) cipherHintModal.hidden = false;
}

export function closeCipherHint() {
  if (cipherHintModal) cipherHintModal.hidden = true;
}

export function initModalListeners() {
  if (headerCreditBtn) headerCreditBtn.addEventListener('click', openCreditModal);
  if (creditModalClose) creditModalClose.addEventListener('click', closeCreditModal);

  if (creditModal) {
    ['wheel', 'touchmove', 'pointerdown', 'click', 'touchstart'].forEach((ev) => {
      creditModal.addEventListener(ev, (e) => {
        if (!e.target.closest('.creditModal__dialog')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, { passive: false });
    });
  }

  if (cipherForm) {
    cipherForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = (keyInput?.value || '').trim().replace(/\s+/g, '').toLowerCase();
      if (val === 'ハングリーアート' || val === 'hungryart' || val === 'hungry-art' || val === 'hungry_art') {
        handleCipherUnlock();
      } else {
        handleCipherError();
      }
    });
  }

  const cipherHintBtn = $('cipherHintBtn');
  const cipherHintClose = $('cipherHintClose');
  const cipherHintBackdrop = $('cipherHintBackdrop');
  const cipherCancel = $('cipherCancel');

  if (cipherHintBtn) cipherHintBtn.addEventListener('click', openCipherHint);
  if (cipherHintClose) cipherHintClose.addEventListener('click', closeCipherHint);
  if (cipherHintOkBtn) cipherHintOkBtn.addEventListener('click', closeCipherHint);
  if (cipherHintBackdrop) cipherHintBackdrop.addEventListener('click', closeCipherHint);
  if (cipherCancel) cipherCancel.addEventListener('click', closeCipherModal);

  if (cipherModal) {
    const backdrop = $('cipherModalBackdrop');
    ['wheel', 'touchmove', 'pointerdown', 'click'].forEach((ev) => {
      cipherModal.addEventListener(ev, (e) => {
        if (e.target === cipherModal || e.target === backdrop) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, { passive: false });
    });
  }

  if (keyInput) {
    keyInput.addEventListener('blur', () => {
      setTimeout(resetViewportZoomAndScroll, 60);
    });
  }
}
