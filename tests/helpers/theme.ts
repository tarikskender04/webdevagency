import { expect, type Page } from '@playwright/test';

/** The header switch only flips between light and dark, so set a theme by clicking it when needed (without scrolling the page to it). */
export async function setTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  const current = await page.locator('html').getAttribute('data-theme');
  if (current !== theme) await page.getByRole('switch', { name: 'Dark mode' }).evaluate(control => (control as HTMLElement).click());
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  // Let the day/night fade land, so its outgoing photo copies are gone.
  await expect(page.locator('html')).not.toHaveAttribute('data-theme-fading');
}
