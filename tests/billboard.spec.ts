import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

test('billboard closes Process before Contact with a live, motion-safe Aurora', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning' && /uniform|shader|compile|link/i.test(message.text())) errors.push(message.text());
  });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const order = await page.locator('main > section').evaluateAll(sections => sections.map(section => section.id));
  expect(order.slice(order.indexOf('process'), order.indexOf('process') + 2)).toEqual(['process', 'start']);
  await expect(page.locator('#process > #billboard')).toHaveCount(1);
  const billboard = page.locator('#billboard');
  await billboard.evaluate((track: HTMLElement) => window.scrollTo({ top: track.getBoundingClientRect().top + scrollY + (track.offsetHeight - innerHeight) * .95, behavior: 'instant' }));
  await expect(billboard.getByRole('heading', { level: 2 })).toHaveText('Your website is costing you clients.');
  await expect(billboard.locator('.billboard-brand')).toHaveText('Prodigy Stdio');
  const photo = billboard.locator('.billboard-foreground');
  await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBeTruthy();
  const canvas = billboard.locator('canvas');
  await expect(canvas).toHaveCount(1);
  await expect.poll(() => canvas.evaluate((element: HTMLCanvasElement) => element.width > 0 && element.height > 0)).toBeTruthy();
  // Verify actual rendered movement rather than just the presence of a canvas.
  const first = await canvas.screenshot();
  await expect.poll(async () => first.equals(await canvas.screenshot())).toBeFalsy();
  await page.setViewportSize({ width: 390, height: 844 });
  await billboard.scrollIntoViewIfNeeded();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(canvas).toHaveCount(0);
  await expect(billboard.getByRole('heading', { level: 2 })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(canvas).toHaveCount(1);
  expect(errors).toEqual([]);
});

