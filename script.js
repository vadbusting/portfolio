const images = [
        'image/13919-360701_favor_A4_1k2 10.webp',
        'image/13919-360701_favor_A4_1k2 9.webp',
        'image/15824-370101_OM_otakaraya_B4_flyer_omote_2k 10.webp',
        'image/15824-370101_OM_otakaraya_B4_flyer_omote_2k 9.webp',
        'image/15941-370301_kaitori_eyan_B4_3k 10.webp',
        'image/15941-370301_kaitori_eyan_B4_3k 9.webp',
        'image/2023年5月アロケ 5.webp',
        'image/2024_SD09107_ 10.webp',
        'image/2024_SD09107_ 9.webp',
        'image/240626_amika_toyokawa_B4_ge 5.webp',
        'image/2408_okuraya_B4 1 10.webp',
        'image/2408_okuraya_B4 1 9.webp',
        'image/2410_JA_owari_B3_ 10.webp',
        'image/2410_JA_owari_B3_ 9.webp',
        'image/2410_kaitori_hatiemon_A1_ge_ol 5.webp',
        'image/2410_kaitori_hatiemon_B4_ge_ol 10.webp',
        'image/2410_kaitori_hatiemon_B4_ge_ol 9.webp',
        'image/2410_sekine_B4_ge_ol 10.webp',
        'image/2410_sekine_B4_ge_ol 9.webp',
        'image/2410_sekine_megane_B4_ge_ol 10.webp',
        'image/2410_sekine_megane_B4_ge_ol 9.webp',
        'image/241005_surf_b4 5.webp',
        'image/2411_acteng_A4_ge_ol 10.webp',
        'image/2411_acteng_A4_ge_ol 9.webp',
        'image/2411_brich_B4_ge_ol 10.webp',
        'image/2411_brich_B4_ge_ol 9.webp',
        'image/2411_hallo_A4_ge_ol 10.webp',
        'image/2411_hallo_A4_ge_ol 9.webp',
        'image/241122_c21hariki_B5_ 5.webp',
        'image/2412_Bee-NS_A4-1.webp',
        'image/2412_Bee-NS_A4-2.webp',
        'image/2412_raraone_A4_ge_ol 10.webp',
        'image/2412_raraone_A4_ge_ol 9.webp',
        'image/2412_raraone_logo_1 17.webp',
        'image/2412_raraone_logo_1 18.webp',
        'image/2412_raraone_logo_1 19.webp',
        'image/2412_raraone_logo_1 20.webp',
        'image/2412_raraone_logo_2-1.webp',
        'image/2412_raraone_logo_2-2.webp',
        'image/2412_raraone_logo_2-3.webp',
        'image/2412_raraone_logo_3-1.webp',
        'image/2412_raraone_logo_3-2.webp',
        'image/2412_raraone_logo_3-3.webp',
        'image/2501sekine_B4_honten_2k5 10.webp',
        'image/2501sekine_B4_honten_2k5 9.webp',
        'image/2501sekine_B4_kaitori_2k5 10.webp',
        'image/2501sekine_B4_kaitori_2k5 9.webp',
        'image/2791424E-F612-4D9D-A84A-673CBB70ABD4.jpg 5.webp',
        'image/74D418C8-7BA4-4A3E-A1E1-B75D0DAAE208.jpg 5.webp',
        'image/9092-350501_230602_numazukanuki_300x250_320x50_320×50_1.webp',
        'image/9092-350501_230602_numazukanuki_300x250_320x50_320×50_2.webp',
        'image/9092-350501_230602_numazukanuki_300x250_320x50-1.webp',
        'image/9092-350501_230602_numazukanuki_300x250_320x50-2.webp',
        'image/A1 5.webp',
        'image/A2 5.webp',
        'image/A3 5.webp',
        'image/a4 2 5.webp',
        'image/A4化粧 10.webp',
        'image/A4化粧 9.webp',
        'image/B1 5.webp',
        'image/B2 5.webp',
        'image/B3rough-ページ1.webp',
        'image/B3rough-ページ2.webp',
        'image/brandsalonラフ1 5.webp',
        'image/brandsalonラフ2 5.webp',
        'image/brandsalonラフ3 5.webp',
        'image/BRICH 5.webp',
        'image/chuoudenkikabushikigaisha_A4 5.webp',
        'image/FAX案内 2裏ol 5.webp',
        'image/FAX案内状ウラ 5.webp',
        'image/FUKUMOTO 1 5.webp',
        'image/FUKUMOTO 2 5.webp',
        'image/FUKUMOTO 3 5.webp',
        'image/GOLFLINKS NAGOYA_A4_flyer_ 10.webp',
        'image/GOLFLINKS NAGOYA_A4_flyer_ 9.webp',
        'image/HALLO 5.webp',
        'image/Harikisama 5.webp',
        'image/kyuuseki_B4_ 10.webp',
        'image/kyuuseki_B4_ 9.webp',
        'image/MSJ_POST_DM_A4_ 10.webp',
        'image/MSJ_POST_DM_A4_ 9.webp',
        'image/okayamahirai_4ten_goudou_B3_ 10.webp',
        'image/okayamahirai_4ten_goudou_B3_ 9.webp',
        'image/otsuishiyama_B4_omote_1 5.webp',
        'image/portfolio-ページ22 2 65.webp',
        'image/portfolio-ページ22 2 66.webp',
        'image/portfolio-ページ22 2 67.webp',
        'image/portfolio-ページ22 2 68.webp',
        'image/portfolio-ページ22 2 69.webp',
        'image/portfolio-ページ22 2 70.webp',
        'image/portfolio-ページ22 2 71.webp',
        'image/portfolio-ページ22 2 72.webp',
        'image/portfolio-ページ22 2 73.webp',
        'image/portfolio-ページ22 2 74.webp',
        'image/portfolio-ページ22 2 75.webp',
        'image/portfolio-ページ22 2 76.webp',
        'image/portfolio-ページ22 2 77.webp',
        'image/portfolio-ページ22 2 78.webp',
        'image/portfolio-ページ22 2 79.webp',
        'image/portfolio-ページ22 2 80.webp',
        'image/portfolio-ページ26 5.webp',
        'image/raraoneスター案 5.webp',
        'image/raraoneラフ1 5.webp',
        'image/raraoneラフ2 5.webp',
        'image/WBC 9.webp',
        'image/アクビィ1 5.webp',
        'image/アクビィ2 5.webp',
        'image/アクビィ3 5.webp',
        'image/イメージ 5.webp',
        'image/オモテ①税理士向けA44C化粧 10.webp',
        'image/オモテ①税理士向けA44C化粧 9.webp',
        'image/サーフパラダイス1 5.webp',
        'image/サーフパラダイス2 5.webp',
        'image/スーパーナース手ラフ 5.webp',
        'image/セキネ手ラフ 5.webp',
        'image/その他士業用表ol 5.webp',
        'image/ネクストリープ1 5.webp',
        'image/ネクストリープ2 5.webp',
        'image/フェイバーラフ 10.webp',
        'image/フェイバーラフ 9.webp',
        'image/マキ不動産ラフ 5.webp',
        'image/メールソリューション手ラフ 10.webp',
        'image/メールソリューション手ラフ 9.webp',
        'image/ロゴ 5.webp',
        'image/安城・新安城ラフ 5.webp',
        'image/安心相続カフェ打合せ用資料0701 5.webp',
        'image/安心相続カフェ打合せ用資料0703 5.webp',
        'image/岡山合同サムネイル 5.webp',
        'image/共通裏ol_x4 5.webp',
        'image/最終 5.webp',
        'image/手ラフ 2 5.webp',
        'image/手ラフ 3 5.webp',
        'image/手ラフ 4 5.webp',
        'image/手ラフ 8.webp',
        'image/手ラフ中面 5.webp',
        'image/初校 10.webp',
        'image/初校 9.webp',
        'image/税理士用表 修正ol_x4 5.webp',
        'image/大蔵屋 10.webp',
        'image/大蔵屋 9.webp',
        'image/中村塗装手ラフ 5.webp',
        'image/中村塗装手ラフ再校 5.webp',
        'image/八右衛門手ラフ 10.webp',
        'image/八右衛門手ラフ 9.webp',
        'image/封筒 5.webp',
        'image/封筒ol 5.webp',
        'image/封入チラシウラ共通 5.webp',
        'image/堀田商事_B3_ 10.webp',
        'image/堀田商事_B3_ 9.webp',
        'image/本店チラシ (手ラフ） 10.webp',
        'image/本店チラシ (手ラフ） 9.webp'
    ];

