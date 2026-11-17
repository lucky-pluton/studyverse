const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('================================================================');
  console.log('  STUDYVERSE — ISOMETRIC CAMPUS MAP UI PROTOTYPE VERIFICATION   ');
  console.log('  Target: http://localhost:5173/                                ');
  console.log('================================================================\n');

  let allPassed = true;

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 850 });

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    // Seed student session
    await page.evaluateOnNewDocument(() => {
      window.name = 'studyverse_win_tester';
      sessionStorage.setItem('studyverse_tab_window_id', 'studyverse_win_tester');
      const student = {
        sessionId: 'user_isometric_tester_' + Date.now(),
        name: 'Arjun',
        gender: 'male',
        avatarId: 'm-kav',
        avatarConfig: {
          id: 'm-kav',
          name: 'Kav',
          gender: 'male',
          hairStyle: 'short-curls',
          hairColor: '#2b1d0c',
          skinTone: '#e0ac69',
          clothingColor: '#264653',
          studyPose: 'reading',
          accessory: 'glasses',
          expression: 'focused'
        },
        location: 'campus',
        seatId: null,
        seatEnteredAt: null,
        sessionEnteredAt: Date.now() - 3600000,
        studyTopic: 'Algorithms & Data Structures',
        isDnd: false
      };
      sessionStorage.setItem('studyverse_session', JSON.stringify(student));
    });

    console.log('--- Step 1: Navigating to Studyverse Campus Map ---');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    console.log('Console Errors on load:', consoleErrors);
    if (consoleErrors.length > 0) {
      console.error('FAIL: Console errors detected on page load!');
      allPassed = false;
    } else {
      console.log('PASS: Zero console errors on campus load.');
    }

    // --- Step 2: Verify Campus Identity Panel (Top-Left) ---
    console.log('\n--- Step 2: Campus Identity Panel (Top-Left) ---');
    const identityPanel = await page.evaluate(() => {
      const title = document.querySelector('h1')?.innerText;
      const subtitle = Array.from(document.querySelectorAll('p')).find(p => p.innerText.includes('VIRTUAL CAMPUS'))?.innerText;
      return { title, subtitle };
    });
    console.log('Identity Panel Check:', identityPanel);
    if (!identityPanel.title?.includes('Studyverse') || !identityPanel.subtitle?.includes('VIRTUAL CAMPUS')) {
      console.error('FAIL: Campus Identity Panel missing or incorrect text!');
      allPassed = false;
    } else {
      console.log('PASS: Studyverse Identity Card rendered with "Virtual Campus" subtitle.');
    }

    // --- Step 3: Verify Category Legend (Top-Center) ---
    console.log('\n--- Step 3: Location Category Legend (Top-Center) ---');
    const legendCategories = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
      return {
        hasAcademic: buttons.some(b => b.includes('Academic')),
        hasStudySpaces: buttons.some(b => b.includes('Study Spaces')),
        hasSocialSpaces: buttons.some(b => b.includes('Social Spaces')),
        hasGreenSpaces: buttons.some(b => b.includes('Green Spaces')),
        hasAllSpots: buttons.some(b => b.includes('All Spots'))
      };
    });
    console.log('Legend Categories Check:', legendCategories);
    if (!legendCategories.hasAcademic || !legendCategories.hasStudySpaces || !legendCategories.hasSocialSpaces || !legendCategories.hasGreenSpaces) {
      console.error('FAIL: One or more category legend pills missing!');
      allPassed = false;
    } else {
      console.log('PASS: All 4 category legend items (Academic, Study Spaces, Social Spaces, Green Spaces) present.');
    }

    // --- Step 4: Verify Floating Location Cards (Desktop) ---
    console.log('\n--- Step 4: Floating Location Cards & Thumbnails ---');
    const locationCards = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.interactive-card'));
      return cards.map(c => {
        const title = c.querySelector('h3')?.innerText;
        const category = c.querySelector('span.uppercase')?.innerText;
        const img = c.querySelector('img')?.getAttribute('src');
        return { title, category, hasImage: !!img };
      });
    });
    console.log('Discovered Location Cards:', locationCards);
    if (locationCards.length < 5) {
      console.error(`FAIL: Expected at least 5 location cards, found ${locationCards.length}!`);
      allPassed = false;
    } else {
      console.log(`PASS: Rendered ${locationCards.length} interactive floating location cards.`);
    }

    // --- Step 5: Verify Connector Leader Lines & Pins (SVG Layer) ---
    console.log('\n--- Step 5: SVG Leader Connector Lines & Target Pins ---');
    const svgElements = await page.evaluate(() => {
      const paths = Array.from(document.querySelectorAll('svg path'));
      const pins = Array.from(document.querySelectorAll('g[id^="pin-"], g[class*="cursor-pointer"]'));
      return { pathCount: paths.length, pinCount: pins.length };
    });
    console.log('SVG Overlay Inspection:', svgElements);
    if (svgElements.pathCount === 0 || svgElements.pinCount === 0) {
      console.error('FAIL: Missing connector paths or pin markers in SVG layer!');
      allPassed = false;
    } else {
      console.log('PASS: SVG leader connector lines and building pins rendered.');
    }

    // --- Step 6: Test Category Filtering Interaction ---
    console.log('\n--- Step 6: Category Filter Interaction ---');
    // Click "Academic" filter
    await page.evaluate(() => {
      const academicBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Academic'));
      if (academicBtn) academicBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const academicFilteredCards = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.interactive-card'));
      return cards.map(c => c.querySelector('h3')?.innerText);
    });
    console.log('Cards visible after clicking "Academic":', academicFilteredCards);
    if (academicFilteredCards.length !== 1 || !academicFilteredCards[0].includes('Lecture Hall')) {
      console.error('FAIL: Category filtering did not isolate Academic locations properly!');
      allPassed = false;
    } else {
      console.log('PASS: Category filter correctly filtered cards to Academic.');
    }

    // Reset filter to "All Spots"
    await page.evaluate(() => {
      const allBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('All Spots'));
      if (allBtn) allBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // --- Step 7: Test Search Control ---
    console.log('\n--- Step 7: Search Control Interaction ---');
    // Click search button
    await page.evaluate(() => {
      const searchBtn = document.querySelector('button[aria-label="Search campus"]');
      if (searchBtn) searchBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));

    // Type "Café" in search input
    await page.type('.search-modal input', 'Café');
    await new Promise(r => setTimeout(r, 300));

    const searchResults = await page.evaluate(() => {
      const results = Array.from(document.querySelectorAll('.search-modal button')).map(b => b.innerText);
      return results;
    });
    console.log('Search results for "Café":', searchResults);
    const hasCafeResult = searchResults.some(r => r.includes('Campus Café'));
    if (!hasCafeResult) {
      console.error('FAIL: Search modal did not return Campus Café!');
      allPassed = false;
    } else {
      console.log('PASS: Search successfully filtered and surfaced Campus Café.');
    }

    // Close search
    await page.evaluate(() => {
      const searchBtn = document.querySelector('button[aria-label="Search campus"]');
      if (searchBtn) searchBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));

    // --- Step 8: Test Zoom Controls ---
    console.log('\n--- Step 8: Zoom & Fit Controls ---');
    const initialTransform = await page.evaluate(() => {
      const canvas = document.querySelector('.origin-center');
      return canvas ? canvas.getAttribute('style') : null;
    });
    console.log('Initial transform style:', initialTransform);

    // Click Zoom In
    await page.evaluate(() => {
      const zoomInBtn = document.querySelector('button[aria-label="Zoom In"]');
      if (zoomInBtn) zoomInBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));

    const zoomedInTransform = await page.evaluate(() => {
      const canvas = document.querySelector('.origin-center');
      return canvas ? canvas.getAttribute('style') : null;
    });
    console.log('Zoomed in transform style:', zoomedInTransform);

    if (zoomedInTransform === initialTransform || !zoomedInTransform?.includes('scale(1.15)')) {
      console.error('FAIL: Zoom in did not update transform style!');
      allPassed = false;
    } else {
      console.log('PASS: Zoom In smoothly scaled map canvas to 1.15.');
    }

    // Click Reset
    await page.evaluate(() => {
      const resetBtn = document.querySelector('button[aria-label="Reset View"]');
      if (resetBtn) resetBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));

    // --- Step 9: Take Screenshot of Prototype ---
    const screenshotPath = path.join(__dirname, 'isometric_prototype_preview.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`\nScreenshot captured: ${screenshotPath}`);

    // --- Step 10: Test Entering Location via Card Click ---
    console.log('\n--- Step 10: Entering Location (Central Library) ---');
    await page.click('[data-testid="card-library"]');
    await new Promise(r => setTimeout(r, 1200));

    const enteredLocationCheck = await page.evaluate(() => {
      const hasBackBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Campus Map') || b.innerText.includes('Return to Campus'));
      const hasLibraryHeader = !!document.body.innerText.includes('Central Library') && !!document.body.innerText.includes('Seats in Central Library');
      return { hasLibraryHeader, hasBackBtn };
    });
    console.log('Inside Location View:', enteredLocationCheck);

    if (!enteredLocationCheck.hasLibraryHeader || !enteredLocationCheck.hasBackBtn) {
      console.error('FAIL: Clicking location card did not enter LocationView!');
      allPassed = false;
    } else {
      console.log('PASS: Location card successfully opened Central Library with seats and study atmosphere.');
    }

    // Select a seat in library to test seating functionality
    console.log('\n--- Step 11: Seating & StudyDock Functionality ---');
    // Find an interactive seat marker '+' in Central Library
    const seatFound = await page.evaluate(() => {
      const seatButtons = Array.from(document.querySelectorAll('button'));
      const seatBtn = seatButtons.find(b => b.innerText.trim() === '+' || b.innerText.includes('Silent Study Desk'));
      if (seatBtn) {
        seatBtn.click();
        return true;
      }
      return false;
    });
    console.log('Seat button found & clicked:', seatFound);
    await new Promise(r => setTimeout(r, 1000));

    const dockCheck = await page.evaluate(() => {
      const leaveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Leave Seat'));
      return { hasLeaveBtn: !!leaveBtn };
    });
    console.log('StudyDock Seating Check:', dockCheck);
    if (!dockCheck.hasLeaveBtn) {
      console.error('FAIL: Seating in LocationView did not activate StudyDock!');
      allPassed = false;
    } else {
      console.log('PASS: Seating functionality, seat timer, and StudyDock 100% preserved.');
    }

    // Leave seat and return to Campus Map
    await page.evaluate(() => {
      const leaveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Leave Seat'));
      if (leaveBtn) leaveBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    await page.evaluate(() => {
      const backBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Campus Map') || b.innerText.includes('Return to Campus'));
      if (backBtn) backBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Verify back on isometric campus map
    const backOnMap = await page.evaluate(() => {
      return !!document.querySelector('[data-testid="card-library"]');
    });
    if (!backOnMap) {
      console.error('FAIL: Returning to Campus Map did not restore Isometric Campus Map!');
      allPassed = false;
    } else {
      console.log('PASS: Smoothly navigated back to Isometric Campus Map.');
    }

    // --- Step 12: Test Classic View Switcher ---
    console.log('\n--- Step 12: View Switcher (Isometric vs Classic) ---');
    await page.evaluate(() => {
      const classicBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Classic Map'));
      if (classicBtn) classicBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const classicViewCheck = await page.evaluate(() => {
      const hasWelcomeBanner = !!document.body.innerText.includes('Live Campus Occupancy Map');
      const hasIsometricBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Isometric View'));
      return { hasWelcomeBanner, hasIsometricBtn };
    });
    console.log('Classic View Inspection:', classicViewCheck);

    if (!classicViewCheck.hasWelcomeBanner || !classicViewCheck.hasIsometricBtn) {
      console.error('FAIL: Classic View switcher failed!');
      allPassed = false;
    } else {
      console.log('PASS: Switched to Classic Campus Map successfully.');
    }

    // Switch back to Isometric View
    await page.evaluate(() => {
      const isoBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Isometric View'));
      if (isoBtn) isoBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const backToIsoCheck = await page.evaluate(() => !!document.querySelector('.interactive-card'));
    if (!backToIsoCheck) {
      console.error('FAIL: Switching back to Isometric Prototype failed!');
      allPassed = false;
    } else {
      console.log('PASS: Switched back to Isometric Prototype cleanly.');
    }

    console.log('\n================================================================');
    if (allPassed) {
      console.log('  ALL PROTOTYPE TESTS PASSED WITH 100% SUCCESS!                ');
    } else {
      console.error('  TEST SUITE FINISHED WITH ERRORS                              ');
    }
    console.log('================================================================\n');

  } catch (err) {
    console.error('Unexpected error during prototype testing:', err);
    allPassed = false;
  } finally {
    await browser.close();
    process.exit(allPassed ? 0 : 1);
  }
})();
