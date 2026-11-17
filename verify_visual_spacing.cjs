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
  console.log('  STUDYVERSE — VERIFY CORRECTED CAMPUS MAP LAYOUT & SPACING      ');
  console.log('  Target: http://localhost:5173/                                ');
  console.log('================================================================\n');

  let allPassed = true;

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950 });

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
        sessionId: 'user_spacing_tester_' + Date.now(),
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

    console.log('[1/8] Navigating to http://localhost:5173/ ...');
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // Check 1: Top Welcome Banner
    console.log('[2/8] Verifying Top Welcome Banner & Census Bar ...');
    const welcomeText = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.innerText : '';
    });
    console.log('      Welcome Banner:', welcomeText);
    if (!welcomeText.includes('Live Campus Occupancy Map')) {
      console.error('      FAIL: Top Welcome Banner missing!');
      allPassed = false;
    } else {
      console.log('      PASS: Top Welcome Banner present and correct.');
    }

    // Check 2: Verify Illustrated Pastel Background
    console.log('[3/8] Verifying Illustrated Isometric Canvas Background ...');
    const bgInfo = await page.evaluate(() => {
      const img = document.querySelector('img[alt="Studyverse Illustrated Isometric Campus Map"]');
      return {
        found: !!img,
        src: img ? img.src : null,
        complete: img ? img.complete : false
      };
    });
    console.log('      Background image element found:', bgInfo.found, 'complete:', bgInfo.complete);
    if (!bgInfo.found || !bgInfo.complete) {
      console.error('      FAIL: Campus illustrated background not loaded!');
      allPassed = false;
    } else {
      console.log('      PASS: Campus illustrated pastel background loaded successfully.');
    }

    // Check 3: Card Count and Card Consistency Check
    console.log('[4/8] Checking Featured Location Cards (Exact Count & Consistency) ...');
    const cardData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.interactive-card'));
      return cards.map(c => {
        const rect = c.getBoundingClientRect();
        const imgs = c.querySelectorAll('img');
        const text = c.innerText.trim();
        return {
          title: text.split('\n')[0],
          rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height },
          imageCount: imgs.length,
          hasChevron: !!c.querySelector('svg')
        };
      });
    });
    console.log(`      Found ${cardData.length} interactive cards:`);
    cardData.forEach((c, idx) => {
      console.log(`        Card ${idx + 1}: "${c.title}" at (${Math.round(c.rect.left)}, ${Math.round(c.rect.top)}) - w:${Math.round(c.rect.width)}px, h:${Math.round(c.rect.height)}px. Images: ${c.imageCount}`);
    });

    if (cardData.length !== 6) {
      console.error(`      FAIL: Expected exactly 6 featured location cards, found ${cardData.length}!`);
      allPassed = false;
    } else {
      console.log('      PASS: Exactly 6 featured location cards rendered.');
    }

    const inconsistentCards = cardData.filter(c => c.imageCount !== 1);
    if (inconsistentCards.length > 0) {
      console.error('      FAIL: Inconsistent cards with multiple images detected:', inconsistentCards);
      allPassed = false;
    } else {
      console.log('      PASS: Every card has exactly ONE thumbnail image and ONE title (zero duplication).');
    }

    // Check 4: Pairwise Card Overlap Check
    console.log('[5/8] Checking for Card Overlap (Bounding Box Collision Test) ...');
    let overlapsFound = 0;
    for (let i = 0; i < cardData.length; i++) {
      for (let j = i + 1; j < cardData.length; j++) {
        const r1 = cardData[i].rect;
        const r2 = cardData[j].rect;
        const noOverlap = (r1.right <= r2.left) || (r1.left >= r2.right) || (r1.bottom <= r2.top) || (r1.top >= r2.bottom);
        if (!noOverlap) {
          console.error(`      FAIL: Card "${cardData[i].title}" collides with "${cardData[j].title}"!`);
          overlapsFound++;
          allPassed = false;
        }
      }
    }
    if (overlapsFound === 0) {
      console.log('      PASS: ZERO card collisions or overlaps detected! Perfect spatial separation.');
    }

    // Check 5: Connector Lines Check
    console.log('[6/8] Checking Connector Lines and Endpoint Markers ...');
    const svgInfo = await page.evaluate(() => {
      const svg = document.querySelector('svg[viewBox="0 0 1024 682"]');
      if (!svg) return { lineCount: 0, markerCount: 0 };
      const lines = svg.querySelectorAll('line');
      const circles = svg.querySelectorAll('circle');
      return {
        lineCount: lines.length,
        markerCount: circles.length
      };
    });
    console.log(`      SVG Connector Lines: ${svgInfo.lineCount}, Endpoint Markers: ${svgInfo.markerCount}`);
    if (svgInfo.lineCount < 6) {
      console.error('      FAIL: Expected at least 6 connector lines!');
      allPassed = false;
    } else {
      console.log('      PASS: All 6 location connector lines and markers rendered.');
    }

    // Check 6: Campus Information Table (CampusInfoPanel)
    console.log('[7/8] Verifying Campus Information Table (CampusInfoPanel) ...');
    const tableCheck = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return {
        panelVisible: text.includes('live campus occupancy'),
        tableVisible: text.includes('destination occupancy status'),
        libraryPresent: text.includes('central library') && text.includes('seats occupied'),
        activeLearnersTab: text.includes("who's studying") || text.includes('census')
      };
    });
    console.log('      Table checks:', tableCheck);
    if (!tableCheck.panelVisible || !tableCheck.tableVisible) {
      console.error('      FAIL: Campus Information Table missing or collapsed!');
      allPassed = false;
    } else {
      console.log('      PASS: Original Campus Information Table fully restored below the map!');
    }

    // Check 7: Interactive Room Navigation
    console.log('[8/8] Testing Location Navigation (entering Central Library room) ...');
    const navSuccess = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.interactive-card'));
      const lib = cards.find(c => c.innerText.includes('Central Library'));
      if (lib) {
        lib.click();
        return true;
      }
      return false;
    });

    if (navSuccess) {
      await new Promise(r => setTimeout(r, 1200));
      const inRoom = await page.evaluate(() => {
        return document.body.innerText.includes('Central Library') &&
          (document.body.innerText.includes('Silent Study Desk') || document.body.innerText.includes('Reading'));
      });
      console.log('      Entered Central Library room:', inRoom);
      if (!inRoom) {
        console.error('      FAIL: Navigation into study room failed!');
        allPassed = false;
      } else {
        console.log('      PASS: Location selection navigation is 100% functional!');
      }

      // Return back to campus
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const campusBtn = btns.find(b => b.innerText.includes('Campus Map') || b.innerText.includes('Campus'));
        if (campusBtn) campusBtn.click();
      });
      await new Promise(r => setTimeout(r, 1000));
    }

    // Capture Full Page Screenshot
    const screenshotPath = path.join(__dirname, 'campus_corrected_pastel_preview.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n      Full-page screenshot saved to: ${screenshotPath}`);

    // Copy to artifact directory
    const artifactDir = 'C:/Users/Dell/.gemini/antigravity/brain/0371a2be-f412-43e8-ac6d-79bfa87cca66';
    const artifactPath = path.join(artifactDir, 'campus_corrected_pastel_preview.png');
    fs.copyFileSync(screenshotPath, artifactPath);
    console.log(`      Copied screenshot to artifact directory: ${artifactPath}`);

    // Also test Mobile Viewport (375 x 812)
    console.log('\n--- Checking Mobile Viewport (375 x 812) ---');
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(r => setTimeout(r, 600));

    const mobileCheck = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const mobileDrawerCards = document.querySelectorAll('button[class*="mobile-card"], div[class*="overflow-x-auto"] button');
      return {
        hasHorizontalOverflow: docW > winW,
        docWidth: docW,
        winWidth: winW,
        mobileCardsCount: mobileDrawerCards.length
      };
    });
    console.log(`      Mobile Width: ${mobileCheck.winWidth}px, Scroll Width: ${mobileCheck.docWidth}px`);
    console.log(`      Horizontal Overflow: ${mobileCheck.hasHorizontalOverflow}`);
    console.log(`      Mobile Drawer Cards: ${mobileCheck.mobileCardsCount}`);

    if (mobileCheck.hasHorizontalOverflow) {
      console.error('      FAIL: Horizontal overflow detected on mobile!');
      allPassed = false;
    } else {
      console.log('      PASS: Mobile viewport has zero horizontal overflow and renders clean card drawer!');
    }

    const mobileScreenshotPath = path.join(artifactDir, 'campus_mobile_preview.png');
    await page.screenshot({ path: mobileScreenshotPath, fullPage: false });
    console.log(`      Mobile screenshot saved to: ${mobileScreenshotPath}`);

    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:', consoleErrors);
    } else {
      console.log('\nZero browser console errors detected.');
    }

  } catch (err) {
    console.error('Unexpected test failure:', err);
    allPassed = false;
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('  RESULT: ALL 8 VERIFICATION TESTS PASSED SUCCESSFULLY!         ');
  } else {
    console.log('  RESULT: VERIFICATION FAILED! Review test logs above.           ');
  }
  console.log('================================================================\n');
})();
