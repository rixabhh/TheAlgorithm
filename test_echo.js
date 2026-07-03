const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const videoDir = '/home/jules/verification/';
    if (!fs.existsSync(videoDir)){
        fs.mkdirSync(videoDir, { recursive: true });
    }

    const context = await browser.newContext({
        recordVideo: {
            dir: videoDir,
            size: { width: 1280, height: 720 }
        }
    });

    const contextPage = await context.newPage();
    await contextPage.goto('http://localhost:8788');

    // Screenshot initial page state
    await contextPage.screenshot({ path: videoDir + 'screenshot2.png' });

    await contextPage.close();
    await context.close();
    await browser.close();
})();
