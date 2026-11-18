const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/Dell/.gemini/antigravity/brain/0371a2be-f412-43e8-ac6d-79bfa87cca66';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 768, height: 1024, deviceScaleFactor: 2 },
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/?demo=true', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const btn3D = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('3D'));
    if (btn3D) btn3D.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Tablet screenshot
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '3d_campus_tablet.png') });
  console.log('Saved Tablet screenshot');

  // Mobile screenshot
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '3d_campus_mobile.png') });
  console.log('Saved Mobile screenshot');

  await browser.close();
})();