window.PORTFOLIO_IMAGES = images;

const LOADER_MANIFEST_KEY = 'floatingWorldManifestV1';
const PRELOAD_LIMIT = 24;

const loaderOverlay = document.getElementById('floating-loader');
const loaderProgressEl = loaderOverlay?.querySelector('[data-progress]');

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(value)));

let loaderMaxProgress = 0;
let loaderLocked = false;
let loaderActive = false;

const resetScrollToTop = () => {
    let attempts = 0;
    const apply = () => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        attempts += 1;
        if (attempts < 5) {
            requestAnimationFrame(apply);
        }
    };
    requestAnimationFrame(apply);
};

const updateLoaderProgress = (value, { force = false } = {}) => {
    if (!loaderProgressEl) return;
    const percent = clampPercent(value);
    if (!force) {
        if (loaderLocked) return;
        if (percent < loaderMaxProgress) return;
    }
    loaderMaxProgress = percent;
    loaderProgressEl.textContent = `${percent}%`;
    if (percent >= 100) {
        loaderLocked = true;
    }
};

const showLoaderOverlay = () => {
    if (loaderLocked || loaderActive) return;
    if (!loaderOverlay) return;
    loaderMaxProgress = 0;
    loaderLocked = false;
    loaderActive = true;
    if (loaderProgressEl) {
        loaderProgressEl.textContent = '0%';
    }
    loaderOverlay.classList.remove('is-hidden');
    document.body.classList.add('is-loading');
    resetScrollToTop();
};

