const rawImages = [
        'image/2412_raraone_logo_3-3.webp',
        'image/2791424E-F612-4D9D-A84A-673CBB70ABD4.jpg_5.webp',
        'image/74D418C8-7BA4-4A3E-A1E1-B75D0DAAE208.jpg_5.webp',
        'image/B1_5.webp',
        'image/B2_5.webp',
        'image/B3_rough_page_1.webp',
        'image/B3_rough_page_2.webp',
        'image/brandsalon_rough_1_5.webp',
        'image/brandsalon_rough_2_5.webp',
        'image/brandsalon_rough_3_5.webp',
        'image/BRICH_5.webp',
        'image/FAX_annaijo_ura_5.webp',
        'image/FUKUMOTO_1_5.webp',
        'image/FUKUMOTO_2_5.webp',
        'image/FUKUMOTO_3_5.webp',
        'image/Harikisama_5.webp',
        'image/raraone_star_plan_5.webp',
        'image/raraone_rough_1_5.webp',
        'image/raraone_rough_2_5.webp',
        'image/acb_1_5.webp',
        'image/acb_2_5.webp',
        'image/image_concept_5.webp',
        'image/omote_zeirishi_A4_kesho_10.webp',
        'image/omote_zeirishi_A4_kesho_9.webp',
        'image/surf_paradise_1_5.webp',
        'image/surf_paradise_2_5.webp',
        'image/supernurse_te_rough_5.webp',
        'image/nextleap_1_5.webp',
        'image/nextleap_2_5.webp',
        'image/favor_rough_10.webp',
        'image/favor_rough_9.webp',
        'image/anjo_shinanjo_rough_5.webp',
        'image/anshin_souzoku_cafe_meeting_0701_5.webp',
        'image/anshin_souzoku_cafe_meeting_0703_5.webp',
        'image/okayama_godo_thumb_5.webp',
        'image/final_5.webp',
        'image/te_rough_2_5.webp',
        'image/te_rough_3_5.webp',
        'image/te_rough_4_5.webp',
        'image/okuraya_10.webp',
        'image/okuraya_9.webp',
        'image/nakamura_paint_te_rough_5.webp',
        'image/nakamura_paint_te_rough_reproof_5.webp',
        'image/hachiemon_te_rough_10.webp',
        'image/hachiemon_te_rough_9.webp',
        'image/funyu_chirashi_ura_kyotsu_5.webp',
        'image/2412_raraone_logo_1_19.webp',
        'image/portfolio_page_22_2_65.webp',
        'image/2412_raraone_logo_3-1.webp',
        'image/A2_5.webp',
        'image/2412_raraone_logo_1_17.webp',
        'image/A3_5.webp',
        'image/maki_realestate_rough_5.webp',
        'image/A1_5.webp',
        'image/2412_raraone_logo_3-2.webp',
        'image/te_rough_nakamen_5.webp',
        'image/2412_raraone_logo_1_18.webp',
        'image/futo_ol_5.webp',
        'image/2412_raraone_logo_2-2.webp',
        'image/2023_05_aroke_5.webp',
        'image/futo_5.webp',
        'image/2412_raraone_logo_2-1.webp',
        'image/2412_raraone_logo_2-3.webp',
        'image/WBC_9.webp',
        'image/honten_chirashi_te_rough_10.webp',
        'image/A4_kesho_9.webp',
        'image/A4_kesho_10.webp',
        'image/honten_chirashi_te_rough_9.webp',
        'image/te_rough_8.webp',
        'image/sekine_te_rough_5.webp',
        'image/HALLO_5.webp',
        'image/portfolio_page_26_5.webp',
        'image/logo_5.webp',
        'image/FAX_annai_2_ura_ol_5.webp',
        'image/portfolio_page_22_2_70.webp',
        'image/portfolio_page_22_2_69.webp',
        'image/acb_3_5.webp',
        'image/portfolio_page_22_2_72.webp',
        'image/portfolio_page_22_2_76.webp',
        'image/2412_raraone_logo_1_20.webp',
        'image/portfolio_page_22_2_74.webp',
        'image/kyuuseki_B4_10.webp',
        'image/other_shigyo_omote_ol_5.webp',
        'image/2412_raraone_A4_ge_ol_9.webp',
        'image/portfolio_page_22_2_78.webp',
        'image/mailsolution_te_rough_10.webp',
        'image/mailsolution_te_rough_9.webp',
        'image/2412_Bee-NS_A4-2.webp',
        'image/2412_raraone_A4_ge_ol_10.webp',
        'image/portfolio_page_22_2_77.webp',
        'image/portfolio_page_22_2_80.webp',
        'image/2412_Bee-NS_A4-1.webp',
        'image/2411_hallo_A4_ge_ol_10.webp',
        'image/2410_sekine_B4_ge_ol_10.webp',
        'image/portfolio_page_22_2_75.webp',
        'image/portfolio_page_22_2_73.webp',
        'image/chuoudenkikabushikigaisha_A4_5.webp',
        'image/portfolio_page_22_2_71.webp',
        'image/2410_JA_owari_B3_10.webp',
        'image/shoko_10.webp',
        'image/portfolio_page_22_2_67.webp',
        'image/241122_c21hariki_B5_5.webp',
        'image/portfolio_page_22_2_79.webp',
        'image/2411_hallo_A4_ge_ol_9.webp',
        'image/2411_brich_B4_ge_ol_9.webp',
        'image/okayamahirai_4ten_goudou_B3_10.webp',
        'image/2410_sekine_megane_B4_ge_ol_9.webp',
        'image/13919-360701_favor_A4_1k2_10.webp',
        'image/2410_sekine_megane_B4_ge_ol_10.webp',
        'image/2411_brich_B4_ge_ol_10.webp',
        'image/2410_JA_owari_B3_9.webp',
        'image/2410_sekine_B4_ge_ol_9.webp',
        'image/sub_banner_golf4.jpg',
        'image/portfolio_page_22_2_66.webp',
        'image/15941-370301_kaitori_eyan_B4_3k_10.webp',
        'image/kyuuseki_B4_9.webp',
        'image/2501sekine_B4_honten_2k5_9.webp',
        'image/2024_SD09107_10.webp',
        'image/sub_banner_ban.jpg',
        'image/sub_banner_golf1.jpg',
        'image/a4_2_5.webp',
        'image/MSJ_POST_DM_A4_10.webp',
        'image/sub_banner_golf2.jpg',
        'image/2410_kaitori_hatiemon_B4_ge_ol_10.webp',
        'image/kyotsu_ura_ol_x4_5.webp',
        'image/15824-370101_OM_otakaraya_B4_flyer_omote_2k_10.webp',
        'image/13919-360701_favor_A4_1k2_9.webp',
        'image/hotta_shoji_B3_10.webp',
        'image/zeirishi_omote_shusei_ol_x4_5.webp',
        'image/otsuishiyama_B4_omote_1_5.webp',
        'image/sub_banner_test2.png',
        'image/2024_SD09107_9.webp',
        'image/15824-370101_OM_otakaraya_B4_flyer_omote_2k_9.webp',
        'image/2408_okuraya_B4_1_9.webp',
        'image/2501sekine_B4_honten_2k5_10.webp',
        'image/sub_banner_test1.png',
        'image/2501sekine_B4_kaitori_2k5_10.webp',
        'image/2408_okuraya_B4_1_10.webp',
        'image/hotta_shoji_B3_9.webp',
        'image/241005_surf_b4_5.webp',
        'image/2410_kaitori_hatiemon_B4_ge_ol_9.webp',
        'image/15941-370301_kaitori_eyan_B4_3k_9.webp',
        'image/GOLFLINKS_NAGOYA_A4_flyer_10.webp',
        'image/sub_banner_A_plan.jpg',
        'image/9092-350501_230602_numazukanuki_300x250_320x50-2.webp',
        'image/sub_banner_kogai.jpg',
        'image/shoko_9.webp',
        'image/MSJ_POST_DM_A4_9.webp',
        'image/9092-350501_230602_numazukanuki_300x250_320x50-1.webp',
        'image/240626_amika_toyokawa_B4_ge_5.webp',
        'image/GOLFLINKS_NAGOYA_A4_flyer_9.webp',
        'image/portfolio_page_22_2_68.webp',
        'image/2411_acteng_A4_ge_ol_10.webp',
        'image/2410_kaitori_hatiemon_A1_ge_ol_5.webp',
        'image/2501sekine_B4_kaitori_2k5_9.webp',
        'image/okayamahirai_4ten_goudou_B3_9.webp',
        'image/2411_acteng_A4_ge_ol_9.webp',
        'image/9092-350501_230602_numazukanuki_300x250_320x50_320x50_1.webp',
        'image/sub_banner_manual.png',
        'image/sub_banner_golf3.jpg',
        'image/9092-350501_230602_numazukanuki_300x250_320x50_320x50_2.webp',
        'image/sub_banner_banner.png',
        'image/sub_banner_kogaisp.jpg',
        'image/sub_banner_banner2.jpg',
    ];

const normalizeAssetPath = (value) => (
    typeof value === 'string' && typeof value.normalize === 'function'
        ? value.normalize('NFC')
        : value
);

const images = rawImages.map(normalizeAssetPath);

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
    if (!loaderOverlay) return; // No loader element — do NOT add is-loading to body
    if (loaderLocked || loaderActive) return;
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
    if (!loaderOverlay) {
        // No loader element — just ensure body is clean
        document.body.classList.remove('is-loading');
        loaderActive = false;
        return;
    }
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
            if (loaderOverlay && document.body.classList.contains('floating-world-page')) {
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
