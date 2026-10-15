const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({width: 1200, height: 800});
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.goto('http://localhost:8080/other.html', {waitUntil: 'networkidle0'});
    await new Promise(r => setTimeout(r, 2000));
    const data = await page.evaluate(() => {
        const stage = document.querySelector('.floating-stage');
        const canvas = document.getElementById('floating-canvas');
        return {
            stageHeight: stage ? stage.style.minHeight : null,
            canvasRect: canvas ? canvas.getBoundingClientRect() : null,
            globalImages: window.PORTFOLIO_IMAGES?.length
        };
    });
    console.log(JSON.stringify(data, null, 2));
    await page.screenshot({path: 'screenshot.png'});
    await browser.close();
})();