const hideLoaderOverlay = () => {
    if (!loaderOverlay) return;
    updateLoaderProgress(100, { force: true });
    loaderLocked = true;
    loaderActive = false;
    loaderOverlay.classList.add('is-hidden');
    document.body.classList.remove('is-loading');
    resetScrollToTop();
};

window.updatePortfolioLoaderProgress = updateLoaderProgress;
window.showPortfolioLoader = showLoaderOverlay;
window.hidePortfolioLoader = hideLoaderOverlay;
window.resetPortfolioScrollTop = resetScrollToTop;

document.addEventListener('DOMContentLoaded', () => {

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    let shouldPreload = true;
    const manifestSignature = `${images.length}:${images.join('|')}`;

    try {
        const stored = localStorage.getItem(LOADER_MANIFEST_KEY);
        if (stored === manifestSignature) {
            shouldPreload = false;
        } else {
            localStorage.setItem(LOADER_MANIFEST_KEY, manifestSignature);
        }
    } catch (error) {
        console.warn('Unable to access localStorage for preload manifest.', error);
    }

    const preloadImages = (srcArray, { onProgress } = {}) => {
        if (!shouldPreload || !srcArray.length) {
            if (typeof onProgress === 'function') {
                onProgress(100);
            }
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const total = srcArray.length;
            let loaded = 0;

            const handleProgress = () => {
                loaded += 1;
                if (typeof onProgress === 'function') {
                    onProgress(loaded / total * 100);
                }
                if (loaded >= total) {
                    resolve();
                }
            };

            srcArray.forEach((src) => {
                const img = new Image();
                img.onload = handleProgress;
                img.onerror = handleProgress;
                img.src = src;
            });
        });
    };

    const applySmallKanaKerning = (element) => {
        if (!element) return;
        const smallKanaRegex = /[ァィゥェォッャュョヮヵヶ]/g;
        element.innerHTML = element.textContent.replace(
            smallKanaRegex,
            '<span class="small-kana">$&</span>'
        );
    };

    const initFloatingWorldGallery = () => {
        const app = document.querySelector('#app[data-page="floating-world"]');
        if (!app || !document.body.classList.contains('floating-world-page')) return;

        const world = app.querySelector('[data-floating-world]');
        const projectsRoot = app.querySelector('[data-floating-projects]');
        if (!world || !projectsRoot) return;

        const imageSources = images.slice(0, Math.min(images.length, 64));
        const fragment = document.createDocumentFragment();

        const randomBetween = (min, max) => Math.random() * (max - min) + min;

        imageSources.forEach((src, index) => {
            const project = document.createElement('figure');
            project.className = 'project';
            project.dataset.depth = ((index % 5) - 2).toString();
            project.style.setProperty('--offset-x', `${randomBetween(-8, 8).toFixed(2)}vw`);

            const img = document.createElement('img');
            img.src = src;
            img.alt = '';
            img.loading = index > 6 ? 'lazy' : 'eager';

            project.appendChild(img);
            fragment.appendChild(project);
        });

        projectsRoot.appendChild(fragment);

        const projects = Array.from(projectsRoot.querySelectorAll('.project'));
        if (!projects.length) return;

        let layerSpacing = Math.max(window.innerHeight * 0.52, 420);
        let offsetStart = window.innerHeight * 0.35;

        const layoutProjects = () => {
            layerSpacing = Math.max(window.innerHeight * 0.52, 420);
            offsetStart = window.innerHeight * 0.35;
            projects.forEach((project, index) => {
                project.style.top = `${index * layerSpacing + offsetStart}px`;
            });
            const trailLength = projects.length * layerSpacing + offsetStart + window.innerHeight * 0.65;
            projectsRoot.style.height = `${trailLength}px`;
        };

        const updateTransforms = () => {
            const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
            const viewportHeight = window.innerHeight || 1;
            const viewportMiddle = scrollY + viewportHeight / 2;

            projects.forEach((project) => {
                const top = parseFloat(project.style.top) || project.offsetTop;
                const depthBias = Number(project.dataset.depth || 0);
                const distance = viewportMiddle - top;
                const normalized = distance / viewportHeight;

                const translateY = -distance * 0.22;
                const translateZ = clamp(-normalized * 860 + depthBias * 140, -1100, 520);
                const scale = clamp(1 - Math.abs(normalized) * 0.28, 0.6, 1.18);
                const opacity = clamp(1 - Math.abs(normalized) * 0.6, 0.32, 1);

                project.style.setProperty('--translate-y', `${translateY.toFixed(2)}px`);
                project.style.setProperty('--translate-z', `${translateZ.toFixed(2)}px`);
                project.style.setProperty('--scale', scale.toFixed(3));
                project.style.setProperty('--opacity', opacity.toFixed(3));
            });

            requestAnimationFrame(updateTransforms);
        };

        layoutProjects();
        requestAnimationFrame(updateTransforms);

        window.addEventListener('resize', layoutProjects, { passive: true });
        window.addEventListener('orientationchange', layoutProjects);
    };

    applySmallKanaKerning(document.querySelector('.kerning-tight'));
    initFloatingWorldGallery();

    const preloadTargets = images.slice(0, PRELOAD_LIMIT);

    preloadImages(preloadTargets, {
        onProgress: (value) => {
            if (document.body.classList.contains('floating-world-page')) {
                updateLoaderProgress(value * 0.4);
            }
        }
    })
    .then(() => {
        document.body.classList.add('loaded');
        console.log('Trail images prepared.');
    })
    .catch(err => {
        console.error('Failed to preload some trail images', err);
        document.body.classList.add('loaded');
    });

    const menuBtn = document.querySelector('.menu-btn');
    const closeBtn = document.querySelector('.close-btn');
    const menuOverlay = document.querySelector('.menu-overlay');

    if (menuBtn && closeBtn && menuOverlay) {
        menuBtn.addEventListener('click', () => {
            menuOverlay.classList.add('is-active');
            document.body.classList.add('menu-active');
        });

        closeBtn.addEventListener('click', () => {
            menuOverlay.classList.remove('is-active');
            document.body.classList.remove('menu-active');
        });
    }

    const trailContainer = document.getElementById('image-trail-container');
    if (trailContainer) {
        let imageIndex = Math.floor(Math.random() * images.length);
        let moveCount = 0;

        const createTrail = (x, y) => {
            moveCount++;
            if (moveCount % 8 !== 0) return;

            const img = document.createElement('img');
            img.src = images[imageIndex];
            img.className = 'trail-image';

            img.style.left = `${x}px`;
            img.style.top = `${y}px`;

            trailContainer.appendChild(img);

            const animation = img.animate([
                { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 1, filter: 'grayscale(100%)' },
                { transform: `translate(-50%, -50%) scale(1.2) translate(${Math.random() * 60 - 30}px, ${Math.random() * 60 - 30}px)`, opacity: 0, filter: 'grayscale(0%)' }
            ], {
                duration: 1500,
                easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
            });

            animation.onfinish = () => img.remove();
            imageIndex = (imageIndex + 1) % images.length;
        };

        window.addEventListener('mousemove', e => createTrail(e.clientX, e.clientY));
        window.addEventListener('touchmove', e => {
            const touch = e.touches[0];
            if (touch) createTrail(touch.clientX, touch.clientY);
        }, { passive: true });
    }
});
