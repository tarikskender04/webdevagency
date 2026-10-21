import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';
import { setTheme } from './helpers/theme';

test('phones get a Menu that reaches Studio, Process, Our work and Contact, and closes on Esc or a same-page link', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Menu' });
  const menu = page.locator('#site-menu');
  await expect(button).toBeVisible();
  await expect(page.locator('.site-header > .nav-contact')).toBeHidden();
  await expect(menu).toBeHidden();

  await button.click();
  await expect(menu).toBeVisible();
  const nav = menu.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.getByRole('link')).toHaveText(['Studio', 'Process', 'Our work →', 'Contact ↗']);
  const accessibility = await new AxeBuilder({ page }).include('#site-menu').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations.map(violation => violation.id)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(button).toBeFocused();

  await button.click();
  await nav.getByRole('link', { name: 'Process' }).click();
  await expect(menu).toBeHidden();
  await expect(page).toHaveURL(/#process$/);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await button.click();
  await nav.getByRole('link', { name: 'Our work' }).click();
  await expect(page).toHaveURL(/\/work\/$/);
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.locator('#site-menu .nav-work')).toHaveAttribute('aria-current', 'page');
});

test('the menu fits phones by day and night and never shows on wider screens', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  mkdirSync('artifacts', { recursive: true });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 800 });
    for (const theme of ['light', 'dark'] as const) {
      await setTheme(page, theme);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.getByRole('button', { name: 'Menu' }).click();
      const box = (await page.locator('#site-menu').boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      await page.screenshot({ path: `artifacts/menu-${theme}-${width}.png` });
      await page.keyboard.press('Escape');
    }
  }
  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden();
  await expect(page.locator('.site-header > nav')).toBeVisible();
});
