import { test, expect, type Page } from '@playwright/test';
import { setTheme } from './helpers/theme';
import { mkdirSync } from 'node:fs';

async function at(page: Page, selector: string, progress: number): Promise<void> {
  await page.locator(selector).evaluate(async (track: HTMLElement, value) => {
    scrollTo({ top: track.getBoundingClientRect().top + scrollY + (track.offsetHeight - innerHeight) * value, behavior: 'instant' });
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }, progress);
}

test('phone cards wait until visible and enter vertically without parallax or blur', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#process');
  await expect(page.locator('#process')).toHaveAttribute('data-process-motion', 'ready');
  const row = page.locator('.process-row').first();
  const visual = row.locator('.process-visual');
  // Still below the fold: the card waits.
  await visual.evaluate(element => scrollTo({ top: element.getBoundingClientRect().top + scrollY - innerHeight * 1.04, behavior: 'instant' }));
  await expect(row.locator('.process-copy h3')).toHaveCSS('opacity', '1');
  expect(await visual.evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThan(664);
  await expect(visual).toHaveCSS('opacity', '0');
  await expect(row.locator('.notebook-pencil')).toHaveCSS('opacity', '0');
  expect(await visual.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41)).toBe(0);
  // Its top edge just on screen: it enters at once and has settled within a second, before it is read.
  await visual.evaluate(element => scrollTo({ top: element.getBoundingClientRect().top + scrollY - innerHeight * .96, behavior: 'instant' }));
  await expect.poll(() => row.locator('.notebook-pencil').evaluate(element => Number(getComputedStyle(element).opacity))).toBeGreaterThan(0);
  await expect(visual).toHaveCSS('opacity', '1', { timeout: 1000 });
  await expect(visual).toHaveCSS('filter', 'none');
  await expect(row.locator('.process-parallax')).toHaveCSS('transform', 'none');
  mkdirSync('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/mobile-process-notebook.png' });
  await page.locator('.review-card').scrollIntoViewIfNeeded();
  const tab = page.getByRole('tab', { name: 'At launch', exact: true });
  await tab.tap();
  await expect(page.locator('.review-content')).toContainText('Opens at launch');
  expect((await tab.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: 'artifacts/mobile-process-review.png' });
  expect(errors).toEqual([]);
  await context.close();
});

test('small-phone intro fits, portrait pictures follow manual themes, and landscape keeps content available', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto('/#process');
  await page.evaluate(() => document.fonts.ready);
  await at(page, '.portal-open', .99);
  await expect(page.locator('.portal-open')).toHaveAttribute('data-portal', 'done');
  const contentFits = await page.locator('.portal-world').evaluate(element => {
    const stage = element.getBoundingClientRect();
    return [...element.children].every(child => {
      const rect = child.getBoundingClientRect();
      return rect.top >= stage.top && rect.bottom <= stage.bottom && rect.left >= 0 && rect.right <= innerWidth;
    });
  });
  expect(contentFits).toBeTruthy();
  mkdirSync('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/mobile-process-small-phone.png' });
  for (const theme of ['light', 'dark']) {
    await setTheme(page, theme as 'light' | 'dark');
    await at(page, '#billboard', .95);
    await expect.poll(() => page.locator('.billboard-foreground').evaluate((image: HTMLImageElement) => image.currentSrc)).toContain(theme === 'light' ? 'daymobile' : 'nightmobile');
    await expect(page.locator('#billboard-heading')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('.billboard-photo')).not.toHaveCSS('clip-path', 'none');
    expect(await page.locator('#billboard-heading').evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
    await page.screenshot({ path: `artifacts/mobile-billboard-${theme}-320.png` });
  }
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('.portal-open')).not.toHaveAttribute('data-portal');
  await expect(page.locator('#billboard')).not.toHaveAttribute('data-billboard-portal');
  await expect(page.locator('.portal-inside .lead')).toBeVisible();
  await expect(page.locator('.process-closing')).toBeVisible();
  await expect(page.locator('.billboard-copy')).toBeVisible();
  await expect.poll(() => page.locator('.billboard-foreground').evaluate((image: HTMLImageElement) => image.currentSrc)).toContain('Neon');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#billboard')).toHaveAttribute('data-billboard-portal', '');
  await at(page, '.portal-open', .99);
  await expect(page.locator('.portal-inside .lead')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  await context.close();
});

test('portrait artwork and both closing messages remain usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('/');
  await page.locator('.billboard-stage').scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('.billboard-foreground').evaluate((image: HTMLImageElement) => image.currentSrc)).toContain('nightmobile');
  await expect(page.locator('.process-closing')).toBeVisible();
  await expect(page.locator('.billboard-copy')).toBeVisible();
  await expect(page.locator('.portal-inside .lead')).toBeVisible();
  await context.close();
});
