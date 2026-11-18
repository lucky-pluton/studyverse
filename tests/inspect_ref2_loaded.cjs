const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/Dell/.gemini/antigravity/brain/0371a2be-f412-43e8-ac6d-79bfa87cca66';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage();
  try {
    console.log('Navigating to Mumbai 3D and waiting for full load...');
    await page.goto('https://mumbai-3d.easemyhood.workers.dev/', { waitUntil: 'networkidle2', timeout: 45000 });
    
    // Wait for the loading bar to disappear or canvas to render
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const isLoading = await page.evaluate(() => {
        return document.body.innerText.includes('Raising buildings') || document.body.innerText.includes('Loading');
      });
      console.log(`Check ${i+1}: isLoading = ${isLoading}`);
      if (!isLoading) break;
    }

    const screenshotPath = path.join(ARTIFACTS_DIR, 'reference_2_mumbai_loaded.png');
    await page.screenshot({ path: screenshotPath });
    console.log('Saved loaded Mumbai screenshot to', screenshotPath);
  } catch (err) {
    console.error('Error:', err.message);
  }

  await browser.close();
})();

