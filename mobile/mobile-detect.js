(() => {
  const DESKTOP_MIN_WIDTH = 1024;
  const ua = (navigator.userAgent || '').toLowerCase();
  const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
  // iPadOS may identify itself as Macintosh. Touch Macs must stay on the
  // mobile leaf page instead of being redirected back to the desktop page.
  const isTabletOrDesktopUA = /windows nt|linux x86_64/.test(ua) || (/macintosh/.test(ua) && !hasTouch);
  const isWideViewport = typeof window.matchMedia === 'function'
    ? window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`).matches
    : window.innerWidth >= DESKTOP_MIN_WIDTH;

  if (!(isTabletOrDesktopUA || isWideViewport)) {
    return;
  }

  const targetPath = window.location.pathname.replace('/mobile/', '/');
  if (targetPath === window.location.pathname) {
    return;
  }
  window.location.replace(targetPath);
})();
