import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('the cookie notice informs once, is remembered, and comes back from the footer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/work/');
  const notice = page.getByRole('region', { name: 'Cookies, kept to a minimum.' });
  await expect(notice).toBeVisible();
  // Nothing optional is installed, so the notice asks for an OK rather than consent.
  await expect(notice.getByRole('button')).toHaveText(['Got it']);
  await expect(notice.getByRole('link', { name: 'Privacy & Cookies' })).toHaveAttribute('href', '/privacy/#storage');
  expect((await new AxeBuilder({ page }).include('.cookie-notice').withTags(['wcag2a', 'wcag2aa']).analyze()).violations).toEqual([]);
  await notice.getByRole('button', { name: 'Got it' }).click();
  await expect(notice).toBeHidden();
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('prodigy-stdio-consent') ?? '{}')).choice).toBe('acknowledged');
  await page.goto('/');
  await page.waitForTimeout(600);
  await expect(notice).toBeHidden();
  const settings = page.getByRole('button', { name: 'Cookie settings' });
  await settings.scrollIntoViewIfNeeded();
  await settings.click();
  await expect(notice).toBeVisible();
  await expect(notice.getByRole('button', { name: 'Got it' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(notice).toBeHidden();
  await expect(settings).toBeFocused();
});

test('the cookie notice still works when storage is blocked', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, reducedMotion: 'reduce' });
  await context.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/work/');
  const notice = page.getByRole('region', { name: 'Cookies, kept to a minimum.' });
  await expect(notice).toBeVisible();
  await notice.getByRole('button', { name: 'Got it' }).click();
  await expect(notice).toBeHidden();
  expect(errors).toEqual([]);
  await context.close();
});
