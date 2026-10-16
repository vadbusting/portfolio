/* ============================================================
   SUBPAGE COMMON CONTROLLER
   Contact Modal handling & unified keyboard / click interactions
   ============================================================ */

(function () {
  'use strict';

  function initSubpageCommon() {
    const modal = document.getElementById('cenotaphModal');
    const openBtns = document.querySelectorAll('[data-contact-open], .menu-btn');
    const closeBtns = document.querySelectorAll('[data-contact-close], .cenotaph-modal__close, .close-btn');

    if (!modal) return;

    function openModal() {
      modal.classList.add('is-active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('is-active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    openBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    });

    closeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
      });
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-active')) {
        closeModal();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSubpageCommon);
  } else {
    initSubpageCommon();
  }
})();
