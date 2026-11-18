const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('=== TESTING OPENING ALL 7 LOCATIONS IN 3D MODE ===\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[Page ERROR]:', msg.text());
  });

  await page.goto('http://localhost:5173/?demo=true', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Switch to 3D mode
  await page.evaluate(() => {
    const btn3D = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('3D'));
    if (btn3D) btn3D.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const testLocations = [
    { name: 'Central Library', id: 'library' },
    { name: 'Lecture Hall Complex', id: 'lhc' },
    { name: 'Banyan Tree Study Grove', id: 'banyan' },
    { name: 'Open Air Theatre', id: 'oat' },
    { name: 'Campus Café', id: 'cafe' },
    { name: 'Sangam Gardens', id: 'park' },
    { name: 'Gajendra Circle', id: 'gc' },
  ];

  for (const loc of testLocations) {
    console.log(`\nTesting location: ${loc.name} (${loc.id})...`);

    // 1. Click bottom quick jump pill
    const clickedPill = await page.evaluate((locName) => {
      const pills = Array.from(document.querySelectorAll('button'));
      const pill = pills.find(p => p.innerText.trim().toLowerCase() === locName.toLowerCase());
      if (pill) {
        pill.click();
        return true;
      }
      return false;
    }, loc.name);
    console.log(`- Clicked bottom pill: ${clickedPill}`);
    await new Promise(r => setTimeout(r, 800));

    // 2. Check if details card opened
    const cardInfo = await page.evaluate(() => {
      const card = document.querySelector('[data-test-id="3d-location-details-card"]');
      if (!card) return null;
      const title = card.querySelector('h3')?.innerText || '';
      const enterBtn = card.querySelector('[data-test-id="enter-study-room-btn"]');
      return { title, hasEnterBtn: !!enterBtn };
    });
    console.log(`- Details card info:`, cardInfo);

    if (!cardInfo || !cardInfo.hasEnterBtn) {
      console.error(`FAILED: Details card did not show Enter button for ${loc.name}`);
      continue;
    }

    // 3. Click Enter button
    await page.click('[data-test-id="enter-study-room-btn"]');
    await new Promise(r => setTimeout(r, 1200));

    // 4. Verify room view entered
    const roomState = await page.evaluate((locId) => {
      const isRoomOpen = document.querySelectorAll('button[data-seat-id]').length > 0 ||
        document.body.innerText.includes('seats available') ||
        document.body.innerText.includes('studying');
      const hasBackBtn = !!document.querySelector('header button[title*="Campus Map"]');
      return { isRoomOpen, hasBackBtn, url: window.location.href };
    }, loc.id);
    console.log(`- Entered room result:`, roomState);

    // 5. Return back to 3D campus
    await page.evaluate(() => {
      const backBtn = document.querySelector('header button[title*="Campus Map"]') ||
        Array.from(document.querySelectorAll('header button')).find(b => b.innerText.includes('Campus Map'));
      if (backBtn) backBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
  }

  await browser.close();
  console.log('\n=== FINISHED TESTING ALL LOCATIONS ===');
})();

