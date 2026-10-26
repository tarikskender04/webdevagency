import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { existsSync, readFileSync } from 'node:fs';

const updates = JSON.parse(readFileSync('public/lupo/updates.json', 'utf8'));
const hasDmg = existsSync('public/lupo/Lupo.dmg');

async function noOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
}

test('the Lupo page shows the approved sections, the version from updates.json and the right download state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/lupo/');
  await expect(page).toHaveTitle('Lupo: Show AI What You Mean | Prodigy Stdio');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Show AI what you mean.');
  await expect(page.getByRole('img', { name: 'Lupo' })).toBeVisible();
  await expect(page.locator('main').getByRole('heading', { level: 2 })).toHaveText([
    'Stop explaining screenshots.', 'It all stays on your Mac.', 'Opening Lupo the first time', 'What Lupo asks for, and why', 'What’s new', 'Try it on your next bug.',
  ]);
  await expect(page.locator('.lupo-hero .lupo-requirements')).toHaveText(`Free · macOS 26 Tahoe · Apple Silicon · Version ${updates.version}`);
  // Until the release script writes Lupo.dmg, there is nothing to download: the button says Coming soon and isn't a link.
  const downloads = page.getByRole('link', { name: 'Download for Mac' });
  if (hasDmg) await expect(downloads).toHaveCount(2);
  else { await expect(downloads).toHaveCount(0); await expect(page.locator('.lupo-button-soon')).toHaveText(['Coming soon', 'Coming soon']); }
  await expect(page.locator('kbd')).toHaveText(['⌥⇧Space', '⌥⇧S']);

  const releases = page.locator('.lupo-release');
  await expect(releases).toHaveCount(updates.releases.length);
  await expect(releases.first()).toHaveAttribute('open', '');
  await expect(releases.first().locator('summary')).toContainText(`Version ${updates.releases[0].version}`);
  await expect(releases.first().locator('li')).toHaveText(updates.releases[0].notes);

  await page.getByRole('link', { name: /First time\? Here’s how to open it/ }).click();
  await expect(page).toHaveURL(/#first-launch$/);
  await expect(page.locator('.lupo-install-steps h3')).toHaveText(['Drag Lupo into Applications.', 'Open Lupo.', 'Click Open Anyway.', 'Confirm it.']);
});

for (const width of [320, 390, 1440]) {
  test(`the Lupo page fits and passes axe at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/lupo/');
    await page.waitForLoadState('networkidle');
    await noOverflow(page);
    const broken = await page.locator('img').evaluateAll(images => images.filter((image): image is HTMLImageElement => image instanceof HTMLImageElement).filter(image => image.complete && image.naturalWidth === 0).map(image => image.src));
    expect(broken).toEqual([]);
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(accessibility.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
  });
}

test('the Download button counts and redirects to the stable DMG path', async ({ request }) => {
  const response = await request.get('/lupo/download/', { maxRedirects: 0 });
  expect(response.status()).toBe(302);
  expect(new URL(response.headers().location).pathname).toBe('/lupo/Lupo.dmg');
  expect(response.headers()['cache-control']).toBe('no-store');
});

test('updates.json is served as JSON with the fields installed apps read', async ({ request }) => {
  const response = await request.get('/lupo/updates.json');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('application/json');
  const served = await response.json();
  for (const field of ['version', 'build', 'date', 'minimumSystem', 'url', 'sha256', 'notes', 'releases']) expect(served).toHaveProperty(field);
  expect(served.releases[0].version).toBe(served.version);
});

test('the header marks Lupo as current and uses the Menu until four nav items fit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/lupo/');
  await page.setViewportSize({ width: 800, height: 700 });
  const button = page.getByRole('button', { name: 'Menu' });
  await expect(button).toBeVisible();
  await expect(page.locator('.site-header > nav')).toBeHidden();
  await button.click();
  await expect(page.locator('#site-menu').getByRole('link', { name: 'Lupo' })).toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('Escape');
  await expect(page.locator('#site-menu')).toBeHidden();

  await page.setViewportSize({ width: 900, height: 700 });
  await expect(button).toBeHidden();
  await expect(page.locator('.site-header > nav').getByRole('link', { name: 'Lupo' })).toHaveAttribute('aria-current', 'page');
  expect(await page.locator('.site-header').evaluate(header => header.scrollWidth - header.clientWidth)).toBeLessThanOrEqual(0);
  await expect(page.locator('.site-header > nav a.nav-work')).toHaveCSS('height', '40px');
});
