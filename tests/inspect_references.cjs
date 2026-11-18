const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/Dell/.gemini/antigravity/brain/0371a2be-f412-43e8-ac6d-79bfa87cca66';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('=== INSPECTING 3D CAMPUS REFERENCES ===\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader']
  });

  // Reference 1: iiitk-campus-in-3d
  console.log('Navigating to Reference 1: https://roshanbinoj-iiitk.github.io/iiitk-campus-in-3d/ ...');
  const page1 = await browser.newPage();
  try {
    const res1 = await page1.goto('https://roshanbinoj-iiitk.github.io/iiitk-campus-in-3d/', {
      waitUntil: 'networkidle2',
      timeout: 25000
    });
    console.log('Ref 1 HTTP status:', res1 ? res1.status() : 'unknown');
    await new Promise(r => setTimeout(r, 4000));

    const title1 = await page1.title();
    console.log('Ref 1 Title:', title1);

    const ref1Metrics = await page1.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const text = document.body.innerText.slice(0, 500);
      const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline');
      return {
        hasCanvas: !!canvas,
        canvasWidth: canvas ? canvas.width : 0,
        canvasHeight: canvas ? canvas.height : 0,
        textSnippet: text,
        scriptCount: scripts.length
      };
    });
    console.log('Ref 1 Metrics:', ref1Metrics);

    const screenshot1Path = path.join(ARTIFACTS_DIR, 'reference_1_iiitk.png');
    await page1.screenshot({ path: screenshot1Path });
    console.log('Saved Ref 1 screenshot to', screenshot1Path);
  } catch (err) {
    console.error('Error loading Reference 1:', err.message);
  }

  // Reference 2: mumbai-3d
  console.log('\nNavigating to Reference 2: https://mumbai-3d.easemyhood.workers.dev/ ...');
  const page2 = await browser.newPage();
  try {
    const res2 = await page2.goto('https://mumbai-3d.easemyhood.workers.dev/', {
      waitUntil: 'networkidle2',
      timeout: 25000
    });
    console.log('Ref 2 HTTP status:', res2 ? res2.status() : 'unknown');
    await new Promise(r => setTimeout(r, 4000));

    const title2 = await page2.title();
    console.log('Ref 2 Title:', title2);

    const ref2Metrics = await page2.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const text = document.body.innerText.slice(0, 500);
      const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline');
      return {
        hasCanvas: !!canvas,
        canvasWidth: canvas ? canvas.width : 0,
        canvasHeight: canvas ? canvas.height : 0,
        textSnippet: text,
        scriptCount: scripts.length
      };
    });
    console.log('Ref 2 Metrics:', ref2Metrics);

    const screenshot2Path = path.join(ARTIFACTS_DIR, 'reference_2_mumbai.png');
    await page2.screenshot({ path: screenshot2Path });
    console.log('Saved Ref 2 screenshot to', screenshot2Path);
  } catch (err) {
    console.error('Error loading Reference 2:', err.message);
  }

  await browser.close();
  console.log('\n=== FINISHED INSPECTING REFERENCES ===');
})();