for (const width of [390, 768, 1440]) {
  test(`Process shrinks into the billboard display and reverses at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const billboard = page.locator('#billboard');
    await expect(billboard).toHaveAttribute('data-billboard-portal', '');
    const at = async (progress: number): Promise<void> => {
      await billboard.evaluate((track: HTMLElement, value) => window.scrollTo({ top: track.getBoundingClientRect().top + scrollY + (track.offsetHeight - innerHeight) * value, behavior: 'instant' }), progress);
    };
    const display = page.locator('.billboard-screen');
    const closing = page.locator('.process-closing');
    const message = page.locator('.billboard-copy');
    await at(0);
    await expect(closing).toBeInViewport({ ratio: 1 });
    await expect(closing).toHaveCSS('opacity', '1');
    await expect(message).toBeHidden();
    const fillsViewport = async (): Promise<boolean> => display.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      return bounds.left <= 1 && bounds.top <= 1 && bounds.right >= innerWidth - 1 && bounds.bottom >= innerHeight - 1;
    });
    await expect.poll(fillsViewport).toBeTruthy();
    mkdirSync('artifacts', { recursive: true });
    await page.screenshot({ path: `artifacts/process-billboard-full-${width}.png` });
    const initial = await display.boundingBox();
    await at(.5);
    await expect.poll(async () => (await display.boundingBox())!.width).toBeLessThan(initial!.width);
    await expect(closing).toBeVisible();
    await page.screenshot({ path: `artifacts/process-billboard-shrinking-${width}.png` });
    await at(.95);
    await expect(closing).toBeHidden();
    await expect(message).toBeVisible();
    const geometry = await display.evaluate(element => {
      const screen = element.getBoundingClientRect();
      const photo = document.querySelector('.billboard-foreground')!.getBoundingClientRect();
      return { width: screen.width / photo.width, top: (screen.top - photo.top) / photo.height, fits: screen.left >= -1 && screen.right <= innerWidth + 1, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    expect(geometry.width).toBeCloseTo(width <= 760 ? .387 : .5, 3);
    expect(geometry.top).toBeCloseTo(width <= 760 ? .2065 : .2305, 3);
    expect(geometry.fits).toBeTruthy();
    expect(geometry.overflow).toBeFalsy();
    await page.screenshot({ path: `artifacts/process-billboard-revealed-${width}.png` });
    await at(0);
    await expect.poll(fillsViewport).toBeTruthy();
    await expect(closing).toBeVisible();
    await expect(message).toBeHidden();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(billboard).not.toHaveAttribute('data-billboard-portal');
    await expect(billboard.locator(':scope > .billboard-process .process-closing')).toHaveCount(1);
    await expect(closing).toBeVisible();
    await expect(message).toBeVisible();
    await expect(page.locator('.process-closing')).toHaveCount(1);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(billboard).toHaveAttribute('data-billboard-portal', '');
    // Process's opening track also changes height when motion resumes; wait for the resulting layout refresh.
    await expect.poll(async () => { await at(0); return fillsViewport(); }).toBeTruthy();
  });
}

test('resizing the closing zoom keeps the display aligned and short screens show both static messages', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const billboard = page.locator('#billboard');
  await billboard.evaluate((track: HTMLElement) => window.scrollTo({ top: track.getBoundingClientRect().top + scrollY + (track.offsetHeight - innerHeight) * .5, behavior: 'instant' }));
  await page.setViewportSize({ width: 390, height: 844 });
  await billboard.evaluate((track: HTMLElement) => window.scrollTo({ top: track.getBoundingClientRect().top + scrollY, behavior: 'instant' }));
  await expect.poll(() => billboard.locator('.billboard-screen').evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThan(843);
  await page.setViewportSize({ width: 1280, height: 500 });
  await expect(billboard).not.toHaveAttribute('data-billboard-portal');
  await expect(billboard.locator(':scope > .billboard-process .process-closing')).toHaveCount(1);
  await expect(billboard.locator('.process-closing')).toBeVisible();
  await expect(billboard.locator('.billboard-copy')).toBeVisible();
});

test('a browser without view timeline support retains both closing messages and the CTA', async ({ page }) => {
  await page.addInitScript(() => {
    const supports = CSS.supports.bind(CSS);
    CSS.supports = ((...args: [string] | [string, string]): boolean => args[0].includes('animation-timeline') ? false : args.length === 1 ? supports(args[0]) : supports(args[0], args[1])) as typeof CSS.supports;
  });
  await page.goto('/');
  const billboard = page.locator('#billboard');
  await expect(billboard).not.toHaveAttribute('data-billboard-portal');
  await expect(billboard.locator('.process-closing')).toBeVisible();
  await expect(billboard.locator('.billboard-copy')).toBeVisible();
  await billboard.locator('.process-closing').scrollIntoViewIfNeeded();
  await expect(page.locator('#process')).toHaveAttribute('data-process-motion', 'ready');
  await expect(billboard.locator('.process-closing')).toHaveCSS('opacity', '1');
  await billboard.getByRole('link', { name: 'Start a project' }).click();
  await expect(page).toHaveURL(/#start$/);
  await expect(page.locator('#start')).toBeInViewport();
});

test('billboard photo, screen and readable HTML align across viewport sizes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  mkdirSync('artifacts', { recursive: true });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const billboard = page.locator('#billboard');
    await billboard.scrollIntoViewIfNeeded();
    const geometry = await billboard.evaluate(section => {
      const photo = section.querySelector('.billboard-foreground')!.getBoundingClientRect();
      const screen = section.querySelector('.billboard-screen')!.getBoundingClientRect();
      const headline = section.querySelector('h2')!.getBoundingClientRect();
      const brand = section.querySelector('.billboard-brand')!.getBoundingClientRect();
      return {
        screenCenter: Math.abs((screen.left + screen.width / 2) - (photo.left + photo.width / 2)),
        screenTop: (screen.top - photo.top) / photo.height,
        screenWidth: screen.width / photo.width,
        contentFits: headline.left >= screen.left && headline.right <= screen.right && brand.bottom <= screen.bottom,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
    expect(geometry.screenCenter).toBeLessThan(2);
    expect(geometry.screenTop).toBeCloseTo(width <= 760 ? .2065 : .2305, 3);
    expect(geometry.screenWidth).toBeCloseTo(width <= 760 ? .387 : .5, 3);
    expect(geometry.contentFits).toBeTruthy();
    expect(geometry.overflow).toBeFalsy();
    await billboard.screenshot({ path: `artifacts/billboard-${width}.png` });
  }
  const accessibility = await new AxeBuilder({ page }).include('#billboard').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
});

test('day and night photographs, masks and portal alignment follow live system-theme changes', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const billboard = page.locator('#billboard');
  const at = async (progress: number): Promise<void> => {
    await billboard.evaluate((track: HTMLElement, value) => window.scrollTo({ top: track.getBoundingClientRect().top + scrollY + (track.offsetHeight - innerHeight) * value, behavior: 'instant' }), progress);
  };
  mkdirSync('artifacts', { recursive: true });
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const colorScheme of ['light', 'dark', 'light'] as const) {
      // Switch while the zoom is in progress: the viewport keeps its shape, so a theme change must explicitly
      // remeasure the display even when that view's outer dimensions haven't changed.
      await at(.5);
      await page.emulateMedia({ colorScheme });
      const stem = width <= 760 ? (colorScheme === 'light' ? 'daymobile' : 'nightmobile') : (colorScheme === 'light' ? 'Daylight' : 'Neon');
      // The outgoing photograph's fading copy shares the class for a moment.
      const photo = billboard.locator('.billboard-foreground:not(.theme-ghost)');
      await expect.poll(() => photo.evaluate((element: HTMLImageElement) => element.currentSrc)).toContain(stem);
      await expect.poll(() => photo.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBeTruthy();
      await expect.poll(() => billboard.locator('.billboard-photo-finish').evaluate(element => getComputedStyle(element, '::before').maskImage)).toContain(stem);
      await expect.poll(() => billboard.locator('.billboard-stage').evaluate(element => getComputedStyle(element, '::before').backgroundImage)).toContain(stem);
      await at(0);
      await expect.poll(() => billboard.locator('.billboard-screen').evaluate(element => {
        const bounds = element.getBoundingClientRect();
        return bounds.left <= 1 && bounds.top <= 1 && bounds.right >= innerWidth - 1 && bounds.bottom >= innerHeight - 1;
      })).toBeTruthy();
      await expect(billboard.locator('.process-closing')).toBeInViewport({ ratio: .99 });
      await at(.95);
      await expect(billboard.locator('.billboard-copy')).toBeVisible();
      const geometry = await billboard.evaluate(root => {
        const photo = root.querySelector('.billboard-foreground')!.getBoundingClientRect();
        const screen = root.querySelector('.billboard-screen')!.getBoundingClientRect();
        return { left: (screen.left - photo.left) / photo.width, top: (screen.top - photo.top) / photo.height, width: screen.width / photo.width, height: screen.height / photo.height, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
      });
      const expected = width <= 760 ? { left: .306, top: .2065, width: .387, height: .4515 } : colorScheme === 'light' ? { left: .251, top: .2305, width: .5, height: .392 } : { left: .2488, top: .233, width: .503, height: .4065 };
      for (const key of ['left', 'top', 'width', 'height'] as const) expect(geometry[key]).toBeCloseTo(expected[key], 3);
      expect(geometry.overflow).toBeFalsy();
      await page.screenshot({ path: `artifacts/billboard-${colorScheme}-${width}.png` });
    }
  }
});
