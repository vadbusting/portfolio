/**
 * TESHIMA LAB Portfolio — Unified Device & Environment Detection
 * Single source of truth across all pages and modules.
 */

const hasTouch = typeof window !== 'undefined' && (
  ('ontouchstart' in window) ||
  (navigator.maxTouchPoints > 0)
);

const isMobileOrTablet = () => typeof window !== 'undefined' && (
  hasTouch ||
  (window.matchMedia && window.matchMedia('(max-width: 1024px)').matches)
);

const detectIPad = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIPadUA = /ipad/i.test(ua);
  const isTouchMac = /macintosh/i.test(ua) && hasTouch;
  return isIPadUA || isTouchMac;
};

const prefersReducedMotion = () => (
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

export const Device = Object.freeze({
  hasTouch,
  isMobileOrTablet,
  isIPad: detectIPad(),
  prefersReducedMotion,
});

if (typeof window !== 'undefined') {
  window.__portfolioDevice = Device;
}
