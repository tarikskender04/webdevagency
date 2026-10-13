import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, readFileSync } from 'node:fs';

async function ready(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}
async function noOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
}

test('desktop page, pinned capabilities, previews and browser errors', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await ready(page);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('The best site your business');
  await page.waitForTimeout(1400); // Wait for the specified entrance animation.
  mkdirSync('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/desktop.png' });
  await noOverflow(page);
  await page.locator('#work').scrollIntoViewIfNeeded();
  await expect(page.locator('.cap-track')).toHaveAttribute('data-motion-ready', 'true');
  await page.getByRole('button', { name: 'Show Brand identity', exact: true }).click();
  await expect(page.locator('.cap-pagination')).toContainText('02');
  await page.locator('.cap-brand').screenshot({ path: 'artifacts/capabilities.png' });
  await page.getByRole('button', { name: 'Show Online ordering', exact: true }).click();
  await expect(page.locator('.cap-pagination')).toContainText('03');
  await expect(page.locator('.cap-ordering astro-island')).not.toHaveAttribute('ssr', '');
  await page.getByRole('button', { name: 'Clutch', exact: true }).click();
  await page.getByRole('button', { name: 'Wine yarn', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Wine yarn', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Show Content editing', exact: true }).click();
  await expect(page.locator('.cap-pagination')).toContainText('04');
  await expect(page.locator('.cap-editing astro-island')).not.toHaveAttribute('ssr', '');
  await page.getByRole('switch', { name: 'Available to order' }).click();
  await expect(page.getByRole('switch', { name: 'Available to order' })).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('button', { name: 'Update preview' }).click();
  await expect(page.getByRole('button', { name: 'Preview updated' })).toBeVisible();
  await page.locator('#process').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'artifacts/process.png' });
  await page.locator('#start').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'artifacts/contact.png' });
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/footer.png' });
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('contact validation, chip choices, review, edit and download', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await page.locator('#start').scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island[component-export="ContactForm"]')).not.toHaveAttribute('ssr', '');
  await page.getByRole('button', { name: 'Review your brief' }).click();
  await expect(page.getByRole('alert')).toContainText('Add your name and a valid email');
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Jamie Taylor');
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('jamie@test.invalid');
  await page.getByRole('button', { name: 'Restaurant / café', exact: true }).click();
  await page.getByRole('button', { name: '$3–6k', exact: true }).click();
  await page.getByRole('button', { name: '1–2 months', exact: true }).click();
  await page.getByRole('button', { name: 'Review your brief' }).click();
  await expect(page.getByRole('heading', { name: 'Thanks, Jamie.' })).toBeFocused();
  await expect(page.locator('.brief-review')).toContainText('A call has not been booked');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download your brief' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('meridian-project-brief.txt');
  const downloaded = readFileSync((await file.path())!, 'utf8');
  expect(downloaded).toContain('Name: Jamie Taylor');
  expect(downloaded).toContain('Budget: $3–6k');
  expect(downloaded).toContain('Timeline: 1–2 months');
  await page.getByRole('button', { name: 'Edit details' }).click();
  await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('Jamie Taylor');
  await expect(page.getByRole('button', { name: '$3–6k', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

for (const width of [320, 390, 768]) {
  test(`responsive layout and accessible content at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ready(page);
    await noOverflow(page);
    const broken = await page.locator('img').evaluateAll(images => images.filter((image): image is HTMLImageElement => image instanceof HTMLImageElement).filter(image => image.complete && image.naturalWidth === 0).map(image => image.src));
    expect(broken).toEqual([]);
    if (width === 390 || width === 768) await page.screenshot({ path: `artifacts/${width === 390 ? 'mobile' : 'tablet'}.png`, fullPage: true });
    await page.locator('#work').scrollIntoViewIfNeeded();
    await expect(page.locator('.cap-track')).toHaveAttribute('data-motion-ready', 'true');
    await page.getByRole('button', { name: 'Next capability', exact: true }).click();
    await expect(page.locator('.cap-pagination')).toContainText('02');
    await noOverflow(page);
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(accessibility.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
    expect(await page.locator('canvas').count()).toBe(0);
  });
}

test('mouse dragging works in native track mode', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 650 });
  await ready(page);
  await page.locator('#work').scrollIntoViewIfNeeded();
  await expect(page.locator('.cap-track')).toHaveAttribute('data-motion-ready', 'true');
  await page.mouse.move(1100, 300);
  await page.mouse.down();
  await page.mouse.move(200, 300, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator('.cap-pagination')).toContainText('02');
});

test('core content remains available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4322/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('The best site');
  await expect(page.locator('#process-heading')).toContainText('opening day');
  await expect(page.locator('#contact-heading')).toContainText('Tell us about the business');
  expect((await page.content()).includes('thousands of orders')).toBeFalsy();
  await context.close();
});
