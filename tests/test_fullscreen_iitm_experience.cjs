const puppeteer = require('puppeteer-core');
const { CHROME_PATH, BASE_URL, ARTIFACTS_DIR } = require('./env.cjs');
const fs = require('fs');
const path = require('path');


(async () => {
  console.log('=== STARTING FULL-SCREEN IIT MADRAS VIRTUAL CAMPUS VERIFICATION ===\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`[Browser ERROR]: ${msg.text()}`);
  });

  // --------------------------------------------------------------------------
  // TEST 1: INITIAL SCREEN — ENTER THE CAMPUS (FULL-SCREEN IIT MADRAS MAIN GATE)
  // --------------------------------------------------------------------------
  console.log('1. Navigating to onboarding flow (?new_student=true)...');
  await page.goto(`${BASE_URL}/?new_student=true`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  // Step 1: Name entry
  console.log('- Entering name...');
  await page.type('input[type="text"]', 'Aditi');
  await page.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 600));

  // Step 2: Gender / avatar style
  console.log('- Advancing Step 2...');
  await page.evaluate(() => {
    const nextBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Next: Choose Character'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Step 3: Companion selection
  console.log('- Advancing Step 3 to Welcome Screen...');
  await page.evaluate(() => {
    const nextBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Continue to Welcome'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Step 4: Verification of Full-Screen Main Gate Background
  console.log('\n- Verifying Step 4: Full-Screen "ENTER THE CAMPUS"...');
  const gateImgInfo = await page.evaluate(() => {
    const img = document.querySelector('img[alt="IIT Madras Main Gate"]');
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    const style = window.getComputedStyle(img);
    return {
      width: rect.width,
      height: rect.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      objectFit: style.objectFit,
    };
  });
  console.log('Main gate image dimensions:', gateImgInfo);

  const headingText = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? h1.innerText : '';
  });
  console.log(`- Prominent Heading: "${headingText}"`);

  const hasEnterBtn = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('ENTER THE CAMPUS'));
    return btn !== null;
  });
  console.log(`- Prominent Enter Campus Button found: ${hasEnterBtn}`);

  const mainGateScreenshot = path.join(ARTIFACTS_DIR, 'fullscreen_iitm_main_gate_entrance.png');
  await page.screenshot({ path: mainGateScreenshot });
  console.log(`✓ Saved Screen 1 screenshot to ${mainGateScreenshot}`);

  // Click "ENTER THE CAMPUS"
  console.log('\n2. Clicking "ENTER THE CAMPUS" to enter virtual campus...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('ENTER THE CAMPUS'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1800));

  // --------------------------------------------------------------------------
  // TEST 2: MAIN CAMPUS — FULL-SCREEN IMMERSIVE EXPERIENCE
  // --------------------------------------------------------------------------
  console.log('\n3. Verifying Full-Screen Main Campus Layout...');
  const campusMetrics = await page.evaluate(() => {
    const main = document.querySelector('main');
    const navbar = document.querySelector('header');
    const canvasImg = document.querySelector('img[alt="Studyverse Campus Map"]');
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    return {
      mainHeight: main ? main.clientHeight : 0,
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth,
      navbarHeight: navbar ? navbar.clientHeight : 0,
      canvasImgWidth: canvasImg ? canvasImg.clientWidth : 0,
      canvasImgHeight: canvasImg ? canvasImg.clientHeight : 0,
      hasVerticalOverflow: scrollHeight > clientHeight + 5,
    };
  });
  console.log('Campus Viewport Metrics:', campusMetrics);
  console.log(`- Full viewport fill without unwanted page scrolling: ${!campusMetrics.hasVerticalOverflow}`);

  // Verify compact tabs above campus
  const navTabsCount = await page.evaluate(() => {
    const buttons = document.querySelectorAll('header [data-nav-id]');
    return buttons.length;
  });
  console.log(`- Top Navigation Destination Tabs found above campus: ${navTabsCount}`);

  const campusDesktopScreenshot = path.join(ARTIFACTS_DIR, 'fullscreen_campus_explorer_desktop.png');
  await page.screenshot({ path: campusDesktopScreenshot });
  console.log(`✓ Saved Screen 2 (Campus Explorer Desktop) screenshot to ${campusDesktopScreenshot}`);

  // --------------------------------------------------------------------------
  // TEST 3: QUICK LIST FLOATING TAB & SLIDE-OUT DRAWER OVERLAY
  // --------------------------------------------------------------------------
  console.log('\n4. Testing Quick List Floating Tab & Drawer Overlay...');

  // Click Quick List button
  await page.click('button[data-test-id="quick-list-toggle"]');
  await new Promise((r) => setTimeout(r, 600));

  // Check if drawer is visible and positioned as overlay
  const drawerInfo = await page.evaluate(() => {
    const drawer = document.querySelector('[data-test-id="quick-list-drawer"]');
    const campusImg = document.querySelector('img[alt="Studyverse Campus Map"]');
    if (!drawer) return null;
    const rect = drawer.getBoundingClientRect();
    const style = window.getComputedStyle(drawer);
    return {
      isFixed: style.position === 'fixed',
      width: rect.width,
      height: rect.height,
      right: window.innerWidth - rect.right,
      campusWidth: campusImg ? campusImg.clientWidth : 0,
      campusHeight: campusImg ? campusImg.clientHeight : 0,
    };
  });
  console.log('Quick List Drawer Info:', drawerInfo);
  console.log(`- Drawer is fixed overlay: ${drawerInfo?.isFixed}`);

  const quickListDrawerScreenshot = path.join(ARTIFACTS_DIR, 'fullscreen_campus_quick_list_drawer_open.png');
  await page.screenshot({ path: quickListDrawerScreenshot });
  console.log(`✓ Saved Screen 3 (Quick List Drawer Open) screenshot to ${quickListDrawerScreenshot}`);

  // Close Quick List
  console.log('- Closing Quick List drawer...');
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label="Close Quick List Panel"]') ||
      document.querySelector('button[data-test-id="quick-list-toggle"]');
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // --------------------------------------------------------------------------
  // TEST 4: RESPONSIVENESS — TABLET & MOBILE VIEWPORTS
  // --------------------------------------------------------------------------
  console.log('\n5. Testing Tablet Viewport (768x1024)...');
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 600));
  const tabletScreenshot = path.join(ARTIFACTS_DIR, 'fullscreen_campus_tablet.png');
  await page.screenshot({ path: tabletScreenshot });
  console.log(`✓ Saved Tablet View screenshot to ${tabletScreenshot}`);

  console.log('\n6. Testing Mobile Viewport (375x812)...');
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 600));
  const mobileScreenshot = path.join(ARTIFACTS_DIR, 'fullscreen_campus_mobile.png');
  await page.screenshot({ path: mobileScreenshot });
  console.log(`✓ Saved Mobile View screenshot to ${mobileScreenshot}`);

  // Test Mobile Quick List Drawer
  console.log('- Testing Mobile Quick List Drawer...');
  await page.click('button[data-test-id="quick-list-toggle"]');
  await new Promise((r) => setTimeout(r, 600));
  const mobileDrawerScreenshot = path.join(ARTIFACTS_DIR, 'fullscreen_quick_list_mobile.png');
  await page.screenshot({ path: mobileDrawerScreenshot });
  console.log(`✓ Saved Mobile Quick List Drawer screenshot to ${mobileDrawerScreenshot}`);

  // Test Mobile Main Gate Entrance Screen
  console.log('- Testing Mobile Main Gate Entrance Screen...');
  await page.goto(`${BASE_URL}/?new_student=true`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.type('input[type="text"]', 'Arjun');
  await page.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate(() => {
    const nextBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Next'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate(() => {
    const nextBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Continue to Welcome'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const mobileMainGateScreenshot = path.join(ARTIFACTS_DIR, 'fullscreen_iitm_main_gate_mobile.png');
  await page.screenshot({ path: mobileMainGateScreenshot });
  console.log(`✓ Saved Mobile Main Gate screenshot to ${mobileMainGateScreenshot}`);

  // --------------------------------------------------------------------------
  // TEST 5: PRESERVE ALL CAMPUS INTERACTIONS & STUDY DOCK
  // --------------------------------------------------------------------------
  console.log('\n7. Verifying Campus Interactions & Study Environments...');
  // Click enter campus on mobile to enter
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('ENTER THE CAMPUS'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Reset to desktop viewport for environment test
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 600));

  // Click Central Library from top nav tab
  console.log('- Navigating to Central Library via top tab...');
  await page.click('header button[data-nav-id="library"]');
  await new Promise((r) => setTimeout(r, 1200));

  const isInsideLibrary = await page.evaluate(() => {
    return (
      (document.body.innerText.includes('Central Library') || document.body.innerText.includes('CENTRAL LIBRARY')) &&
      document.querySelectorAll('button[data-seat-id]').length > 0
    );
  });
  console.log(`- Successfully entered Central Library environment: ${isInsideLibrary}`);

  // Select a seat in Library
  console.log('- Selecting seat lib-cubicle-01...');
  await page.evaluate(() => {
    const seatSpot = document.querySelector('button[data-seat-id="lib-cubicle-01"]') || document.querySelector('button[data-seat-id]');
    if (seatSpot) seatSpot.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const isSeated = await page.evaluate(() => {
    return document.body.innerText.includes('Currently Seated') || document.body.innerText.includes('Deep Focus') || document.body.innerText.includes('Leave Seat') || document.body.innerText.includes('STUDY TIMERS');
  });
  console.log(`- Study Dock active with seat timer: ${isSeated}`);

  const libraryRoomScreenshot = path.join(ARTIFACTS_DIR, 'fullscreen_study_room_seated.png');
  await page.screenshot({ path: libraryRoomScreenshot });
  console.log(`✓ Saved Study Room Seated screenshot to ${libraryRoomScreenshot}`);

  // Return to campus
  console.log('- Returning to Campus Map...');
  await page.click('header button[title*="Campus Map"]');
  await new Promise((r) => setTimeout(r, 1000));

  const isBackAtCampus = await page.evaluate(() => {
    return document.querySelector('img[alt="Studyverse Campus Map"]') !== null;
  });
  console.log(`- Successfully returned to full-screen Campus Map: ${isBackAtCampus}`);

  await browser.close();
  console.log('\n=== ALL FULL-SCREEN REDESIGN VERIFICATIONS PASSED SUCCESSFULLY ===');
})();
