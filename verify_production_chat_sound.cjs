const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('================================================================');
  console.log('  STUDYVERSE — LIVE PRODUCTION VERIFICATION (GITHUB PAGES)     ');
  console.log('  Target: https://lucky-pluton.github.io/studyverse/            ');
  console.log('================================================================\n');

  let prodPassed = true;

  try {
    const contextA = await browser.createBrowserContext();
    const contextB = await browser.createBrowserContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.setViewport({ width: 1280, height: 800 });
    await pageB.setViewport({ width: 1280, height: 800 });

    const errorsA = [];
    const errorsB = [];
    pageA.on('pageerror', err => errorsA.push(err.message));
    pageB.on('pageerror', err => errorsB.push(err.message));

    // Seed User A
    await pageA.evaluateOnNewDocument(() => {
      window.name = 'prod_userA';
      sessionStorage.setItem('studyverse_tab_window_id', 'prod_userA');
      const studentA = {
        sessionId: 'prod_user_aarav_' + Date.now(),
        name: 'Aarav Prod',
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
          clothingColor: '#264653',
          studyPose: 'reading',
          accessory: 'glasses',
          expression: 'focused'
        },
        location: 'library',
        seatId: 'lib-s1',
        sessionEnteredAt: Date.now() - 3600000,
        seatEnteredAt: Date.now() - 1800000,
        studyTopic: 'Production Testing',
        isDnd: false
      };
      sessionStorage.setItem('studyverse_session', JSON.stringify(studentA));
    });

    // Seed User B
    await pageB.evaluateOnNewDocument(() => {
      window.name = 'prod_userB';
      sessionStorage.setItem('studyverse_tab_window_id', 'prod_userB');
      const studentB = {
        sessionId: 'prod_user_diya_' + Date.now(),
        name: 'Diya Prod',
        gender: 'female',
        avatarId: 'f-maya',
        avatarConfig: {
          id: 'f-maya',
          name: 'Maya',
          gender: 'female',
          hairStyle: 'long-straight',
          hairColor: '#1c1917',
          skinTone: '#c68642',
          shirtColor: '#2d5a43',
          clothingColor: '#2d5a43',
          studyPose: 'writing',
          accessory: 'none',
          expression: 'focused'
        },
        location: 'library',
        seatId: 'lib-s2',
        sessionEnteredAt: Date.now() - 3600000,
        seatEnteredAt: Date.now() - 1800000,
        studyTopic: 'Verification',
        isDnd: false
      };
      sessionStorage.setItem('studyverse_session', JSON.stringify(studentB));
    });

    console.log('Navigating User A and User B to Live Production URL...');
    await Promise.all([
      pageA.goto('https://lucky-pluton.github.io/studyverse/', { waitUntil: 'networkidle0' }),
      pageB.goto('https://lucky-pluton.github.io/studyverse/', { waitUntil: 'networkidle0' })
    ]);

    console.log('Console Page Errors on Load:');
    console.log('  User A errors:', errorsA.length, errorsA);
    console.log('  User B errors:', errorsB.length, errorsB);

    if (errorsA.length > 0 || errorsB.length > 0) {
      console.error('FAIL: Uncaught JavaScript errors on production page!');
      prodPassed = false;
    } else {
      console.log('PASS: Zero uncaught JavaScript errors on live production site.');
    }

    // Attach chime spy
    const installSpy = async (page, label) => {
      await page.evaluate((userLabel) => {
        window.__chimeEvents = [];
        if (window.soundService) {
          const orig = window.soundService.playChatChime.bind(window.soundService);
          window.soundService.playChatChime = async () => {
            window.__chimeEvents.push({ time: Date.now(), user: userLabel });
            return await orig();
          };
        }
      }, label);
    };

    await installSpy(pageA, 'Aarav');
    await installSpy(pageB, 'Diya');

    // Test 1: Verify UI Controls on Production Chat Header
    console.log('\n--- Production Test 1: UI Controls & Test Sound Button ---');
    await pageB.evaluate(() => {
      const btn = document.querySelector('button[aria-label*="Chat"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const headerControls = await pageB.evaluate(() => {
      const soundBtn = document.querySelector('[data-testid="toggle-chat-sound-btn"]');
      const testBtn = document.querySelector('[data-testid="test-chat-sound-btn"]');
      const dndBtn = document.querySelector('[data-testid="toggle-chat-dnd-btn"]');
      return {
        hasSoundBtn: !!soundBtn,
        hasTestBtn: !!testBtn,
        hasDndBtn: !!dndBtn,
        testTitle: testBtn?.getAttribute('title')
      };
    });
    console.log('Production Chat Header Controls:', headerControls);

    if (!headerControls.hasSoundBtn || !headerControls.hasTestBtn || !headerControls.hasDndBtn) {
      console.error('FAIL: Missing chat controls on live production!');
      prodPassed = false;
    } else {
      console.log('PASS: Sound Toggle, Test Sound, and DND buttons present on production.');
    }

    // Test clicking Test Sound Button
    await pageB.evaluate(() => { window.__chimeEvents = []; });
    await pageB.evaluate(() => {
      const testBtn = document.querySelector('[data-testid="test-chat-sound-btn"]');
      if (testBtn) testBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const testChimeCount = await pageB.evaluate(() => window.__chimeEvents.length);
    console.log('Test Sound Button Chime Count:', testChimeCount);
    if (testChimeCount !== 1) {
      console.error('FAIL: Test Sound button did not play chime on production!');
      prodPassed = false;
    } else {
      console.log('PASS: Test Sound button successfully synthesizes and plays chime on production.');
    }

    // Test 2: Two-User Live Realtime Exchange & Audio Notification
    console.log('\n--- Production Test 2: Live Real-Time Message Audio Notification ---');
    // Open chat on User A
    await pageA.evaluate(() => {
      const btn = document.querySelector('button[aria-label*="Chat"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    await pageA.evaluate(() => { window.__chimeEvents = []; });
    await pageB.evaluate(() => { window.__chimeEvents = []; });

    console.log('User A sending live message: "Hello from production test!"');
    await pageA.evaluate(() => {
      window.chatService.sendMessage('Hello from production test!');
    });

    // Wait for delivery over production transport (MQTT relay / Supabase)
    await new Promise(r => setTimeout(r, 1500));

    const liveDeliveryCheck = await pageB.evaluate(() => {
      const msgs = window.chatService.getMessages();
      const last = msgs[msgs.length - 1];
      return {
        receivedText: last ? last.text : null,
        sender: last ? last.senderName : null,
        chimeCount: window.__chimeEvents.length
      };
    });
    const senderChimes = await pageA.evaluate(() => window.__chimeEvents.length);

    console.log('User B received on production:', liveDeliveryCheck);
    console.log('User A (sender) chimes on production:', senderChimes);

    if (liveDeliveryCheck.receivedText !== 'Hello from production test!') {
      console.error('FAIL: User B did not receive live message on production!');
      prodPassed = false;
    } else if (liveDeliveryCheck.chimeCount !== 1) {
      console.error(`FAIL: User B expected 1 chime on production, got ${liveDeliveryCheck.chimeCount}`);
      prodPassed = false;
    } else if (senderChimes !== 0) {
      console.error(`FAIL: User A (sender) heard ${senderChimes} chimes on production (expected 0)`);
      prodPassed = false;
    } else {
      console.log('PASS: Live production message received with audible chime for recipient, 0 for sender.');
    }

    // Test 3: DND on Production
    console.log('\n--- Production Test 3: Do Not Disturb Mode Notification Silence ---');
    await pageB.evaluate(() => {
      const dndBtn = document.querySelector('[data-testid="toggle-chat-dnd-btn"]');
      if (dndBtn) dndBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    await pageB.evaluate(() => { window.__chimeEvents = []; });
    console.log('User A sending message while User B is on DND: "Are you free?"');
    await pageA.evaluate(() => {
      window.chatService.sendMessage('Are you free?');
    });
    await new Promise(r => setTimeout(r, 1500));

    const dndProdCheck = await pageB.evaluate(() => {
      return {
        isDnd: window.chatService.isDnd(),
        chimeCount: window.__chimeEvents.length
      };
    });
    console.log('User B on DND on production:', dndProdCheck);

    if (dndProdCheck.chimeCount !== 0) {
      console.error(`FAIL: User B on DND received ${dndProdCheck.chimeCount} chimes on production (expected 0)!`);
      prodPassed = false;
    } else {
      console.log('PASS: DND mode completely silenced notifications on live production.');
    }

    console.log('\n================================================================');
    if (prodPassed) {
      console.log('  ALL LIVE PRODUCTION VERIFICATIONS PASSED SUCCESSFULLY!       ');
    } else {
      console.error('  PRODUCTION VERIFICATION FAILED                               ');
    }
    console.log('================================================================\n');

  } catch (err) {
    console.error('Production test execution failed:', err);
    prodPassed = false;
  } finally {
    await browser.close();
    process.exit(prodPassed ? 0 : 1);
  }
})();
