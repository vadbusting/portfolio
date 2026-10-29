// ── Global Smooth Scroll Helper for Side Dots ──
function scrollToSection(targetId) {
  const targetElement = document.querySelector(targetId);
  if (targetElement) {
    const offset = 60; // Fixed Header offset
    const elementPosition = targetElement.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - offset;
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll('.slide');
  const ambientGlow = document.getElementById('ambientGlow');
  const sideDots = document.querySelectorAll('.side-dot');
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  const scrollProgressBar = document.getElementById('scrollProgressBar');
  const customCursor = document.getElementById('customCursor');

  // Delegated smooth scroll navigation for side dots (eliminates inline onclick)
  const sideDotsNav = document.querySelector('.side-dots-nav');
  if (sideDotsNav) {
    sideDotsNav.addEventListener('click', (e) => {
      const dot = e.target.closest('.side-dot');
      if (dot && dot.dataset.scrollTarget) {
        scrollToSection(dot.dataset.scrollTarget);
      }
    });
  }

  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.matchMedia('(max-width: 1024px) and (orientation: portrait)').matches || ('ontouchstart' in window);
  const isGsapAvailable = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !isMobileDevice;

  // Mobile: do NOT force scroll reset — that itself causes the bounce bug on iOS Safari

  // ── 1. CUSTOM CURSOR HANDLING (MONOCHROMATIC SEAMLESS FOLLOWER) ──
  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  const cursorSpeed = 0.12; 

  if (window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)').matches) {
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function updateCursor() {
      const dx = mouseX - cursorX;
      const dy = mouseY - cursorY;
      cursorX += dx * cursorSpeed;
      cursorY += dy * cursorSpeed;
      if (customCursor) {
        customCursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      }
      requestAnimationFrame(updateCursor);
    }
    updateCursor();

    // Hover detection for interactive items
    const hoverElements = 'a, button, .toc-item, .tile, .oem-card, .cool-btn';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverElements)) {
        customCursor.classList.add('hovered');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverElements)) {
        customCursor.classList.remove('hovered');
      }
    });

    // Click trigger animation
    document.addEventListener('mousedown', () => {
      customCursor.classList.add('click-effect');
    });
    document.addEventListener('mouseup', () => {
      customCursor.classList.remove('click-effect');
    });
  } else {
    if (customCursor) customCursor.style.display = 'none';
  }

  // ── 2. DYNAMIC STAGGER REVEALS WITH AUTOMATIC REVERT (文字崩れを防ぐためアニメーション完了後にDOMを完全Revert修復する防弾仕様) ──
  if (isGsapAvailable) {
    document.documentElement.classList.add('gsap-loaded');
    gsap.registerPlugin(ScrollTrigger);

    const coverHeader = document.querySelector('.cover-h1');
    if (coverHeader) {
      // 1. オリジナルの無傷のHTMLを完全保持
      const originalHTML = coverHeader.innerHTML;

      // 2. 1文字ずつのスプリットDOMを動的生成
      let newHTML = '';
      coverHeader.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          for (let char of text) {
            if (char.trim() === '') {
              newHTML += ' ';
            } else {
              newHTML += `<span class="reveal-text-wrapper" style="perspective: 1000px; display: inline-block; overflow: visible;"><span class="reveal-text-char" style="display: inline-block; opacity: 0; transform-origin: 50% 100% -50px; transform: translate3d(0, 100px, -150px) rotateX(-90deg); transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s;">${char}</span></span>`;
            }
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'BR') {
            newHTML += '<br>';
          } else if (node.classList.contains('cover-sub-title')) {
            const subText = node.textContent;
            let subHTML = `<span class="cover-sub-title" style="perspective: 1000px; display: block; overflow: visible;">`;
            for (let char of subText) {
              if (char.trim() === '') {
                subHTML += ' ';
              } else {
                subHTML += `<span class="reveal-text-wrapper" style="display: inline-block; overflow: visible;"><span class="reveal-text-char" style="display: inline-block; opacity: 0; transform-origin: 50% 100% -50px; transform: translate3d(0, 80px, -120px) rotateX(-90deg); transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s;">${char}</span></span>`;
              }
            }
            subHTML += `</span>`;
            newHTML += subHTML;
          } else {
            newHTML += node.outerHTML;
          }
        }
      });
      coverHeader.innerHTML = newHTML;

      // 3. GSAP 3D Stagger アニメーション実行
      const chars = coverHeader.querySelectorAll('.reveal-text-char');
      gsap.to(chars, {
        opacity: 1,
        y: 0,
        z: 0,
        rotateX: 0,
        stagger: 0.04,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.3,
        onComplete: () => {
          // 4. アニメーション完了後にオリジナルの無傷のHTMLに完全差し戻し（Revert）！
          // これにより改行バグ、コピーバグ、解像度バグを永久根絶！
          coverHeader.innerHTML = originalHTML;
        }
      });
    }

    // Content Block Floating Visual depth (Parallax stream blocks)
    slides.forEach(slide => {
      if (slide.classList.contains('title-slide')) return;

      const body = slide.querySelector('.slide-body');
      const rootsFull = slide.querySelector('.roots-full');

      // Scroll-linked floating slide content up with dynamic scale/skew adjustments
      if (rootsFull) {
        gsap.fromTo(rootsFull, 
          { opacity: 0, y: 120, scale: 0.95 },
          { 
            scrollTrigger: {
              trigger: slide,
              start: "top 85%",
              end: "top 35%",
              scrub: 1
            },
            opacity: 1, 
            y: 0, 
            scale: 1,
            ease: "sine.out"
          }
        );
      }
      if (body) {
        gsap.fromTo(body, 
          { opacity: 0, y: 150, scale: 0.96 },
          { 
            scrollTrigger: {
              trigger: slide,
              start: "top 80%",
              end: "top 30%",
              scrub: 1
            },
            opacity: 1, 
            y: 0, 
            scale: 1,
            ease: "sine.out"
          }
        );
      }
    });
  } else {
    // Fallback native Observer trigger with stagger timing
    const observerOptions = {
      root: null,
      threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          entry.target.querySelectorAll('.reveal-text-char').forEach((char, i) => {
            setTimeout(() => {
              char.style.opacity = '1';
              char.style.transform = 'translate3d(0, 0, 0) rotateX(0deg)';
            }, i * 25);
          });
        }
      });
    }, observerOptions);

    slides.forEach(slide => observer.observe(slide));
  }

  // ── 4. MONO ORIGINAL NEON CATEGORY COLOR MAPS & DOT INDICATORS SYNC ──
  // Using strictly ONLY the original category colors defined by the slides, absolutely no orange!
  const colorMap = {
    'title-slide': 'radial-gradient(circle at 50% 50%, #0c0c0c 0%, #050505 100%)',
    'theme-ai': 'radial-gradient(circle at 50% 50%, #061930 0%, #020810 100%)',
    'theme-web': 'radial-gradient(circle at 50% 50%, #051633 0%, #010614 100%)',
    'theme-dir': 'radial-gradient(circle at 50% 50%, #290818 0%, #0f0208 100%)',
    'theme-oem': 'radial-gradient(circle at 50% 50%, #26050b 0%, #0f0103 100%)',
    'theme-dev': 'radial-gradient(circle at 50% 50%, #170526 0%, #080112 100%)',
    'theme-ball': 'radial-gradient(circle at 50% 50%, #10151a 0%, #050709 100%)',
    'theme-about': 'radial-gradient(circle at 50% 50%, #0c0c0c 0%, #050505 100%)'
  };

  const exactNeonColors = {
    'ai': '#1A85FF',   // Original Slide 3-7 AI blue accent
    'web': '#194AA3',  // Original Slide 8-9 Web dark blue
    'dir': '#E61A7B',  // Original Slide 10-11 Direction Pink
    'oem': '#DF1E43',  // Original Slide 12-13 OEM Red
    'dev': '#8522C7',  // Original Slide 14-15 Dev Support Purple
    'ball': '#5A6877', // Original Soccerball Slate
    'about': '#FFFFFF',// Monochrome white
    'cover': '#FFFFFF' // Monochrome white
  };

  const targetMap = {
    'theme-ai': 'ai',
    'theme-web': 'web',
    'theme-dir': 'dir',
    'theme-oem': 'oem',
    'theme-dev': 'dev',
    'theme-ball': 'ball',
    'theme-about': 'about',
    'title-slide': 'cover'
  };

  let lastScrollY = window.scrollY;
  let scrollVelocity = 0;

  function updateActiveThemeAndNav() {
    const currentScrollY = window.scrollY;
    scrollVelocity += (Math.abs(currentScrollY - lastScrollY) - scrollVelocity) * 0.15;
    lastScrollY = currentScrollY;

    // Scroll Progress bar color matches active neon theme color dynamically!
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = (currentScrollY / (maxScroll || 1)) * 100;
    if (scrollProgressBar) {
      scrollProgressBar.style.width = `${scrollPercentage}%`;
    }

    // Synchronize Active Section
    let currentActiveSection = null;
    let maxVisibleHeight = 0;

    slides.forEach(slide => {
      const rect = slide.getBoundingClientRect();
      const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
      
      if (visibleHeight > maxVisibleHeight) {
        maxVisibleHeight = visibleHeight;
        currentActiveSection = slide;
      }
    });

    if (!currentActiveSection) return;

    let themeClass = 'theme-about';
    if (currentActiveSection.classList.contains('title-slide')) {
      themeClass = 'title-slide';
    } else {
      const sBand = currentActiveSection.querySelector('.s-band');
      if (sBand) {
        if (sBand.classList.contains('theme-ai')) themeClass = 'theme-ai';
        else if (sBand.classList.contains('theme-web')) themeClass = 'theme-web';
        else if (sBand.classList.contains('theme-dir')) themeClass = 'theme-dir';
        else if (sBand.classList.contains('theme-oem')) themeClass = 'theme-oem';
        else if (sBand.classList.contains('theme-dev')) themeClass = 'theme-dev';
        else if (sBand.classList.contains('theme-ball')) themeClass = 'theme-ball';
      } else if (currentActiveSection.id === 'slide-17' || currentActiveSection.id === 'slide-18') {
        themeClass = 'theme-about';
      }
    }

    // 1. Ambient Glow Color Shift
    if (ambientGlow) {
      ambientGlow.style.background = colorMap[themeClass] || colorMap['theme-about'];
    }

    const currentTarget = targetMap[themeClass] || 'about';
    const activeColor = exactNeonColors[currentTarget] || '#FFFFFF';

    // Update Progress bar theme color dynamically
    if (scrollProgressBar) {
      scrollProgressBar.style.background = activeColor;
    }

    // 2. Synchronize Side Dot indicators using ONLY original theme colors!
    sideDots.forEach(dot => {
      const target = dot.getAttribute('data-target');
      if (target === currentTarget) {
        dot.classList.add('active');
        // Scroll the indicator bar to center the active dot — do NOT use scrollIntoView
        // because it causes iOS Safari to reset the page scroll position (bounce bug)
        if (isMobileDevice) {
          const nav = dot.closest('.side-dots-nav');
          if (nav) {
            const navRect = nav.getBoundingClientRect();
            const dotRect = dot.getBoundingClientRect();
            const dotCenter = dotRect.left - navRect.left + dotRect.width / 2;
            const navCenter = nav.width / 2 || navRect.width / 2;
            nav.scrollLeft += dotCenter - navCenter;
          }
        }
      } else {
        dot.classList.remove('active');
      }
    });

    // 3. Scroll to Top button toggle
    if (currentScrollY > 300) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', updateActiveThemeAndNav);
  window.addEventListener('resize', updateActiveThemeAndNav);
  updateActiveThemeAndNav();

  // ── 5. SMOOTH SCROLL FOR TOC & BUTTONS ──
  document.querySelectorAll('.toc-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      scrollToSection(targetId);
    });
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.getCurrentScrollVelocity = () => scrollVelocity;

  initEscherConformalGrid();
});

// ── ESCHER CONFORMAL SPIRAL GRID (DROSTE EFFECT) ON 2D CANVAS ──
function initEscherConformalGrid() {
  if (typeof window.initEscherConformalGrid === 'function') {
    window.initEscherConformalGrid({
      canvasId: 'escherCanvas',
      useWindowSize: true,
      triggerSelector: '.cover-top',
      getScrollVelocity: typeof window.getCurrentScrollVelocity === 'function' ? window.getCurrentScrollVelocity : (() => 0)
    });
  }

  // Robust Back button handler returning directly to B2F LP
  const lpBack = document.getElementById('lpBackBtn');
  if (lpBack) {
    lpBack.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.history.length > 1 && document.referrer && document.referrer.includes(location.host)) {
        window.history.back();
      } else {
        window.location.href = 'index.html#lp';
      }
    });
  }
}
