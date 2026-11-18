const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const envFiles = [
    'env_library.jpg',
    'env_lhc.jpg',
    'env_banyan.jpg',
    'env_oat.jpg',
    'env_cafe.jpg',
    'env_sangam.jpg',
    'env_gc.jpg'
  ];

  let itemsHtml = '';
  for (const f of envFiles) {
    const b64 = fs.readFileSync('src/assets/environments/' + f).toString('base64');
    itemsHtml += `
      <div style="border:1px solid #444; border-radius:8px; padding:10px; background:#111; text-align:center;">
        <img src="data:image/jpeg;base64,${b64}" style="width:240px; height:240px; object-fit:contain; border-radius:6px; display:block; margin:0 auto 8px;" />
        <div style="font-weight:bold; font-size:14px;">${f}</div>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="background:#1a1a1a; color:#eee; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding:24px;">
        <h2 style="margin-top:0;">Current Environment Assets (src/assets/environments/)</h2>
        <div style="display:flex; flex-wrap:wrap; gap:16px;">
          ${itemsHtml}
        </div>
      </body>
    </html>
  `;

  await page.setContent(html);
  await page.screenshot({ path: 'C:/Users/Dell/.gemini/antigravity/brain/0371a2be-f412-43e8-ac6d-79bfa87cca66/inspect_current_envs.png', fullPage: true });
  await browser.close();
  console.log('Saved inspection image to inspect_current_envs.png');
})();

