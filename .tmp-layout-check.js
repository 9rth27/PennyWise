const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  const page = await browser.newPage({ viewport: { width: 500, height: 900 } });
  await page.goto('http://localhost:3000/settings', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  const data = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('div')).filter((el) => {
      const cls = String(el.className || '');
      return cls.includes('justify-between') && cls.includes('border-2 border-black rounded-lg p-4 bg-gray-50');
    }).map((el) => ({
      className: String(el.className || ''),
      flexDirection: getComputedStyle(el).flexDirection,
      text: (el.textContent || '').slice(0, 120),
    }));

    const saveRow = Array.from(document.querySelectorAll('div')).filter((el) => {
      const cls = String(el.className || '');
      const text = el.textContent || '';
      return cls.includes('gap-4') && text.includes('Save Settings') && text.includes('Reset to Default');
    }).map((el) => ({ className: String(el.className || ''), flexDirection: getComputedStyle(el).flexDirection, text: (el.textContent||'').slice(0,120) }));

    return { candidates, saveRow };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
