const puppeteer = require('puppeteer-core');
const { CHROME_PATH, BASE_URL, ARTIFACTS_DIR } = require('./env.cjs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('Starting Comprehensive Verification Suite for Studyverse...\n');
  let allPassed = true;

  const runViewportCheck = async (width, height, label) => {
    console.log(`\n--- Testing Viewport: ${label} (${width}x${height}) ---`);
    const page = await browser.newPage();
    await page.setViewport({ width, height });

    await page.evaluateOnNewDocument(() => {
      window.name = 'studyverse_win_main';
      sessionStorage.setItem('studyverse_tab_window_id', 'studyverse_win_main');
      localStorage.removeItem('studyverse_dnd_enabled');
      const student = {
        sessionId: 'test_student_verif',
        name: 'Alex Scholar',
        gender: 'male',
        avatarId: 'm-kav',
        avatarConfig: {
          id: 'm-kav',
          name: 'Kav',
          gender: 'male',
          hairStyle: 'short-curls',
          hairColor: '#2b1d0c',
          skinTone: '#e0ac69',
          shirtColor: '#264653',
          studyPose: 'reading',
          accessory: 'glasses',
          expression: 'focused'
        },
        location: 'library',
        seatId: 'lib-s1',
        sessionEnteredAt: Date.now() - 3600000,
        seatEnteredAt: Date.now() - 900000,
        studyTopic: 'Deep Focus',
        isDnd: false
      };
      sessionStorage.setItem('studyverse_session', JSON.stringify(student));
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    // 1. Verify StudyDock containment
    const dockResult = await page.evaluate(() => {
      const leaveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Leave Seat'));
      if (!leaveBtn) return { error: 'Leave Seat button not found' };
      const dockCard = leaveBtn.closest('.rounded-2xl, .rounded-3xl');
      if (!dockCard) return { error: 'Dock card not found' };

      const cardRect = dockCard.getBoundingClientRect();
      const leaveRect = leaveBtn.getBoundingClientRect();
      const dndBtn = dockCard.querySelector('button[aria-label="Toggle Do Not Disturb Mode"]');
      const dndRect = dndBtn ? dndBtn.getBoundingClientRect() : null;
      const topicBtn = dockCard.querySelector('button[title*="study focus tag"]');
      const topicRect = topicBtn ? topicBtn.getBoundingClientRect() : null;

      const inside = (r) => {
        if (!r) return false;
        return (
          r.left >= cardRect.left - 1 &&
          r.right <= cardRect.right + 1 &&
          r.top >= cardRect.top - 1 &&
          r.bottom <= cardRect.bottom + 1
        );
      };

      return {
        cardWidth: cardRect.width,
        leaveInside: inside(leaveRect),
        leaveSpillRight: leaveRect.right - cardRect.right,
        dndInside: dndRect ? inside(dndRect) : false,
        topicInside: topicRect ? inside(topicRect) : false,
      };
    });

    console.log(`Dock Containment:`, dockResult);
    if (!dockResult.leaveInside || dockResult.leaveSpillRight > 0 || !dockResult.dndInside || !dockResult.topicInside) {
      console.error(`FAILED: Control spilled out of card on ${label}!`);
      allPassed = false;
    } else {
      console.log(`PASSED: All controls (Leave Seat, DND, Topic) are 100% inside card on ${label} (spillRight: ${dockResult.leaveSpillRight}px)`);
    }

    // 2. Test DND toggle click in Dock
    await page.evaluate(() => {
      const leaveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Leave Seat'));
      const dockCard = leaveBtn?.closest('.rounded-2xl, .rounded-3xl');
      const dndBtn = dockCard?.querySelector('button[aria-label="Toggle Do Not Disturb Mode"]');
      if (dndBtn) dndBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));
    const dndToggled = await page.evaluate(() => {
      const leaveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Leave Seat'));
      const dockCard = leaveBtn?.closest('.rounded-2xl, .rounded-3xl');
      const dndBtn = dockCard?.querySelector('button[aria-label="Toggle Do Not Disturb Mode"]');
      return dndBtn?.textContent?.includes('DND On');
    });
    console.log(`DND Toggle click test: ${dndToggled ? 'PASSED (DND On)' : 'FAILED'}`);
    if (!dndToggled) allPassed = false;

    // 3. Test Topic picker click and dropdown
    await page.evaluate(() => {
      const leaveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Leave Seat'));
      const dockCard = leaveBtn?.closest('.rounded-2xl, .rounded-3xl');
      const topicBtn = dockCard?.querySelector('button[title*="study focus tag"]');
      if (topicBtn) topicBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));
    const topicMenuOpen = await page.evaluate(() => {
      const menu = Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('Select Study Focus'));
      return !!menu;
    });
    console.log(`Topic Dropdown open test: ${topicMenuOpen ? 'PASSED' : 'FAILED'}`);
    if (!topicMenuOpen) allPassed = false;

    // Select Coding & Systems
    await page.evaluate(() => {
      const codingBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Coding & Systems'));
      if (codingBtn) codingBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));
    const topicUpdated = await page.evaluate(() => {
      const leaveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Leave Seat'));
      const dockCard = leaveBtn?.closest('.rounded-2xl, .rounded-3xl');
      const topicBtn = dockCard?.querySelector('button[title*="study focus tag"]');
      return topicBtn?.textContent?.includes('Coding & Systems');
    });
    console.log(`Topic Update test: ${topicUpdated ? 'PASSED (Coding & Systems selected)' : 'FAILED'}`);
    if (!topicUpdated) allPassed = false;

    // 4. Overlap & Mutual Collapse test
    // Open Timer
    await page.evaluate(() => {
      const timerBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Open Study Timers');
      if (timerBtn) timerBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Open Chat
    await page.evaluate(() => {
      const chatBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label')?.includes('Chat'));
      if (chatBtn) chatBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const collisionResult = await page.evaluate(() => {
      const timerCard = document.querySelector('.sm\\:w-88');
      const chatCard = document.querySelector('[role=\"dialog\"][aria-label*=\"Chat\"]');
      const leaveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Leave Seat'));
      const dockCard = leaveBtn?.closest('.rounded-2xl, .rounded-3xl');

      const isColliding = (r1, r2) => {
        if (!r1 || !r2) return false;
        if (r1.width === 0 || r2.width === 0) return false;
        return !(r1.right <= r2.left || r1.left >= r2.right || r1.bottom <= r2.top || r1.top >= r2.bottom);
      };

      const tRect = timerCard?.getBoundingClientRect() || null;
      const cRect = chatCard?.getBoundingClientRect() || null;
      const dRect = dockCard?.getBoundingClientRect() || null;

      return {
        timerVisible: !!timerCard && tRect.width > 0,
        chatVisible: !!chatCard && cRect.width > 0,
        dockVisible: !!dockCard && dRect.width > 0,
        timerChatCollision: isColliding(tRect, cRect),
        timerDockCollision: isColliding(tRect, dRect),
        chatDockCollision: isColliding(cRect, dRect),
      };
    });

    console.log(`Collision check on ${label}:`, collisionResult);
    if (collisionResult.timerChatCollision || collisionResult.timerDockCollision || collisionResult.chatDockCollision) {
      console.error(`FAILED: Collision detected on ${label}!`);
      allPassed = false;
    } else {
      console.log(`PASSED: Zero collisions on ${label}`);
    }

    // 5. Test Leave Seat
    // Close chat if open to reveal dock on small screens
    await page.evaluate(() => {
      const closeChat = document.querySelector('[aria-label=\"Minimise Chat\"]');
      if (closeChat) closeChat.click();
    });
    await new Promise(r => setTimeout(r, 400));

    await page.evaluate(() => {
      const leaveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Leave Seat'));
      if (leaveBtn) leaveBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const dockGone = await page.evaluate(() => {
      const leaveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Leave Seat'));
      return !leaveBtn;
    });
    console.log(`Leave Seat test on ${label}: ${dockGone ? 'PASSED (User stood up, dock dismounted)' : 'FAILED'}`);
    if (!dockGone) allPassed = false;

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, `verification_${label}.png`) });
    await page.close();
  };

  await runViewportCheck(1280, 800, 'Desktop');
  await runViewportCheck(768, 1024, 'Tablet');
  await runViewportCheck(375, 667, 'Mobile');

  await browser.close();

  console.log('\n========================================');
  if (allPassed) {
    console.log('ALL VERIFICATION CHECKS PASSED PERFECTLY!');
  } else {
    console.error('SOME CHECKS FAILED! Review above logs.');
    process.exit(1);
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
