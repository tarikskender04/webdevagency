import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

async function scrollTo(page: Page, selector: string): Promise<void> {
  await page.locator(selector).evaluate(element => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top - window.innerHeight * .2, behavior: 'instant' });
  });
}

async function transformX(page: Page, selector: string): Promise<number> {
  return page.locator(selector).evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
}

test('process direct navigation, directional entrances, pencil, hover and typed code', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#process');
  await expect(page.locator('#process')).toHaveAttribute('data-process-motion', 'ready');
  // Alternate rows start on opposite sides before they enter the viewport.
  expect(await transformX(page, '.process-row:nth-of-type(2) .process-visual')).toBeLessThan(-40);
  expect(await transformX(page, '.process-row:nth-of-type(3) .process-visual')).toBeGreaterThan(40);
  await scrollTo(page, '.process-row:nth-of-type(1)');
  const pencil = page.locator('.notebook-pencil');
  await expect.poll(() => pencil.evaluate(element => Number(getComputedStyle(element).opacity))).toBeGreaterThan(.5);
  const firstPosition = await pencil.evaluate(element => getComputedStyle(element).left);
  await expect.poll(() => pencil.evaluate(element => getComputedStyle(element).left)).not.toBe(firstPosition);
  await expect.poll(() => page.locator('[data-sticker]').evaluateAll(elements => elements.every(element => getComputedStyle(element).clipPath.startsWith('inset(') && (getComputedStyle(element).clipPath.match(/[\d.]+/g) ?? []).every(value => Number(value) === 0))), { timeout: 10000 }).toBeTruthy();
  await expect.poll(() => pencil.evaluate(element => Number(getComputedStyle(element).opacity))).toBe(0);
  mkdirSync('artifacts', { recursive: true });
  await page.locator('.notebook').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/process-notebook-desktop.png' });

  await scrollTo(page, '.process-row:nth-of-type(2)');
  await expect.poll(() => transformX(page, '.process-row:nth-of-type(2) .process-visual')).toBe(0);
  await expect.poll(() => page.locator('.design-card [data-process-glass]').evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)).toBe(0);
  const swatch = page.locator('.design-swatch').first();
  await swatch.hover();
  await expect.poll(() => swatch.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)).toBe(-4);
  await page.mouse.move(10, 10);
  await page.screenshot({ path: 'artifacts/process-design-desktop.png' });

  await scrollTo(page, '.process-row:nth-of-type(3)');
  const finalLine = page.locator('[data-process-type]').last();
  await expect.poll(() => finalLine.evaluate(element => (getComputedStyle(element).clipPath.match(/[\d.]+/g) ?? []).some(value => Number(value) > 0))).toBeTruthy();
  await expect.poll(() => finalLine.evaluate(element => (getComputedStyle(element).clipPath.match(/[\d.]+/g) ?? []).every(value => Number(value) === 0)), { timeout: 12000 }).toBeTruthy();
  const product = page.locator('.process-product').first();
  await product.hover();
  await expect.poll(() => product.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)).toBe(-3);
  await page.mouse.move(10, 10);
  await page.screenshot({ path: 'artifacts/process-build-desktop.png' });

  await scrollTo(page, '.process-row:nth-of-type(4)');
  await expect(page.locator('astro-island[component-export="ReviewPanel"]')).not.toHaveAttribute('ssr', '');
  // Measure the card only once the row has finished sliding and scaling in.
  await expect.poll(() => page.locator('.process-row:nth-of-type(4) .process-visual').evaluate(element => getComputedStyle(element).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  const readyTab = page.getByRole('tab', { name: 'Ready', exact: true });
  await readyTab.click();
  await expect(page.locator('.review-annotations > li')).toHaveCount(3);
  await expect(page.locator('.review-pin')).toHaveCount(3);
  const productHeight = await page.locator('.review-product-card').evaluate(element => element.getBoundingClientRect().height);
  await readyTab.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'At launch', exact: true })).toBeFocused();
  await expect(page.locator('.review-content')).toContainText('Opens at launch');
  await page.getByRole('tab', { name: 'Loading', exact: true }).click();
  await expect(page.locator('.skeleton-preview')).toBeVisible();
  expect(await page.locator('.review-product-card').evaluate(element => element.getBoundingClientRect().height)).toBeCloseTo(productHeight, 0);
  await page.locator('.review-card').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/process-review-desktop.png' });

  await scrollTo(page, '.process-row:nth-of-type(5)');
  await expect.poll(() => transformX(page, '.process-row:nth-of-type(5) .process-visual')).toBe(0);
  await page.locator('.launch-card').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/process-launch-desktop.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
  const accessibility = await new AxeBuilder({ page }).include('#process').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
  await scrollTo(page, '.site-footer');
  await expect(page.locator('.process-bottom-blur')).not.toHaveClass(/active/);
  expect(errors).toEqual([]);
});

test('reduced motion interrupts the notebook reveal and preserves all static content', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#process');
  await expect(page.locator('#process')).toHaveAttribute('data-process-motion', 'ready');
  await scrollTo(page, '.process-row:nth-of-type(1)');
  await expect.poll(() => page.locator('.notebook-pencil').evaluate(element => Number(getComputedStyle(element).opacity))).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.locator('[data-sticker], [data-process-type], .process-visual, [data-process-glass]').evaluateAll(elements => elements.every(element => getComputedStyle(element).clipPath === 'none' && getComputedStyle(element).opacity === '1'))).toBeTruthy();
  await expect(page.locator('.process-bottom-blur')).toBeHidden();
  await scrollTo(page, '.process-row:nth-of-type(4)');
  await expect(page.locator('astro-island[component-export="ReviewPanel"]')).not.toHaveAttribute('ssr', '');
  // Measure the card only once the row has finished sliding and scaling in.
  await expect.poll(() => page.locator('.process-row:nth-of-type(4) .process-visual').evaluate(element => getComputedStyle(element).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  await page.getByRole('tab', { name: 'At launch', exact: true }).click();
  await expect(page.locator('.review-content')).toContainText('Opens at launch');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('#process')).toHaveAttribute('data-process-motion', 'ready');
  await expect(page.locator('.process-row:nth-of-type(1) .process-visual')).toHaveCSS('opacity', '1');
});

