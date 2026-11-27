// Shared chat moderation: three students in the Central Library. One sends a message; once two
// others report it, it disappears for everyone, the author included. Uses the same-device tab channel,
// so it needs no network beyond the app itself.
const puppeteer = require('puppeteer-core');
const { CHROME_PATH, BASE_URL, CHROME_ARGS } = require('./env.cjs');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (ok, label) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (!ok) failures++; };

async function enterLibrary(page) {
  await page.goto(`${BASE_URL}/?demo=true`, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('button[data-location-id="library"]', { timeout: 30000 });
  await page.click('button[data-location-id="library"]');
  await page.waitForSelector('[data-testid="chat-trigger-btn"]', { timeout: 30000 });
  await page.click('[data-testid="chat-trigger-btn"]');
  await page.waitForSelector('button[aria-label="Send message"]', { timeout: 15000 });
}
const hasText = (page, text) => page.evaluate((t) => document.body.innerText.includes(t), text);

async function report(page, text) {
  // open the options menu on the message with this text, then choose Report
  const opened = await page.evaluate((t) => {
    const rows = [...document.querySelectorAll('div.group')].filter((d) => d.innerText.includes(t));
    const btn = rows.length && rows[rows.length - 1].querySelector('button[title="Message options"]');
    if (!btn) return false;
    btn.click();
    return true;
  }, text);
  if (!opened) return false;
  await wait(300);
  return page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Report');
    if (!b) return false;
    b.click();
    return true;
  });
}

(async () => {
  // background tabs must keep running at full speed: three students share one browser
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH, headless: 'new', protocolTimeout: 120000,
    args: [...CHROME_ARGS, '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
  });
  try {
    const [author, r1, r2] = await Promise.all([browser.newPage(), browser.newPage(), browser.newPage()]);
    for (const p of [author, r1, r2]) {
      await p.setViewport({ width: 1400, height: 900 });
      p.on('dialog', async (d) => { console.log('dialog:', d.message()); await d.dismiss(); });
    }
    for (const [p, who] of [[author, 'author'], [r1, 'first reporter'], [r2, 'second reporter']]) {
      await p.bringToFront();
      await enterLibrary(p);
      console.log(`in the library: ${who}`);
    }
    await wait(1500);

    const text = `shared report check ${Date.now()}`;
    await author.bringToFront();
    const box = 'input[placeholder^="Message "]';
    await author.waitForSelector(box, { visible: true, timeout: 15000 });
    await author.click(box);
    await author.keyboard.type(text);
    await author.keyboard.press('Enter');
    await wait(2000);
    check(await hasText(r1, text), 'the message reaches the first other student');
    check(await hasText(r2, text), 'the message reaches the second other student');

    await r1.bringToFront();
    check(await report(r1, text), 'the first student can report it');
    await wait(1500);
    check(!(await hasText(r1, text)), 'it is hidden for the student who reported it');
    check(await hasText(author, text), 'one report alone does not hide it for the author');
    check(await hasText(r2, text), 'one report alone does not hide it for others');

    await r2.bringToFront();
    check(await report(r2, text), 'the second student can report it');
    await wait(2000);
    check(!(await hasText(author, text)), 'after two reports it is hidden for the author too');
    check(!(await hasText(r2, text)), 'and for the second reporter');
    check(!(await hasText(author, 'report_')), 'no report signal is ever shown as a message');
  } finally {
    await browser.close();
  }
  console.log(failures ? `\n${failures} check(s) failed` : '\nAll shared-report checks passed');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
