const puppeteer = require('puppeteer-core');
const { CHROME_PATH } = require('./env.cjs');

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new' });
  const page = await browser.newPage();
  await page.goto('https://roshanbinoj-iiitk.github.io/iiitk-campus-in-3d/', { waitUntil: 'networkidle2' });
  
  const tech = await page.evaluate(() => {
    return {
      hasThree: typeof window.THREE !== 'undefined',
      globals: Object.keys(window).filter(k => k.toLowerCase().includes('three') || k.toLowerCase().includes('scene')),
      domStructure: Array.from(document.querySelectorAll('body > *')).map(el => ({ tag: el.tagName, id: el.id, class: el.className })),
      links: Array.from(document.querySelectorAll('link, script')).map(s => s.src || s.href).filter(Boolean)
    };
  });
  console.log('Tech info Ref 1:', JSON.stringify(tech, null, 2));
  await browser.close();
})();

