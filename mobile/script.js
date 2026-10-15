const resolveDesktopTarget = (target) => {
  if (!target) {
    return window.location.pathname.replace(/\/mobile\//, '/');
  }

  if (/^https?:\/\//i.test(target)) {
    return target;
  }

  const base = window.location.pathname.replace(/mobile\/[^/]*$/, '');
  return `${base}${target}`.replace(/\/+/, '/');
};

const redirectToDesktop = (target) => {
  try {
    localStorage.setItem('portfolioViewMode', 'desktop');
  } catch (error) {
    console.warn('Unable to persist desktop view preference.', error);
  }
  const path = resolveDesktopTarget(target);
  window.location.replace(path);
};

export const initMenu = () => {
  try {
    localStorage.removeItem('portfolioViewMode');
  } catch (error) {
    console.warn('Unable to reset view preference on mobile load.', error);
  }

  const drawer = document.querySelector('[data-drawer]');
  const toggleBtn = document.querySelector('[data-menu-toggle]');
  const closeBtn = document.querySelector('[data-menu-close]');
  const links = document.querySelectorAll('[data-menu-link]');
  const desktopBtns = document.querySelectorAll('[data-open-desktop]');

  const toggleDrawer = (open) => {
    if (!drawer) return;
    drawer.dataset.open = open ? 'true' : 'false';
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('m-drawer-open', open);
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
  };

  toggleBtn?.addEventListener('click', () => toggleDrawer(drawer?.dataset.open !== 'true'));
  closeBtn?.addEventListener('click', () => toggleDrawer(false));
  drawer?.addEventListener('click', (event) => {
    if (event.target === drawer) {
      toggleDrawer(false);
    }
  });

  links.forEach((link) => {
    link.addEventListener('click', () => toggleDrawer(false));
  });

  desktopBtns.forEach((btn) => {
    const target = btn.dataset.desktopHref || '';
    btn.addEventListener('click', () => redirectToDesktop(target));
  });
};
