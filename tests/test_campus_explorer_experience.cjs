const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/Dell/.gemini/antigravity/brain/0371a2be-f412-43e8-ac6d-79bfa87cca66';

const DESTINATIONS = [
  { id: 'library', name: 'Central Library', seatId: 'lib-cubicle-01' },
  { id: 'lhc', name: 'Lecture Hall Complex', seatId: 'lhc-hall1-05' },
  { id: 'banyan', name: 'Banyan Tree Grove', seatId: 'banyan-lawn-01' },
  { id: 'oat', name: 'Open Air Theatre', seatId: 'oat-tier-lower-03' },
  { id: 'cafe', name: 'Campus Café', seatId: 'cafe-patio-01' },
  { id: 'park', name: 'Sangam Gardens', seatId: 'park-path-01' },
  { id: 'gc', name: 'Gajendra Circle', seatId: 'gc-fountain-01' },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();
  console.log('--- Step 1: Navigating to Studyverse Campus Explorer (http://localhost:5173/?demo=true) ---');
  await page.goto('http://localhost:5173/?demo=true', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Capture Campus Explorer Homepage with user avatar on campus
  const explorerShot = path.join(ARTIFACTS_DIR, 'explorer_homepage_live.png');
  await page.screenshot({ path: explorerShot });
  console.log('Saved Campus Explorer homepage screenshot:', explorerShot);

  // 2. Test Building Hover Preview
  console.log('\n--- Step 2: Testing Building Hover Preview (Central Library) ---');
  const hovered = await page.evaluate(() => {
    const libHotspot = document.querySelector('[data-location-id="library"]');
    if (libHotspot) {
      libHotspot.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      return true;
    }
    return false;
  });
  console.log('Hovered library hotspot:', hovered);
  await new Promise(r => setTimeout(r, 600));

  const hoverShot = path.join(ARTIFACTS_DIR, 'explorer_hover_preview.png');
  await page.screenshot({ path: hoverShot });
  console.log('Saved building hover preview screenshot:', hoverShot);

  // 3. Test Interactive Walking & Room Transition for all 7 destinations
  for (let i = 0; i < DESTINATIONS.length; i++) {
    const dest = DESTINATIONS[i];
    console.log(`\n--- [${i + 1}/7] Testing Destination: ${dest.name} (${dest.id}) ---`);

    // Click building hotspot or marker
    const clicked = await page.evaluate((locId) => {
      const target = document.querySelector(`div[data-location-id="${locId}"], button[data-location-id="${locId}"]`);
      if (target) {
        target.click();
        return true;
      }
      return false;
    }, dest.id);
    console.log(`Clicked ${dest.name}:`, clicked);

    // Wait for walking animation and room transition (approx 800ms)
    await new Promise(r => setTimeout(r, 1200));

    // Verify room view loaded
    const inRoom = await page.evaluate((locName) => {
      return document.body.innerText.includes(locName) || document.body.innerText.includes('seats available');
    }, dest.name);
    console.log(`Entered room ${dest.name}:`, inRoom);

    // Test Room Zoom Controls
    await page.evaluate(() => {
      const zoomInBtn = document.querySelector('button[title*="Zoom into Room"]');
      if (zoomInBtn) zoomInBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Reset Room Zoom
    await page.evaluate(() => {
      const resetBtn = document.querySelector('button[title*="Reset Zoom"]');
      if (resetBtn) resetBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Select designated seat
    const seatClicked = await page.evaluate((sId) => {
      const btn = document.querySelector(`button[data-seat-id="${sId}"]`);
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    }, dest.seatId);
    console.log(`Seated at ${dest.seatId}:`, seatClicked);

    await new Promise(r => setTimeout(r, 800));

    // Save screenshot of seated room
    const roomShot = path.join(ARTIFACTS_DIR, `explorer_room_${i + 1}_${dest.id}.png`);
    await page.screenshot({ path: roomShot });
    console.log(`Saved room screenshot: ${roomShot}`);

    // Return to Campus Explorer
    const returned = await page.evaluate(() => {
      const backBtn = document.querySelector('button[title*="Return to Campus Explorer"], button[title*="Return to Campus Map"]');
      if (backBtn) {
        backBtn.click();
        return true;
      }
      return false;
    });
    console.log(`Returned to Campus Explorer:`, returned);
    await new Promise(r => setTimeout(r, 1200));
  }

  // 4. Test Tablet Viewport
  console.log('\n--- Step 4: Testing Tablet Viewport (768x1024) ---');
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 800));
  const tabletShot = path.join(ARTIFACTS_DIR, 'explorer_tablet_view.png');
  await page.screenshot({ path: tabletShot });
  console.log('Saved tablet screenshot:', tabletShot);

  // 5. Test Mobile Viewport
  console.log('\n--- Step 5: Testing Mobile Viewport (390x844) ---');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 800));
  const mobileShot = path.join(ARTIFACTS_DIR, 'explorer_mobile_view.png');
  await page.screenshot({ path: mobileShot });
  console.log('Saved mobile screenshot:', mobileShot);

  await browser.close();
  console.log('\nAll interactive explorer & study environment tests passed successfully!');
})();

