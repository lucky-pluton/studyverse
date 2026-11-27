const puppeteer = require('puppeteer-core');
const { CHROME_PATH, BASE_URL, ARTIFACTS_DIR } = require('./env.cjs');
const fs = require('fs');
const path = require('path');


(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage();
  console.log(`Navigating to ${BASE_URL}/?demo=true ...`);
  await page.goto(`${BASE_URL}/?demo=true`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // Switch to 3D mode
  console.log('Clicking 3D mode toggle button...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn3D = buttons.find(b => b.innerText.includes('3D') || b.title?.includes('3D'));
    if (btn3D) btn3D.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const screenshotPath = path.join(ARTIFACTS_DIR, 'current_3d_campus_before_refactor.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved current 3D canvas screenshot to', screenshotPath);

  await browser.close();
})();

