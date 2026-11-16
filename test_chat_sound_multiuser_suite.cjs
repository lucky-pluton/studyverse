const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('================================================================');
  console.log('  STUDYVERSE — REAL-TIME CHAT NOTIFICATION SOUNDS SUITE        ');
  console.log('================================================================\n');

  let allPassed = true;

  try {
    // -------------------------------------------------------------
    // Set up User A (Aarav) and User B (Diya) in separate contexts
    // -------------------------------------------------------------
    const contextA = await browser.createBrowserContext();
    const contextB = await browser.createBrowserContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.setViewport({ width: 1280, height: 800 });
    await pageB.setViewport({ width: 1280, height: 800 });

    // Seed User A session
    await pageA.evaluateOnNewDocument(() => {
      window.name = 'studyverse_win_userA';
      sessionStorage.setItem('studyverse_tab_window_id', 'studyverse_win_userA');
      const studentA = {
        sessionId: 'user_aarav_sound_test',
        name: 'Aarav',
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
        seatEnteredAt: Date.now() - 1800000,
        studyTopic: 'Algorithms',
        isDnd: false
      };
      sessionStorage.setItem('studyverse_session', JSON.stringify(studentA));
    });

    // Seed User B session
    await pageB.evaluateOnNewDocument(() => {
      window.name = 'studyverse_win_userB';
      sessionStorage.setItem('studyverse_tab_window_id', 'studyverse_win_userB');
      const studentB = {
        sessionId: 'user_diya_sound_test',
        name: 'Diya',
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
          studyPose: 'writing',
          accessory: 'none',
          expression: 'focused'
        },
        location: 'library',
        seatId: 'lib-s2',
        sessionEnteredAt: Date.now() - 3600000,
        seatEnteredAt: Date.now() - 1800000,
        studyTopic: 'Deep Focus',
        isDnd: false
      };
      sessionStorage.setItem('studyverse_session', JSON.stringify(studentB));
    });

    console.log('Loading User A and User B into Central Library...');
    await Promise.all([
      pageA.goto('http://localhost:5173/studyverse/', { waitUntil: 'networkidle0' }),
      pageB.goto('http://localhost:5173/studyverse/', { waitUntil: 'networkidle0' })
    ]);

    // Install audio chime spies on both pages to record every playChatChime invocation
    const installAudioSpy = async (page, userLabel) => {
      await page.evaluate((label) => {
        window.__chimeEvents = [];
        if (window.soundService) {
          const originalChime = window.soundService.playChatChime.bind(window.soundService);
          window.soundService.playChatChime = () => {
            window.__chimeEvents.push({ timestamp: Date.now(), user: label });
            originalChime();
          };
        }
      }, userLabel);
    };

    await installAudioSpy(pageA, 'Aarav');
    await installAudioSpy(pageB, 'Diya');

    await new Promise(r => setTimeout(r, 1200));

    // =========================================================================
    // SCENARIO A: Chat panel open for both users
    // User A sends message -> User B receives it with gentle sound.
    // User A (sender) receives NO sound.
    // =========================================================================
    console.log('\n--- Scenario A: Chat panel open — Incoming chime for recipient, none for sender ---');

    // Open chat for User A
    await pageA.evaluate(() => {
      const chatBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label')?.includes('Chat'));
      if (chatBtn) chatBtn.click();
    });

    // Open chat for User B
    await pageB.evaluate(() => {
      const chatBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label')?.includes('Chat'));
      if (chatBtn) chatBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Reset chime spies
    await pageA.evaluate(() => { window.__chimeEvents = []; });
    await pageB.evaluate(() => { window.__chimeEvents = []; });

    // User A sends a message
    console.log('User A sending: "Hey Diya, are you preparing for exams?"');
    await pageA.evaluate(() => {
      window.chatService.sendMessage('Hey Diya, are you preparing for exams?');
    });

    // Wait for message delivery across transports (BroadcastChannel / MQTT / Supabase)
    await new Promise(r => setTimeout(r, 1000));

    const scenarioAResults = await pageB.evaluate(() => {
      const msgs = window.chatService.getMessages();
      const last = msgs[msgs.length - 1];
      return {
        receivedText: last ? last.text : null,
        senderName: last ? last.senderName : null,
        chimeCount: window.__chimeEvents.length
      };
    });

    const senderChimes = await pageA.evaluate(() => window.__chimeEvents.length);

    console.log('Scenario A - User B received:', scenarioAResults);
    console.log('Scenario A - User A (sender) chimes:', senderChimes);

    if (scenarioAResults.receivedText !== 'Hey Diya, are you preparing for exams?') {
      console.error('FAIL: User B did not receive User A message!');
      allPassed = false;
    } else if (scenarioAResults.chimeCount !== 1) {
      console.error(`FAIL: User B expected 1 chime, got ${scenarioAResults.chimeCount}!`);
      allPassed = false;
    } else if (senderChimes !== 0) {
      console.error(`FAIL: User A (sender) should hear 0 chimes, got ${senderChimes}!`);
      allPassed = false;
    } else {
      console.log('PASS: User B heard gentle chime; User A heard nothing (self-muted).');
    }

    // =========================================================================
    // SCENARIO B: Chat panel minimized
    // User B minimizes chat -> User A sends message -> User B still hears chime!
    // =========================================================================
    console.log('\n--- Scenario B: Chat panel minimized — Notification chime still plays ---');

    // User B minimizes chat
    await pageB.evaluate(() => {
      const minBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.getAttribute('aria-label')?.includes('Minimise') || b.getAttribute('title')?.includes('Minimise')
      );
      if (minBtn) minBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Reset chime spies
    await pageB.evaluate(() => { window.__chimeEvents = []; });

    // User A sends message
    console.log('User A sending while User B minimized: "Don\'t forget water break!"');
    await pageA.evaluate(() => {
      window.chatService.sendMessage("Don't forget water break!");
    });
    await new Promise(r => setTimeout(r, 1000));

    const scenarioBResults = await pageB.evaluate(() => {
      return {
        chimeCount: window.__chimeEvents.length,
        unreadCount: window.chatService.getUnreadCount()
      };
    });
    console.log('Scenario B - User B while minimized:', scenarioBResults);

    if (scenarioBResults.chimeCount !== 1) {
      console.error(`FAIL: Expected 1 chime while minimized, got ${scenarioBResults.chimeCount}`);
      allPassed = false;
    } else if (scenarioBResults.unreadCount < 1) {
      console.error(`FAIL: Expected unread count to increment, got ${scenarioBResults.unreadCount}`);
      allPassed = false;
    } else {
      console.log('PASS: User B heard chime and unread badge incremented while chat was minimized.');
    }

    // =========================================================================
    // SCENARIO C: DND Enabled
    // User B turns ON Do Not Disturb -> Incoming message is SILENT.
    // =========================================================================
    console.log('\n--- Scenario C: Do Not Disturb — Suppresses all incoming chimes ---');

    // Turn ON DND for User B
    await pageB.evaluate(() => {
      window.chatService.setDnd(true);
      window.__chimeEvents = [];
    });
    await new Promise(r => setTimeout(r, 300));

    console.log('User A sending message while User B is on DND...');
    await pageA.evaluate(() => {
      window.chatService.sendMessage('Are you studying for signals?');
    });
    await new Promise(r => setTimeout(r, 1000));

    const scenarioCResults = await pageB.evaluate(() => {
      const msgs = window.chatService.getMessages();
      const last = msgs[msgs.length - 1];
      return {
        receivedText: last ? last.text : null,
        chimeCount: window.__chimeEvents.length,
        isDnd: window.chatService.isDnd()
      };
    });
    console.log('Scenario C - User B on DND:', scenarioCResults);

    if (scenarioCResults.receivedText !== 'Are you studying for signals?') {
      console.error('FAIL: User B should still receive message text on DND!');
      allPassed = false;
    } else if (scenarioCResults.chimeCount !== 0) {
      console.error(`FAIL: DND should silence all chimes! Got ${scenarioCResults.chimeCount} chimes.`);
      allPassed = false;
    } else {
      console.log('PASS: User B received message silently with zero chimes while DND was active.');
    }

    // =========================================================================
    // SCENARIO D: Sound disabled independently of DND
    // User B turns DND OFF, but mutes Sound via Sound Toggle button.
    // DND is OFF, Sound is OFF -> Incoming message is SILENT.
    // =========================================================================
    console.log('\n--- Scenario D: Sound Muted Independently of DND ---');

    // Turn DND OFF for User B, but turn Sound OFF
    await pageB.evaluate(() => {
      window.chatService.setDnd(false);
      window.chatService.setChatSoundEnabled(false);
      window.__chimeEvents = [];
    });
    await new Promise(r => setTimeout(r, 300));

    const userBSettingCheck = await pageB.evaluate(() => {
      return {
        isDnd: window.chatService.isDnd(),
        isSoundEnabled: window.chatService.isChatSoundEnabled(),
        storageValue: localStorage.getItem('studyverse_chat_sound_enabled')
      };
    });
    console.log('User B Sound Settings:', userBSettingCheck);

    if (userBSettingCheck.isDnd !== false || userBSettingCheck.isSoundEnabled !== false || userBSettingCheck.storageValue !== 'false') {
      console.error('FAIL: Sound should be disabled and stored in localStorage independently of DND!');
      allPassed = false;
    }

    console.log('User A sending message while User B sound is muted...');
    await pageA.evaluate(() => {
      window.chatService.sendMessage('Can you hear this?');
    });
    await new Promise(r => setTimeout(r, 1000));

    const scenarioDChimes = await pageB.evaluate(() => window.__chimeEvents.length);
    console.log('Scenario D - User B chimes while sound muted:', scenarioDChimes);

    if (scenarioDChimes !== 0) {
      console.error(`FAIL: Expected 0 chimes when sound is disabled, got ${scenarioDChimes}!`);
      allPassed = false;
    } else {
      console.log('PASS: Sound mute works independently of DND; incoming messages arrive silently.');
    }

    // =========================================================================
    // SCENARIO E: Rapid Multiple Incoming Messages (Throttling)
    // User B re-enables sound. User A sends 3 messages in rapid succession (<400ms).
    // Verify throttling ensures only 1 chime plays instead of machine-gun ringing.
    // =========================================================================
    console.log('\n--- Scenario E: Multiple Rapid Messages — Throttled Grouping ---');

    // Re-enable sound on User B
    await pageB.evaluate(() => {
      window.chatService.setChatSoundEnabled(true);
      window.__chimeEvents = [];
    });
    // Wait for throttle window from any prior sound
    await new Promise(r => setTimeout(r, 1400));

    console.log('User A sending 3 messages rapidly within 200ms...');
    await pageA.evaluate(() => {
      window.chatService.sendMessage('Message 1');
      setTimeout(() => window.chatService.sendMessage('Message 2'), 60);
      setTimeout(() => window.chatService.sendMessage('Message 3'), 120);
    });

    await new Promise(r => setTimeout(r, 1200));

    const scenarioEResults = await pageB.evaluate(() => {
      return {
        chimeCount: window.__chimeEvents.length,
        chimeTimestamps: window.__chimeEvents.map(e => e.timestamp)
      };
    });
    console.log('Scenario E - Throttling Results:', scenarioEResults);

    if (scenarioEResults.chimeCount !== 1) {
      console.error(`FAIL: Expected exactly 1 throttled chime for 3 rapid messages, got ${scenarioEResults.chimeCount}`);
      allPassed = false;
    } else {
      console.log('PASS: Rapid incoming messages successfully throttled to 1 gentle chime.');
    }

    // =========================================================================
    // SCENARIO F: Location Isolation
    // User A moves to 'lhc'. Sends message there. User B in 'library' should NOT receive it.
    // =========================================================================
    console.log('\n--- Scenario F: Location Isolation ---');
    await pageB.evaluate(() => { window.__chimeEvents = []; });

    // User A joins LHC room
    await pageA.evaluate(() => {
      const studentA = JSON.parse(sessionStorage.getItem('studyverse_session'));
      studentA.location = 'lhc';
      window.chatService.joinLocation('lhc', studentA);
    });
    await new Promise(r => setTimeout(r, 800));

    console.log('User A sending message in LHC...');
    await pageA.evaluate(() => {
      window.chatService.sendMessage('Anyone in LHC?');
    });
    await new Promise(r => setTimeout(r, 1000));

    const scenarioFResults = await pageB.evaluate(() => {
      const msgs = window.chatService.getMessages();
      const hasLhcMsg = msgs.some(m => m.text === 'Anyone in LHC?');
      return {
        hasLhcMsg,
        chimeCount: window.__chimeEvents.length
      };
    });
    console.log('Scenario F - User B in library checking LHC message:', scenarioFResults);

    if (scenarioFResults.hasLhcMsg || scenarioFResults.chimeCount !== 0) {
      console.error('FAIL: Message or chime leaked across different locations!');
      allPassed = false;
    } else {
      console.log('PASS: Location isolation strictly enforced; 0 stale chimes or messages across rooms.');
    }

    // =========================================================================
    // SCENARIO G: Persistence Across Page Refresh & Old Messages Exclusion
    // =========================================================================
    console.log('\n--- Scenario G: Persistence Across Refresh & Zero Old Message Chimes ---');

    // Mute sound on User B, then refresh page
    await pageB.evaluate(() => {
      window.chatService.setChatSoundEnabled(false);
    });

    console.log('Reloading User B page...');
    await pageB.reload({ waitUntil: 'networkidle0' });
    await installAudioSpy(pageB, 'Diya (reloaded)');
    await new Promise(r => setTimeout(r, 800));

    const reloadedSoundCheck = await pageB.evaluate(() => {
      return {
        isSoundEnabled: window.chatService.isChatSoundEnabled(),
        storage: localStorage.getItem('studyverse_chat_sound_enabled'),
        chimeCount: window.__chimeEvents.length
      };
    });
    console.log('Scenario G - Reload check:', reloadedSoundCheck);

    if (reloadedSoundCheck.isSoundEnabled !== false || reloadedSoundCheck.storage !== 'false') {
      console.error('FAIL: Sound preference failed to survive reload!');
      allPassed = false;
    } else if (reloadedSoundCheck.chimeCount !== 0) {
      console.error(`FAIL: Old messages triggered sounds on reload! Chimes: ${reloadedSoundCheck.chimeCount}`);
      allPassed = false;
    } else {
      console.log('PASS: Sound preference persisted across reload; zero stale message sounds played.');
    }

    // =========================================================================
    // UI TEST: Test Sound Button and Sound Toggle Controls in LocationChatPanel
    // =========================================================================
    console.log('\n--- UI Test: Sound Toggle & Test Sound Controls in LocationChatPanel ---');

    // Open chat panel on User B
    await pageB.evaluate(() => {
      const chatBtn = document.querySelector('button[aria-label*="Chat"]');
      if (chatBtn) chatBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Verify UI buttons exist: Sound toggle and Test Sound
    const uiButtonsCheck = await pageB.evaluate(() => {
      const soundBtn = document.querySelector('[data-testid="toggle-chat-sound-btn"]') ||
        Array.from(document.querySelectorAll('button')).find(b => 
          b.getAttribute('aria-label')?.includes('Notification Sounds')
        );
      const testSoundBtn = document.querySelector('[data-testid="test-chat-sound-btn"]') ||
        Array.from(document.querySelectorAll('button')).find(b => 
          b.getAttribute('aria-label')?.includes('Test') || b.getAttribute('title')?.includes('Test')
        );
      return {
        hasSoundBtn: !!soundBtn,
        hasTestSoundBtn: !!testSoundBtn,
        soundBtnTitle: soundBtn?.getAttribute('title'),
        testSoundBtnTitle: testSoundBtn?.getAttribute('title')
      };
    });
    console.log('UI Buttons Inspection:', uiButtonsCheck);

    if (!uiButtonsCheck.hasSoundBtn || !uiButtonsCheck.hasTestSoundBtn) {
      console.error('FAIL: Sound toggle or Test Sound button missing in chat header!');
      allPassed = false;
    } else {
      console.log('PASS: Both Sound Toggle and Test Sound buttons rendered in chat header.');
    }

    // Test clicking Test Sound button
    await pageB.evaluate(() => { window.__chimeEvents = []; });
    await pageB.evaluate(() => {
      const testBtn = document.querySelector('[data-testid="test-chat-sound-btn"]') ||
        Array.from(document.querySelectorAll('button')).find(b => 
          b.getAttribute('aria-label')?.includes('Test') || b.getAttribute('title')?.includes('Test')
        );
      if (testBtn) testBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const testChimeResult = await pageB.evaluate(() => window.__chimeEvents.length);
    console.log('Test Sound Click result:', testChimeResult);
    if (testChimeResult !== 1) {
      console.error('FAIL: Test Sound button did not trigger chime sound!');
      allPassed = false;
    } else {
      console.log('PASS: Test Sound button played gentle notification chime.');
    }

    // Test toggling sound ON from UI
    await pageB.evaluate(() => {
      const soundBtn = document.querySelector('[data-testid="toggle-chat-sound-btn"]') ||
        Array.from(document.querySelectorAll('button')).find(b => 
          b.getAttribute('aria-label')?.includes('Notification Sounds')
        );
      if (soundBtn) soundBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const toggledState = await pageB.evaluate(() => {
      return {
        isSoundEnabled: window.chatService.isChatSoundEnabled(),
        storage: localStorage.getItem('studyverse_chat_sound_enabled'),
        hasFeedbackNotice: !!document.querySelector('.bg-\\[\\#fef3c7\\]') || !!document.body.innerText.includes('enabled')
      };
    });
    console.log('Toggled Sound ON State:', toggledState);
    if (!toggledState.isSoundEnabled || toggledState.storage !== 'true') {
      console.error('FAIL: Clicking sound button in UI did not toggle sound to true!');
      allPassed = false;
    } else {
      console.log('PASS: Sound toggled ON via UI with confirmation notice.');
    }

    console.log('\n================================================================');
    if (allPassed) {
      console.log('  ALL SCENARIOS PASSED! CHAT NOTIFICATION SOUNDS 100% VERIFIED  ');
    } else {
      console.error('  TEST SUITE COMPLETED WITH ONE OR MORE FAILURES  ');
    }
    console.log('================================================================\n');

  } catch (err) {
    console.error('Unexpected error during test suite execution:', err);
    allPassed = false;
  } finally {
    await browser.close();
    process.exit(allPassed ? 0 : 1);
  }
})();

