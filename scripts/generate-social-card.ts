import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless: true, ...(existsSync(localChrome) ? { executablePath: localChrome } : {}) });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: 'reduce' });
  await page.goto(process.argv[2] || 'http://127.0.0.1:4322/');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.querySelectorAll<HTMLImageElement>('.hero img')).map(image => image.decode()));
  });
  await page.screenshot({ path: 'public/social-card.jpg', type: 'jpeg', quality: 85 });
} finally { await browser.close(); }
