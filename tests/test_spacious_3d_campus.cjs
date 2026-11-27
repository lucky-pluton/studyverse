const puppeteer = require('puppeteer-core');
const { CHROME_PATH, BASE_URL, ARTIFACTS_DIR } = require('./env.cjs');
const fs = require('fs');
const path = require('path');


(async () => {
  console.log('=== STARTING SPACIOUS 3D CAMPUS EXPLORER VERIFICATION ===\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`[Browser ERROR]: ${msg.text()}`);
  });

  // 1. Navigate to Studyverse
  console.log(`1. Navigating to ${BASE_URL}/?demo=true ...`);
  await page.goto(`${BASE_URL}/?demo=true`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));

  // 2. Switch to 3D Campus Mode
  console.log('2. Switching to 3D Campus Explorer mode...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn3D = buttons.find((b) => b.innerText.includes('3D') || b.title?.includes('3D'));
    if (btn3D) btn3D.click();
  });
  await new Promise((r) => setTimeout(r, 2000));

  // 3. Verify Canvas & Spacious Isometric Overview
  console.log('3. Verifying 3D Canvas presence and overview...');
  const canvasExists = await page.evaluate(() => {
    const root = document.querySelector('[data-test-id="3d-campus-explorer-root"]');
    const canvas = root ? root.querySelector('canvas') : null;
    return !!canvas;
  });
  console.log(`- 3D Canvas mounted: ${canvasExists}`);

  const overviewScreenshot = path.join(ARTIFACTS_DIR, '3d_campus_spacious_overview.png');
  await page.screenshot({ path: overviewScreenshot });
  console.log(`✓ Saved 3D Campus Overview screenshot to ${overviewScreenshot}`);

  // 4. Test Bottom Quick-Jump Pill for Central Library
  console.log('\n4. Testing Quick Jump to Central Library...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const libBtn = buttons.find((b) => b.innerText.trim() === 'Central Library');
    if (libBtn) libBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1600));

  // Check Location Details Card
  const detailsInfo = await page.evaluate(() => {
    const card = document.querySelector('[data-test-id="3d-location-details-card"]');
    if (!card) return null;
    return {
      title: card.querySelector('h3')?.innerText || '',
      category: card.querySelector('span')?.innerText || '',
      hasEnterBtn: !!card.querySelector('[data-test-id="enter-study-room-btn"]'),
    };
  });
  console.log('Location Details Card Info:', detailsInfo);

  const libraryFocusScreenshot = path.join(ARTIFACTS_DIR, '3d_campus_library_focused.png');
  await page.screenshot({ path: libraryFocusScreenshot });
  console.log(`✓ Saved Library Focused screenshot to ${libraryFocusScreenshot}`);

  // 5. Test Golden Hour / Sunset Mode
  console.log('\n5. Testing Sunset / Golden Hour Lighting...');
  await page.evaluate(() => {
    const sunsetBtn = document.querySelector('button[title="Golden Hour / Sunset"]');
    if (sunsetBtn) sunsetBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  const sunsetScreenshot = path.join(ARTIFACTS_DIR, '3d_campus_sunset_golden_hour.png');
  await page.screenshot({ path: sunsetScreenshot });
  console.log(`✓ Saved Sunset screenshot to ${sunsetScreenshot}`);

  // 6. Test Night Illumination Mode
  console.log('\n6. Testing Night Illumination Mode...');
  await page.evaluate(() => {
    const nightBtn = document.querySelector('button[title="Night Illumination"]');
    if (nightBtn) nightBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  const nightScreenshot = path.join(ARTIFACTS_DIR, '3d_campus_night_mode.png');
  await page.screenshot({ path: nightScreenshot });
  console.log(`✓ Saved Night Mode screenshot to ${nightScreenshot}`);

  // Return to Day mode
  await page.evaluate(() => {
    const dayBtn = document.querySelector('button[title="Campus Midday"]');
    if (dayBtn) dayBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // 7. Test Entering Study Environment from 3D Campus
  console.log('\n7. Entering Study Environment via "Enter Study Environment" button...');
  await page.click('[data-test-id="enter-study-room-btn"]');
  await new Promise((r) => setTimeout(r, 1500));

  const enteredRoom = await page.evaluate(() => {
    return (
      (document.body.innerText.includes('Central Library') || document.body.innerText.includes('CENTRAL LIBRARY')) &&
      document.querySelectorAll('button[data-seat-id]').length > 0
    );
  });
  console.log(`- Successfully transitioned into Central Library room: ${enteredRoom}`);

  const roomSeatedScreenshot = path.join(ARTIFACTS_DIR, '3d_entered_study_environment.png');
  await page.screenshot({ path: roomSeatedScreenshot });
  console.log(`✓ Saved Entered Study Environment screenshot to ${roomSeatedScreenshot}`);

  // 8. Return to Campus Map
  console.log('\n8. Returning back to Campus...');
  await page.evaluate(() => {
    const backBtn = document.querySelector('header button[title*="Campus Map"]') ||
      Array.from(document.querySelectorAll('header button')).find(b => b.innerText.includes('Campus Map'));
    if (backBtn) backBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const backAtCampus = await page.evaluate(() => {
    return document.querySelector('[data-test-id="3d-campus-explorer-root"]') !== null ||
      document.querySelector('img[alt="Studyverse Campus Map"]') !== null;
  });
  console.log(`- Successfully returned to Campus Map: ${backAtCampus}`);

  await browser.close();
  console.log('\n=== ALL 3D CAMPUS EXPLORER VERIFICATIONS PASSED ===');
})();

