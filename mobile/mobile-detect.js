(() => {
  const DESKTOP_MIN_WIDTH = 1024;
  const ua = (navigator.userAgent || '').toLowerCase();
  const isTabletOrDesktopUA = /macintosh|windows nt|linux x86_64/.test(ua);
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
