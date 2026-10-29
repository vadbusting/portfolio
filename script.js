/**
 * TESHIMA LAB Portfolio — Page Lifecycle & Typography Scripts
 * Lightweight script for static pages (about.html, etc.)
 */
document.addEventListener('DOMContentLoaded', () => {
  const applySmallKanaKerning = (element) => {
    if (!element) return;
    const smallKanaRegex = /[ァィゥェォッャュョヮヵヶ]/g;
    element.innerHTML = element.textContent.replace(
      smallKanaRegex,
      '<span class="small-kana">$&</span>'
    );
  };

  applySmallKanaKerning(document.querySelector('.kerning-tight'));
  document.body.classList.add('loaded');
});
