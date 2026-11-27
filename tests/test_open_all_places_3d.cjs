// Every study spot can be entered from the 3D campus: open the app in 3D, pick each spot in the 3D page's
// bottom bar, press Enter on its info card, check the study room opens with its seats, then go back.
const puppeteer = require('puppeteer-core');
const { CHROME_PATH, BASE_URL, CHROME_ARGS } = require('./env.cjs');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const SPOTS = [
  { id: 'library', name: 'Central Library' },
  { id: 'lhc', name: 'Lecture Hall Complex' },
  { id: 'banyan', name: 'Banyan Tree' },
  { id: 'oat', name: 'Open Air Theatre' },
  { id: 'cafe', name: 'Campus Café' },
  { id: 'park', name: 'Sangam' },
  { id: 'gc', name: 'Gajendra Circle' },
];
let failures = 0;
const check = (ok, label) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (!ok) failures++; };

async function campusFrame(page) {
  for (let i = 0; i < 120; i++) {
    const f = page.frames().find((fr) => fr.url().includes('campus3d.html'));
    if (f) {
      const ready = await f.evaluate(() => !!(window.campusTimings && window.campusTimings['first frames'] !== undefined)).catch(() => false);
      if (ready) return f;
    }
    await wait(500);
  }
  return null;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new', args: CHROME_ARGS, protocolTimeout: 120000 });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/?demo=true`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('[data-testid="view-mode-3d"]', { timeout: 30000 });
    await page.click('[data-testid="view-mode-3d"]');

    for (const spot of SPOTS) {
      const frame = await campusFrame(page);
      check(!!frame, `3D campus loaded (before ${spot.name})`);
      if (!frame) break;
      const picked = await frame.evaluate((n) => {
        const b = [...document.querySelectorAll('#spots button')].find((x) => x.textContent.includes(n));
        if (!b) return false;
        b.click();
        return true;
      }, spot.name);
      check(picked, `${spot.name}: listed in the 3D bottom bar`);
      if (!picked) continue;
      await frame.waitForSelector('#info [data-act="enter"]', { visible: true, timeout: 15000 }).catch(() => null);
      const entered = await frame.evaluate(() => {
        const b = document.querySelector('#info [data-act="enter"]');
        if (!b) return false;
        b.click();
        return true;
      });
      check(entered, `${spot.name}: info card offers Enter`);
      if (!entered) continue;
      const seats = await page.waitForFunction(() => document.querySelectorAll('[data-seat-id]').length, { timeout: 30000 }).then((h) => h.jsonValue()).catch(() => 0);
      check(seats > 0, `${spot.name}: the study room opens with its seats (${seats})`);
      await page.click('button[title="Return to Campus Map Overview"]').catch(() => {});
      await wait(1500);
    }
  } finally {
    await browser.close();
  }
  console.log(failures ? `\n${failures} check(s) failed` : '\nEvery study spot opens from the 3D campus');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
