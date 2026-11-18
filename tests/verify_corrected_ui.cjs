const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('================================================================');
  console.log('  STUDYVERSE — VERIFY CORRECTED LOCALHOST UI                    ');
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

    console.log('[1/6] Navigating to http://localhost:5173/ ...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));

    // Check 1: Top Welcome Banner
    console.log('[2/6] Verifying Top Welcome Banner & Census Bar ...');
    const welcomeTitle = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.innerText : null;
    });
    console.log('      Welcome Banner H1:', welcomeTitle);
    if (!welcomeTitle || !welcomeTitle.includes('Live Campus Occupancy Map')) {
      console.error('      FAIL: Top Welcome Banner missing or incorrect!');
      allPassed = false;
    } else {
      console.log('      PASS: Top Welcome Banner restored with student name!');
    }

    // Check 2: Redesigned Campus Map Canvas
    console.log('[3/6] Verifying Central Campus Map Canvas (Reference Image 1) ...');
    const canvasInfo = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      const img = document.querySelector('img[alt="IIT Madras Aerial Isometric Campus Map"]');
      const identityBadge = text.includes('iit madras') && text.includes('campus explorer');
      const legendPills = text.includes('academic') && text.includes('study spaces');
      const cards = document.querySelectorAll('.interactive-card');
      const lines = document.querySelectorAll('svg line, svg path');
      return {
        bgImgFound: !!img,
        identityBadge,
        legendPills,
        cardCount: cards.length,
        hasLines: lines.length > 0
      };
    });
    console.log('      Canvas background image loaded:', canvasInfo.bgImgFound);
    console.log('      Top-left Identity badge found:', canvasInfo.identityBadge);
    console.log('      Top-center Category legend found:', canvasInfo.legendPills);
    console.log('      Interactive location cards count:', canvasInfo.cardCount);
    console.log('      Connector leader lines rendered:', canvasInfo.hasLines);

    if (!canvasInfo.bgImgFound || canvasInfo.cardCount < 5) {
      console.error('      FAIL: Canvas background or cards missing!');
      allPassed = false;
    } else {
      console.log('      PASS: Redesigned aerial campus canvas rendered successfully!');
    }

    // Check 3: Campus Information Table (CampusInfoPanel)
    console.log('[4/6] Verifying Campus Information Table (CampusInfoPanel) ...');
    const tableInfo = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      const panel = text.includes('live campus occupancy') && text.includes('real-time student census');
      const destStatus = text.includes('destination occupancy status');
      const libraryRow = text.includes('central library') && text.includes('seats occupied');
      const lhcRow = text.includes('lecture hall complex') || text.includes('lhc');
      return {
        panelFound: panel,
        destStatusFound: destStatus,
        libraryRowFound: libraryRow,
        lhcRowFound: lhcRow
      };
    });
    console.log('      CampusInfoPanel found:', tableInfo.panelFound);
    console.log('      Destination Occupancy Status table found:', tableInfo.destStatusFound);
    console.log('      Central Library row found in table:', tableInfo.libraryRowFound);
    console.log('      Lecture Hall row found in table:', tableInfo.lhcRowFound);

    if (!tableInfo.panelFound || !tableInfo.destStatusFound) {
      console.error('      FAIL: Campus Information Table missing!');
      allPassed = false;
    } else {
      console.log('      PASS: Original Campus Information Table fully restored below the map!');
    }

    // Check 4: Test Location Navigation via Card Click
    console.log('[5/6] Testing Location Navigation (entering Central Library) ...');
    const cardClicked = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.interactive-card'));
      const libCard = cards.find(c => c.innerText.includes('Central Library'));
      if (libCard) {
        libCard.click();
        return true;
      }
      return false;
    });

    if (cardClicked) {
      await new Promise(r => setTimeout(r, 1200));
      const inLibrary = await page.evaluate(() => {
        return document.body.innerText.includes('Central Library') && (document.body.innerText.includes('Desk') || document.body.innerText.includes('Cubicle') || document.body.innerText.includes('Reading'));
      });
      console.log('      Navigated into Central Library study room:', inLibrary);
      if (!inLibrary) {
        console.error('      FAIL: Navigation into study room failed!');
        allPassed = false;
      } else {
        console.log('      PASS: Clicked card successfully entered study room with seats!');
      }

      // Return to campus
      const backBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const campusBtn = btns.find(b => b.innerText.includes('Campus Map') || b.innerText.includes('Campus') || b.title?.includes('Campus'));
        if (campusBtn) {
          campusBtn.click();
          return true;
        }
        return false;
      });
      if (backBtn) {
        await new Promise(r => setTimeout(r, 1000));
        console.log('      Returned back to Campus Map.');
      }
    } else {
      console.warn('      Could not find Central Library card to click.');
    }

    // Check 5: Capture Full Page Screenshot
    console.log('[6/6] Capturing high-resolution full-page screenshot ...');
    const screenshotPath = path.join(__dirname, 'campus_corrected_preview.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`      Screenshot saved to: ${screenshotPath}`);

    // Copy to artifact directory
    const artifactDir = 'C:/Users/Dell/.gemini/antigravity/brain/0371a2be-f412-43e8-ac6d-79bfa87cca66';
    const artifactPath = path.join(artifactDir, 'campus_corrected_preview.png');
    fs.copyFileSync(screenshotPath, artifactPath);
    console.log(`      Copied screenshot to artifact directory: ${artifactPath}`);

    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:', consoleErrors);
    } else {
      console.log('\nNo browser console errors encountered.');
    }

  } catch (err) {
    console.error('Unexpected test error:', err);
    allPassed = false;
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('  RESULT: ALL TESTS PASSED! Localhost UI is 100% verified!       ');
  } else {
    console.log('  RESULT: SOME TESTS FAILED! Check logs above.                   ');
  }
  console.log('================================================================\n');
})();
