(() => {
  const MOBILE_MAX_WIDTH = 920;
  const ua = (navigator.userAgent || '').toLowerCase();
  const isMobileUA = /android|iphone|ipad|ipod|blackberry|windows phone|mobile/.test(ua);
  const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
  const isSmallViewport = typeof window.matchMedia === 'function'
    ? window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches
    : window.innerWidth <= MOBILE_MAX_WIDTH;
  const isAlreadyMobile = window.location.pathname.includes('/mobile/');
  let forcedDesktop = false;

  try {
    // もし直接アクセスか外部からの訪問（モバイル側からの「PC版で見る」クリック以外）であれば、
    // 過去のデスクトップ表示 preference を強制クリアして、スマホ訪問者が確実にモバイル版へ飛ぶように防弾化
    const referrer = document.referrer || '';
    if (!referrer.includes('/mobile/')) {
      localStorage.removeItem('portfolioViewMode');
    }
    forcedDesktop = localStorage.getItem('portfolioViewMode') === 'desktop';
  } catch (error) {
    console.warn('Unable to read view preference.', error);
  }

  const currentPath = window.location.pathname || '';
  const isExcludedPage = /lp\.html|presentation\.html|other\.html/.test(currentPath);

  if (isAlreadyMobile || forcedDesktop || isExcludedPage) {
    return;
  }

  if (isMobileUA || (isSmallViewport && hasTouch)) {
    const currentPath = window.location.pathname || '';
    let mobileTarget = 'mobile/index.html';

    if (currentPath.includes('works.html')) {
      mobileTarget = 'mobile/works.html';
    } else if (currentPath.includes('about.html')) {
      mobileTarget = 'mobile/about.html';
    }

    const basePath = currentPath.replace(/[^/]*$/, '');
    const targetUrl = `${window.location.origin}${basePath}${mobileTarget}`;
    window.location.replace(targetUrl);
  }
})();