for (const width of [390, 768]) {
  test(`process motion and hover-free layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/#process');
    await expect(page.locator('#process')).toHaveAttribute('data-process-motion', 'ready');
    await scrollTo(page, '.process-row:nth-of-type(3)');
    await expect(page.locator('.process-row:nth-of-type(3) .process-visual')).toHaveCSS('opacity', '1');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('.code-card').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `artifacts/process-build-${width}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
    const accessibility = await new AxeBuilder({ page }).include('#process').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(accessibility.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
  });
}

test('Aurora fills its section at high pixel density, after resize and motion changes', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#process');
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.process-aurora astro-island[component-export="Aurora"]')).not.toHaveAttribute('ssr', '');
  await expect(page.locator('.process-aurora canvas')).toHaveCount(1);
  const fillsWash = async (selector: string): Promise<boolean> => page.locator(selector).evaluate(wash => {
    const canvas = wash.querySelector('canvas');
    if (!canvas) return false;
    const bounds = wash.getBoundingClientRect(), drawing = canvas.getBoundingClientRect();
    return Math.abs(bounds.width - drawing.width) < 1 && Math.abs(bounds.height - drawing.height) < 1 && Math.abs(bounds.left - drawing.left) < 1 && Math.abs(bounds.top - drawing.top) < 1 && canvas.width <= 1440 && canvas.height <= 1080;
  });
  await expect.poll(() => fillsWash('.process-aurora')).toBeTruthy();
  // Stacked, the Process wash holds a viewport-tall canvas to the screen instead of stretching it into stripes.
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.locator('.process-row:nth-of-type(3)').scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('.process-aurora').evaluate(wash => {
    const canvas = wash.querySelector('canvas');
    if (!canvas) return false;
    const bounds = wash.getBoundingClientRect(), drawing = canvas.getBoundingClientRect();
    return Math.abs(bounds.width - drawing.width) < 1 && Math.abs(bounds.left - drawing.left) < 1 && Math.abs(drawing.top) < 1 && Math.abs(drawing.height - innerHeight) < 1 && canvas.width <= 1440 && canvas.height <= 1080;
  })).toBeTruthy();
  await page.locator('#start').scrollIntoViewIfNeeded();
  await expect(page.locator('.contact-aurora canvas')).toHaveCount(1);
  await expect.poll(() => fillsWash('.contact-aurora')).toBeTruthy();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(errors).toEqual([]);
  await context.close();
});

test('motifs and flyouts stay clear of readable copy across the responsive breakpoints', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#process');
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const overlaps = await page.locator('#process').evaluate(root => {
      const motifs = Array.from(root.querySelectorAll<HTMLImageElement>('.process-motif')).map(image => ({ name: image.className, bounds: image.getBoundingClientRect() }));
      const hits: string[] = [];
      root.querySelectorAll('.process-copy h3, .process-copy p, .process-copy li').forEach(text => {
        const range = document.createRange();
        range.selectNodeContents(text);
        for (const bounds of range.getClientRects()) {
          for (const motif of motifs) {
            if (Math.min(bounds.right, motif.bounds.right) - Math.max(bounds.left, motif.bounds.left) > 1 && Math.min(bounds.bottom, motif.bounds.bottom) - Math.max(bounds.top, motif.bounds.top) > 1) hits.push(`${motif.name}: ${text.textContent}`);
          }
        }
      });
      const flyouts = Array.from(root.querySelectorAll('.process-flyout')).map(element => ({ name: element.className, bounds: element.getBoundingClientRect() }));
      root.querySelectorAll('.process-card-header .eyebrow, .review-annotations p, .review-note-meta, .review-checks > span, .glass-strip strong').forEach(text => {
        const range = document.createRange();
        range.selectNodeContents(text);
        for (const bounds of range.getClientRects()) {
          for (const flyout of flyouts) {
            if (Math.min(bounds.right, flyout.bounds.right) - Math.max(bounds.left, flyout.bounds.left) > 1 && Math.min(bounds.bottom, flyout.bounds.bottom) - Math.max(bounds.top, flyout.bounds.top) > 1) hits.push(`${flyout.name}: ${text.textContent}`);
          }
        }
      });
      return hits;
    });
    expect(overlaps, `Decoration overlaps at ${width}px`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
  }
});

test('Ship it plays the Crochê site reel from /work/ in view, pauses on demand and waits under reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const reel = page.locator('.launch-reel');
  const video = reel.locator('video');
  await expect(video.locator('source')).toHaveAttribute('src', '/video/croche-reel.mp4');
  await expect(video).toHaveAttribute('aria-label', /Crochê website/);
  await reel.scrollIntoViewIfNeeded();
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => !element.paused && element.muted)).toBeTruthy();
  const toggle = reel.getByRole('button', { name: 'Pause site walkthrough' });
  await toggle.click();
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBeTruthy();
  await expect(reel.getByRole('button', { name: 'Play site walkthrough' })).toBeVisible();
  await page.locator('.launch-card').screenshot({ path: 'artifacts/process-launch-reel.png' });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await page.locator('.launch-reel').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  expect(await page.locator('.launch-reel video').evaluate((element: HTMLVideoElement) => element.paused)).toBeTruthy();
});
