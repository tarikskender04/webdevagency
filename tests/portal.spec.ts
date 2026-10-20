import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

/** Sample the browser's scroll timeline after moving through a portal's sticky range. */
async function portalAt(page: Page, portal: '.portal-open' | '.portal-close', progress: number): Promise<void> {
  await page.locator(portal).evaluate(async (track: HTMLElement, at) => {
    const top = track.getBoundingClientRect().top + scrollY;
    window.scrollTo({ top: top + (track.offsetHeight - innerHeight) * at, behavior: 'instant' });
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }, progress);
}

async function holeTop(page: Page): Promise<number> {
  return page.locator('.portal-open .portal-hole').evaluate(hole => parseFloat(getComputedStyle(hole).top));
}

async function pixelCoverage(page: Page): Promise<number> {
  return page.locator('.portal-swap .pixel-swap__pixel').evaluateAll(pixels => pixels.reduce((sum, pixel) => {
    const style = getComputedStyle(pixel);
    return sum + Number(style.opacity) * new DOMMatrixReadOnly(style.transform).a;
  }, 0));
}

async function axe(page: Page, selector: string): Promise<void> {
  const accessibility = await new AxeBuilder({ page }).include(selector).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
}

async function portalArriving(page: Page, share: number): Promise<void> {
  await page.locator('.portal-open').evaluate(async (track: HTMLElement, at) => {
    window.scrollTo({ top: track.getBoundingClientRect().top + scrollY - innerHeight * at, behavior: 'instant' });
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }, share);
}

test('scroll-driven animations survive the production build', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('#billboard')).toHaveAttribute('data-billboard-portal', '');
  const names = await page.evaluate(() => ['.billboard-view', '.billboard-process', '.billboard-copy', '.standout-photo', '.portal-hole', '.portal-title'].map(selector => getComputedStyle(document.querySelector(selector)!).animationName));
  expect(names).toEqual(['billboard-pull-back', 'billboard-process-out', 'billboard-message-in', 'standout-settle', 'portal-hole-open', 'portal-title-in']);
});

test('the opening and pixel reveal reverse immediately when scrolling back from the rows and billboard', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const portal = page.locator('.portal-open');
  const title = page.locator('.portal-title');
  const lead = page.locator('.portal-swap .lead');
  const swap = page.locator('.portal-swap');
  await expect(page.locator('#process-heading')).toHaveText('From a pencil line to opening day');
  await expect(page.locator('.portal-chapters > li')).toHaveCount(5);
  await portalArriving(page, .1);
  await expect(title).toHaveText('Take a quick look at how we work');
  await expect(title).toHaveCSS('opacity', '1');
  await expect(lead).toBeHidden();
  await expect(portal).toHaveAttribute('data-portal', 'rest');
  expect(await holeTop(page)).toBeGreaterThan(150);
  mkdirSync('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/process-scroll-rest.png' });
  await axe(page, '.portal-open');

  await portalAt(page, '.portal-open', .15);
  const partialHole = await holeTop(page);
  expect(partialHole).toBeGreaterThan(0);
  expect(partialHole).toBeLessThan(150);
  await portalAt(page, '.portal-open', .5);
  await expect(swap).toHaveAttribute('data-transitioning', 'true');
  const partialPixels = await pixelCoverage(page);
  expect(partialPixels).toBeGreaterThan(0);
  await expect(swap.locator('.portal-world')).toHaveCount(1);
  await expect(swap.locator('.lead')).toHaveCount(1);
  expect(await swap.evaluate(element => element.querySelectorAll('*').length)).toBeLessThan(300);
  await page.screenshot({ path: 'artifacts/process-scroll-pixels-forward.png' });

  await portalAt(page, '.portal-open', .99);
  await expect(portal).toHaveAttribute('data-portal', 'done');
  await expect(lead).toBeVisible();
  await expect(title).toBeHidden();
  expect(await holeTop(page)).toBe(0);
  await expect(page.locator('.portal-line-a')).not.toBeInViewport();
  await expect(page.locator('.portal-line-b')).not.toBeInViewport();
  expect(await page.locator('.portal-chapters > li').evaluateAll(items => items.every(item => getComputedStyle(item).opacity === '1'))).toBeTruthy();
  await page.screenshot({ path: 'artifacts/process-scroll-open.png' });
  await axe(page, '.portal-open');

  // Come back from the end of Process without first leaving the opening portal above the viewport.
  await portalAt(page, '.portal-close', .95);
  const closing = page.locator('.portal-close .process-closing');
  await expect(closing).toBeHidden();
  await expect(page.locator('#billboard-heading')).toBeInViewport({ ratio: 1 });
  await axe(page, '.portal-close');
  await portalAt(page, '.portal-open', .5);
  await expect(portal).toHaveAttribute('data-portal', 'open');
  expect(await pixelCoverage(page)).toBeCloseTo(partialPixels, 3);
  await expect(title).toBeVisible();
  await page.screenshot({ path: 'artifacts/process-scroll-pixels-reverse.png' });
  await portalAt(page, '.portal-open', .15);
  expect(await holeTop(page)).toBeCloseTo(partialHole, 3);
  await portalAt(page, '.portal-open', 0);
  await expect(lead).toBeHidden();
  expect(await pixelCoverage(page)).toBe(0);
  expect(await holeTop(page)).toBeGreaterThan(150);
  await portalAt(page, '.portal-open', .99);
  await expect(lead).toBeVisible();

  await portalAt(page, '.portal-close', 0);
  await closing.getByRole('link', { name: 'Start a project' }).click();
  await expect(page).toHaveURL(/#start$/);
  await expect(page.locator('#start')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  expect(errors).toEqual([]);
});

