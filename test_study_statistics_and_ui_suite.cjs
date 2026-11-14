const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('================================================================');
  console.log('  STUDYVERSE — STUDY STATISTICS & FINAL UI REFINEMENTS SUITE   ');
  console.log('================================================================\n');

  let allPassed = true;

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Seed session with student seated in Central Library
    await page.evaluateOnNewDocument(() => {
      window.name = 'studyverse_win_main';
      sessionStorage.setItem('studyverse_tab_window_id', 'studyverse_win_main');
      const student = {
        sessionId: 'test_student_stats',
        name: 'Jordan Finch',
        gender: 'non-binary',
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
        sessionEnteredAt: Date.now() - 3600000, // 1 hour ago
        seatEnteredAt: Date.now() - 1800000,    // 30 mins ago
        studyTopic: 'Deep Focus',
        isDnd: false
      };
      sessionStorage.setItem('studyverse_session', JSON.stringify(student));
    });

    console.log('--- Step 1: Navigate to Studyverse and clear past statistics ---');
    await page.goto('http://localhost:5173/studyverse/', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      localStorage.removeItem('studyverse_dnd_enabled');
      localStorage.removeItem('studyverse_study_statistics');
      localStorage.removeItem('studyverse_stopwatch_state');
    });
    await new Promise(r => setTimeout(r, 600));

    // Check StudyDock layout on Desktop (1280x800)
    console.log('\n--- Step 2: Testing Currently Seated Panel (Desktop 1280x800) ---');
    const dockDesktop = await page.evaluate(() => {
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

      // Check text contents
      const text = dockCard.textContent || '';
      const hasLocation = text.includes('Central Library');
      const hasSeat = text.includes('Quiet Table') || text.includes('lib-s1') || text.includes('Seat');
      const hasSeatTime = text.includes('Seat Time') || text.includes('Seat:');
      const hasSessionTime = text.includes('Session');

      const inside = (r) => {
        if (!r) return false;
        return (
          r.left >= cardRect.left - 2 &&
          r.right <= cardRect.right + 2 &&
          r.top >= cardRect.top - 2 &&
          r.bottom <= cardRect.bottom + 2
        );
      };

      return {
        cardWidth: cardRect.width,
        leaveInside: inside(leaveRect),
        leaveSpillRight: leaveRect.right - cardRect.right,
        dndInside: dndRect ? inside(dndRect) : false,
        topicInside: topicRect ? inside(topicRect) : false,
        hasLocation,
        hasSeatTime,
        hasSessionTime
      };
    });

    console.log('Dock Desktop Check:', dockDesktop);
    if (!dockDesktop.leaveInside || dockDesktop.leaveSpillRight > 1 || !dockDesktop.dndInside || !dockDesktop.topicInside) {
      console.error('FAIL: Controls spilled out of dock card on Desktop!');
      allPassed = false;
    } else {
      console.log('PASS: All dock controls fully contained on Desktop with zero spillover.');
    }
    if (!dockDesktop.hasLocation) {
      console.error('FAIL: Location name missing from StudyDock');
      allPassed = false;
    } else {
      console.log('PASS: Location name ("Central Library") rendered properly in StudyDock.');
    }

    // Step 3: Open Statistics Panel via Navbar button
    console.log('\n--- Step 3: Open Statistics Tab via Navbar "Stats" Button ---');
    const navbarStatsClicked = await page.evaluate(() => {
      const statsBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.getAttribute('title')?.toLowerCase().includes('study statistics') ||
        b.textContent?.toLowerCase().includes('stats')
      );
      if (statsBtn) {
        statsBtn.click();
        return true;
      }
      return false;
    });

    if (!navbarStatsClicked) {
      console.error('FAIL: Navbar Stats button not found!');
      allPassed = false;
    } else {
      console.log('PASS: Navbar Stats button clicked successfully.');
    }
    await new Promise(r => setTimeout(r, 600));

    // Verify Statistics Panel opened and displays 3 metrics
    const statsCheck1 = await page.evaluate(() => {
      const statsCard = document.querySelector('.sm\\:w-88');
      if (!statsCard) return { error: 'Timer utility container not open' };

      const text = statsCard.textContent || '';
      const hasSessionHeading = text.includes('Study Session');
      const hasStopwatchHeading = text.includes('Stopwatch');
      const hasPomodoroHeading = text.includes('Pomodoro Focus');
      const hasDistribution = text.includes('Distribution');
      const hasCycles = text.includes('Pomodoro Cycles');
      const hasRuns = text.includes('Stopwatch Runs');

      return {
        open: true,
        hasSessionHeading,
        hasStopwatchHeading,
        hasPomodoroHeading,
        hasDistribution,
        hasCycles,
        hasRuns,
        textSnippet: text.slice(0, 300)
      };
    });

    console.log('Statistics Panel Initial Inspection:', statsCheck1);
    if (!statsCheck1.open || !statsCheck1.hasSessionHeading || !statsCheck1.hasStopwatchHeading || !statsCheck1.hasPomodoroHeading) {
      console.error('FAIL: Statistics Panel does not show all 3 core metrics!');
      allPassed = false;
    } else {
      console.log('PASS: Statistics Panel cleanly displays Study Session, Stopwatch Time, and Pomodoro Focus Time.');
    }

    // Step 4: Test Stopwatch Time Accumulation & Stats Sync
    console.log('\n--- Step 4: Run Stopwatch and verify accumulation in Statistics ---');
    // Switch to Stopwatch tab
    await page.evaluate(() => {
      const swTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Stopwatch'));
      if (swTab) swTab.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Click Start Stopwatch
    const swStarted = await page.evaluate(() => {
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent?.includes('Start Stopwatch') || b.textContent?.trim() === 'Start'
      );
      if (startBtn) {
        startBtn.click();
        return true;
      }
      return false;
    });
    console.log(`Stopwatch Start clicked: ${swStarted ? 'PASS' : 'FAIL'}`);

    // Let it run for 2.2 seconds
    console.log('Waiting 2.2 seconds for stopwatch to tick...');
    await new Promise(r => setTimeout(r, 2200));

    // Click Pause Stopwatch
    await page.evaluate(() => {
      const pauseBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Pause'));
      if (pauseBtn) pauseBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Switch to Stats tab to inspect accumulated time
    await page.evaluate(() => {
      const statsTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Stats'));
      if (statsTab) statsTab.click();
    });
    await new Promise(r => setTimeout(r, 500));

    const statsCheck2 = await page.evaluate(() => {
      const stored = localStorage.getItem('studyverse_study_statistics');
      const parsed = stored ? JSON.parse(stored) : null;
      const text = document.querySelector('.sm\\:w-88')?.textContent || '';
      return {
        stopwatchTotalMs: parsed?.stopwatchTotalMs || 0,
        stopwatchSessionCount: parsed?.stopwatchSessionCount || 0,
        longestStopwatchMs: parsed?.longestStopwatchMs || 0,
        panelHasStopwatchTime: text.includes('02s') || text.includes('01s') || text.includes('03s') || parsed?.stopwatchTotalMs > 1500
      };
    });

    console.log('Statistics after Stopwatch run:', statsCheck2);
    if (statsCheck2.stopwatchTotalMs < 1500 || statsCheck2.stopwatchSessionCount !== 1) {
      console.error(`FAIL: Stopwatch time did not accumulate properly! ms: ${statsCheck2.stopwatchTotalMs}, count: ${statsCheck2.stopwatchSessionCount}`);
      allPassed = false;
    } else {
      console.log(`PASS: Stopwatch accumulated ${statsCheck2.stopwatchTotalMs}ms across 1 session, recorded in stats.`);
    }

    // Step 5: Test Pomodoro Focus Tracking & Break Exclusion
    console.log('\n--- Step 5: Run Pomodoro Focus Session & Verify Break Exclusion ---');
    // Switch to Pomodoro tab
    await page.evaluate(() => {
      const pomoTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Pomodoro'));
      if (pomoTab) pomoTab.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Start Focus
    const pomoStarted = await page.evaluate(() => {
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent?.includes('Start Focus') || b.textContent?.trim() === 'Start'
      );
      if (startBtn) {
        startBtn.click();
        return true;
      }
      return false;
    });
    console.log(`Pomodoro Focus Start clicked: ${pomoStarted ? 'PASS' : 'FAIL'}`);

    // Let focus run for 2.2 seconds
    console.log('Waiting 2.2 seconds for Pomodoro focus session...');
    await new Promise(r => setTimeout(r, 2200));

    // Pause Focus
    await page.evaluate(() => {
      const pauseBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Pause'));
      if (pauseBtn) pauseBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Check stats for focus accumulation
    const statsCheck3 = await page.evaluate(() => {
      const stored = localStorage.getItem('studyverse_study_statistics');
      const parsed = stored ? JSON.parse(stored) : null;
      return {
        pomodoroFocusSeconds: parsed?.pomodoroFocusSeconds || 0
      };
    });
    console.log('Pomodoro Focus Seconds:', statsCheck3.pomodoroFocusSeconds);
    if (statsCheck3.pomodoroFocusSeconds < 2) {
      console.error(`FAIL: Pomodoro focus seconds should be at least 2, got: ${statsCheck3.pomodoroFocusSeconds}`);
      allPassed = false;
    } else {
      console.log(`PASS: Pomodoro focus accumulated ${statsCheck3.pomodoroFocusSeconds} seconds.`);
    }

    // Now switch to Short Break
    console.log('Switching Pomodoro to Short Break (5m) and running to test break exclusion...');
    await page.evaluate(() => {
      const breakBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Short Break'));
      if (breakBtn) breakBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Start break
    await page.evaluate(() => {
      const startBreakBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent?.includes('Start Break') || b.textContent?.trim() === 'Start'
      );
      if (startBreakBtn) startBreakBtn.click();
    });

    // Let break run for 2.2 seconds
    await new Promise(r => setTimeout(r, 2200));

    // Pause break
    await page.evaluate(() => {
      const pauseBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Pause'));
      if (pauseBtn) pauseBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Verify Pomodoro Focus Seconds did NOT increase during break!
    const statsCheck4 = await page.evaluate(() => {
      const stored = localStorage.getItem('studyverse_study_statistics');
      const parsed = stored ? JSON.parse(stored) : null;
      return {
        pomodoroFocusSeconds: parsed?.pomodoroFocusSeconds || 0
      };
    });
    console.log('Pomodoro Focus Seconds after Break:', statsCheck4.pomodoroFocusSeconds);
    if (statsCheck4.pomodoroFocusSeconds !== statsCheck3.pomodoroFocusSeconds) {
      console.error(`FAIL: Pomodoro focus seconds increased during break! Was: ${statsCheck3.pomodoroFocusSeconds}, now: ${statsCheck4.pomodoroFocusSeconds}`);
      allPassed = false;
    } else {
      console.log(`PASS: Break periods are STRICTLY EXCLUDED from Pomodoro focus time (remained ${statsCheck4.pomodoroFocusSeconds}s).`);
    }

    // Step 6: Test Persistence Across Page Refresh
    console.log('\n--- Step 6: Test Persistence across Page Refresh ---');
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Reopen Stats
    await page.evaluate(() => {
      const statsBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.getAttribute('title')?.toLowerCase().includes('study statistics') ||
        b.textContent?.toLowerCase().includes('stats')
      );
      if (statsBtn) statsBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    const persistedStats = await page.evaluate(() => {
      const stored = localStorage.getItem('studyverse_study_statistics');
      const parsed = stored ? JSON.parse(stored) : null;
      const text = document.querySelector('.sm\\:w-88')?.textContent || '';
      return {
        parsed,
        hasStopwatch: text.includes('Stopwatch'),
        hasPomodoro: text.includes('Pomodoro Focus'),
        textSnippet: text.slice(0, 300)
      };
    });
    console.log('Persisted Stats on Reload:', persistedStats.parsed);
    if (!persistedStats.parsed || persistedStats.parsed.stopwatchTotalMs < 1500 || persistedStats.parsed.pomodoroFocusSeconds < 2) {
      console.error('FAIL: Statistics failed to persist across page refresh!');
      allPassed = false;
    } else {
      console.log('PASS: Statistics flawlessly persisted in localStorage across page refresh.');
    }

    // Step 7: Simultaneous Chat and Timer Visibility on Desktop (Separate Spaces)
    console.log('\n--- Step 7: Testing Simultaneous Chat and Timer on Desktop ---');
    // Stats / Timer utility is currently open in bottom-left
    // Now open Chat in bottom-right
    await page.evaluate(() => {
      const chatBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label')?.includes('Chat'));
      if (chatBtn) chatBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const desktopCollisionCheck = await page.evaluate(() => {
      const timerCard = document.querySelector('.sm\\:w-88');
      const chatCard = document.querySelector('[role="dialog"][aria-label*="Chat"]');

      const isColliding = (r1, r2) => {
        if (!r1 || !r2) return false;
        if (r1.width === 0 || r2.width === 0) return false;
        return !(r1.right <= r2.left || r1.left >= r2.right || r1.bottom <= r2.top || r1.top >= r2.bottom);
      };

      const tRect = timerCard?.getBoundingClientRect() || null;
      const cRect = chatCard?.getBoundingClientRect() || null;

      return {
        timerVisible: !!timerCard && tRect.width > 0,
        chatVisible: !!chatCard && cRect.width > 0,
        timerChatCollision: isColliding(tRect, cRect),
        timerLeft: tRect ? tRect.left : 0,
        chatRight: cRect ? window.innerWidth - cRect.right : 0,
        gapBetweenTimerAndChat: cRect && tRect ? (cRect.left - tRect.right) : 0
      };
    });

    console.log('Simultaneous Desktop Spaces Check:', desktopCollisionCheck);
    if (!desktopCollisionCheck.timerVisible || !desktopCollisionCheck.chatVisible) {
      console.error('FAIL: Both Timer and Chat should be simultaneously open on Desktop!');
      allPassed = false;
    } else if (desktopCollisionCheck.timerChatCollision) {
      console.error('FAIL: UI overlap detected on Desktop between Timer and Chat!');
      allPassed = false;
    } else {
      console.log(`PASS: Timer (bottom-left) and Chat (bottom-right) coexist cleanly with ${desktopCollisionCheck.gapBetweenTimerAndChat}px gap on Desktop.`);
    }

    // Step 8: Responsive Viewport Checks
    console.log('\n--- Step 8: Responsive Viewport Checks for Dock Containment ---');
    for (const vp of [{ w: 768, h: 1024, label: 'Tablet' }, { w: 375, h: 667, label: 'Mobile' }]) {
      console.log(`Testing ${vp.label} (${vp.w}x${vp.h})...`);
      // Close chat to inspect seated dock
      await page.evaluate(() => {
        const closeChat = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label')?.includes('Close chat'));
        if (closeChat) closeChat.click();
      });
      await page.setViewport({ width: vp.w, height: vp.h });
      await new Promise(r => setTimeout(r, 600));

      const respDock = await page.evaluate(() => {
        const leaveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Leave Seat'));
        if (!leaveBtn) return { error: 'Leave Seat button not found' };
        const dockCard = leaveBtn.closest('.rounded-2xl, .rounded-3xl');
        if (!dockCard) return { error: 'Dock card not found' };

        const cardRect = dockCard.getBoundingClientRect();
        const leaveRect = leaveBtn.getBoundingClientRect();
        const dndBtn = dockCard.querySelector('button[aria-label="Toggle Do Not Disturb Mode"]');
        const dndRect = dndBtn ? dndBtn.getBoundingClientRect() : null;

        const inside = (r) => {
          if (!r) return false;
          return (
            r.left >= cardRect.left - 2 &&
            r.right <= cardRect.right + 2 &&
            r.top >= cardRect.top - 2 &&
            r.bottom <= cardRect.bottom + 2
          );
        };

        return {
          cardWidth: cardRect.width,
          leaveInside: inside(leaveRect),
          leaveSpillRight: leaveRect.right - cardRect.right,
          dndInside: dndRect ? inside(dndRect) : false
        };
      });

      console.log(`${vp.label} Dock Check:`, respDock);
      if (!respDock.leaveInside || respDock.leaveSpillRight > 1) {
        console.error(`FAIL: Dock button spilled out on ${vp.label}!`);
        allPassed = false;
      } else {
        console.log(`PASS: Dock controls 100% contained on ${vp.label} with zero spillover.`);
      }
    }

    // Step 9: Reset Statistics Test
    console.log('\n--- Step 9: Reset Statistics in UI ---');
    await page.setViewport({ width: 1280, height: 800 });
    // Open Stats tab
    await page.evaluate(() => {
      const statsBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.getAttribute('title')?.toLowerCase().includes('study statistics') ||
        b.textContent?.toLowerCase().includes('stats')
      );
      if (statsBtn) statsBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Click "Reset Statistics" button
    await page.evaluate(() => {
      const resetBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Reset Statistics'));
      if (resetBtn) resetBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Click "Reset" button inside the confirmation banner
    await page.evaluate(() => {
      const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent?.trim() === 'Reset' && b.closest('.bg-amber-50')
      );
      if (confirmBtn) confirmBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    const resetStatsCheck = await page.evaluate(() => {
      const stored = localStorage.getItem('studyverse_study_statistics');
      const parsed = stored ? JSON.parse(stored) : null;
      return {
        pomodoroFocusSeconds: parsed?.pomodoroFocusSeconds || 0,
        stopwatchTotalMs: parsed?.stopwatchTotalMs || 0,
        stopwatchSessionCount: parsed?.stopwatchSessionCount || 0
      };
    });
    console.log('Statistics after UI Reset:', resetStatsCheck);
    if (resetStatsCheck.pomodoroFocusSeconds !== 0 || resetStatsCheck.stopwatchTotalMs !== 0 || resetStatsCheck.stopwatchSessionCount !== 0) {
      console.error('FAIL: Statistics were not reset to 0!');
      allPassed = false;
    } else {
      console.log('PASS: Statistics reset cleanly to 0 in UI and localStorage.');
    }

    console.log('\n================================================================');
    if (allPassed) {
      console.log('  ALL TESTS PASSED! STUDY STATISTICS & UI REFINEMENTS VERIFIED ');
    } else {
      console.error('  TEST SUITE FINISHED WITH ERRORS ');
    }
    console.log('================================================================\n');

  } catch (err) {
    console.error('Error during test execution:', err);
    allPassed = false;
  } finally {
    await browser.close();
    process.exit(allPassed ? 0 : 1);
  }
})();