for (const width of [390, 768, 1440]) {
  test(`pixels pause with scrolling, reverse through the same mask and restore motion at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await portalAt(page, '.portal-open', .46);
    const swap = page.locator('.portal-swap');
    const incoming = swap.locator('.pixel-swap__layer').last();
    await expect(swap).toHaveAttribute('data-transitioning', 'true');
    await expect(incoming).toHaveAttribute('inert', '');
    const mask = await incoming.evaluate(element => getComputedStyle(element).maskImage);
    const before = await pixelCoverage(page);
    expect(before).toBeGreaterThan(0);
    await page.waitForTimeout(250); // A stopped scroll must hold this exact frame rather than finish on a timer.
    expect(await pixelCoverage(page)).toBeCloseTo(before, 4);
    await portalAt(page, '.portal-open', .58);
    expect(await pixelCoverage(page)).toBeGreaterThan(before);
    await portalAt(page, '.portal-open', .46);
    expect(await pixelCoverage(page)).toBeCloseTo(before, 4);
    expect(await incoming.evaluate(element => getComputedStyle(element).maskImage)).toBe(mask);
    await expect(swap.locator('.portal-world')).toHaveCount(1);
    await expect(swap.locator('.pixel-swap__pixel').first()).toHaveCSS('animation-name', 'pixel-swap-scroll');
    mkdirSync('artifacts', { recursive: true });
    await page.screenshot({ path: `artifacts/process-scroll-reverse-${width}.png` });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(swap).toHaveAttribute('data-transitioning', 'false');
    await expect(page.locator('.portal-open')).not.toHaveAttribute('data-portal');
    await expect(incoming).not.toHaveAttribute('inert');
    await expect(incoming).not.toHaveAttribute('aria-hidden');
    await expect(incoming).toHaveCSS('mask-image', 'none');
    await expect(swap.locator('.pixel-swap__pixel')).toHaveCount(0);
    await expect(incoming.locator('.lead')).toBeVisible();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    // The existing row effects refresh their layout when motion resumes and can restore a cached scroll offset.
    // Sample the requested progress after that refresh, as with the billboard's motion-preference checks.
    await expect.poll(async () => { await portalAt(page, '.portal-open', .46); return pixelCoverage(page); }).toBeCloseTo(before, 3);
    await expect(swap).toHaveAttribute('data-transitioning', 'true');
    await portalAt(page, '.portal-open', .99);
    await expect(incoming).not.toHaveAttribute('inert');
    await expect(swap.locator('.pixel-swap__layer').first()).toHaveAttribute('inert', '');
    await expect(page.locator('.portal-title')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  });
}

test('resizing during the reveal rebuilds the mask at the same scroll position and still reverses', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await portalAt(page, '.portal-open', .5);
  const swap = page.locator('.portal-swap');
  await expect(swap).toHaveAttribute('data-transitioning', 'true');
  await page.setViewportSize({ width: 768, height: 900 });
  await portalAt(page, '.portal-open', .5);
  await expect(swap).toHaveAttribute('data-transitioning', 'true');
  const mid = await pixelCoverage(page);
  await expect(swap.locator('.portal-world')).toHaveCount(1);
  await portalAt(page, '.portal-open', .36);
  expect(await pixelCoverage(page)).toBeLessThan(mid);
  await portalAt(page, '.portal-open', .7);
  expect(await pixelCoverage(page)).toBeGreaterThan(mid);
  await page.setViewportSize({ width: 1280, height: 500 });
  await expect(page.locator('.portal-open')).not.toHaveAttribute('data-portal');
  await expect(swap.locator('.lead')).toBeVisible();
  await expect(swap.locator('.pixel-swap__pixel')).toHaveCount(0);
});

test('reduced motion shows the static Process opening and closing band', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#process');
    expect(await page.locator('.portal-open').evaluate((track: HTMLElement) => track.offsetHeight)).toBeLessThan(1400);
    await expect(page.locator('.portal-wall').first()).toBeHidden();
    expect(await page.locator('.portal-line-a, .portal-line-b, .portal-inside .lead, .portal-chapters > li').evaluateAll(items => items.every(item => getComputedStyle(item).opacity === '1'))).toBeTruthy();
    await expect(page.locator('.portal-title-card')).toBeHidden();
    await expect(page.locator('.portal-inside .lead')).toBeVisible();
    expect(await page.locator('.process-closing').evaluate(band => getComputedStyle(band).borderTopWidth)).toBe('1px');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  }
  await axe(page, '#process');
});
