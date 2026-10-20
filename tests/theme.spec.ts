import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';
import { setTheme } from './helpers/theme';

test('the toggle starts on Auto, overrides it with light or dark, and persists across pages and reloads', async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/');
  const theme = page.getByRole('switch', { name: 'Dark mode' });
  await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'system');
  await expect(theme).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await theme.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(theme).toHaveAttribute('aria-checked', 'false');
  await expect.poll(() => page.locator('.hero-plate').evaluate((image: HTMLImageElement) => image.currentSrc)).toContain('hall-light');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#FFFFFF');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  // The saved override selects the daylight photograph even while the system still prefers dark.
  await page.reload();
  await expect(theme).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect.poll(() => page.locator('.hero-plate').evaluate((image: HTMLImageElement) => image.currentSrc)).toContain('hall-light');
  await expect(page.locator('.hero-plate')).toHaveJSProperty('complete', true);
  await page.goto('/work/');
  await expect(theme).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('.site-footer')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  // Keep another open tab in sync with the same saved choice.
  const other = await context.newPage();
  await other.goto('/');
  await other.getByRole('switch', { name: 'Dark mode' }).click();
  await expect(other.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await other.close();
  // Clearing the saved choice returns to Auto, which follows the system again.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.site-footer')).toHaveCSS('background-color', 'rgb(10, 26, 37)');
});

test('changing themes during the billboard zoom keeps the frame, screen and copy stationary', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const billboard = page.locator('#billboard');
  const geometry = (): Promise<number[][]> => billboard.evaluate(root => ['.billboard-view', '.billboard-screen', '.billboard-copy h2'].map(selector => {
    const rect = root.querySelector(selector)!.getBoundingClientRect();
    return [rect.x, rect.y, rect.width, rect.height];
  }));
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await setTheme(page, 'light');
    await billboard.evaluate((track: HTMLElement) => window.scrollTo({ top: track.getBoundingClientRect().top + scrollY + (track.offsetHeight - innerHeight) * .5, behavior: 'instant' }));
    // Let the browser sample its scroll timeline before comparing the two themes.
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const before = await geometry();
    for (const theme of ['dark', 'light']) {
      await setTheme(page, theme as 'light' | 'dark');
      await expect.poll(async () => {
        const after = await geometry();
        return Math.max(...after.flatMap((rect, index) => rect.map((value, coordinate) => Math.abs(value - before[index][coordinate]))));
      }).toBeLessThan(.1);
    }
  }
});

test('theme controls, billboard and footer are accessible and fit phone, tablet and desktop layouts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  mkdirSync('artifacts', { recursive: true });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      const control = page.getByRole('switch', { name: 'Dark mode' });
      await setTheme(page, theme as 'light' | 'dark');
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await control.focus();
      await expect(control).toBeFocused();
      // Phones show one icon without the paper thumb behind it, so it takes the header's colour (it was ink on the night header).
      const icon = await control.evaluate(element => getComputedStyle([...element.querySelectorAll('.theme-icon')].find(shown => getComputedStyle(shown).display !== 'none')!).color);
      if (width <= 760) expect(icon).toBe(theme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(10, 26, 37)');
      const header = await page.locator('.site-header').evaluate(element => {
        const rects = [...element.children].filter(child => getComputedStyle(child).display !== 'none').map(child => child.getBoundingClientRect());
        return rects.every((rect, index) => rect.left >= 0 && rect.right <= innerWidth && (!index || rect.left >= rects[index - 1].right));
      });
      expect(header).toBeTruthy();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
      await page.screenshot({ path: `artifacts/theme-header-${theme}-${width}.png` });
      await page.locator('.billboard-stage').scrollIntoViewIfNeeded();
      await expect.poll(() => page.locator('.billboard-foreground').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBeTruthy();
      await page.locator('.billboard-stage').screenshot({ path: `artifacts/theme-billboard-${theme}-${width}.png` });
      await page.locator('.site-footer').scrollIntoViewIfNeeded();
      await page.locator('.site-footer').screenshot({ path: `artifacts/theme-footer-${theme}-${width}.png` });
      const accessibility = await new AxeBuilder({ page }).include('.site-header').include('#billboard').include('.site-footer').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(accessibility.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
    }
  }
  expect(errors).toEqual([]);
});

test('live Aurora changes palette without recreating its canvas, and theme selection tolerates blocked storage', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage unavailable'); };
    Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); };
  });
  await page.goto('/');
  await setTheme(page, 'light');
  const billboard = page.locator('#billboard');
  await billboard.evaluate((track: HTMLElement) => window.scrollTo({ top: track.getBoundingClientRect().top + scrollY + (track.offsetHeight - innerHeight) * .95, behavior: 'instant' }));
  const canvas = billboard.locator('canvas');
  await expect(canvas).toHaveCount(1);
  const uniforms = (): Promise<{ mode: number; stop: number[] } | null> => canvas.evaluate((element: HTMLCanvasElement) => {
    const gl = element.getContext('webgl2');
    if (!gl) return null;
    // Hydration adds the canvas before its first visible animation frame binds the program.
    const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram | null;
    if (!program) return null;
    const mode = gl.getUniformLocation(program, 'uLightMode');
    const stop = gl.getUniformLocation(program, 'uStops[0]');
    if (!mode || !stop) return null;
    return { mode: gl.getUniform(program, mode) as number, stop: [...gl.getUniform(program, stop) as Float32Array] };
  });
  await expect.poll(async () => (await uniforms())?.mode).toBe(1);
  const day = await uniforms();
  await canvas.evaluate(element => element.dataset.originalCanvas = 'true');
  await setTheme(page, 'dark');
  await expect.poll(async () => (await uniforms())?.mode).toBe(0);
  expect((await uniforms())?.stop).not.toEqual(day?.stop);
  await expect(canvas).toHaveAttribute('data-original-canvas', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(canvas).toHaveCount(0);
  await setTheme(page, 'light');
  await expect(page.locator('.billboard-copy')).toHaveCSS('color', 'rgb(10, 26, 37)');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await billboard.evaluate((track: HTMLElement) => window.scrollTo({ top: track.getBoundingClientRect().top + scrollY + (track.offsetHeight - innerHeight) * .95, behavior: 'instant' }));
  await expect(canvas).toHaveCount(1);
  await expect.poll(async () => (await uniforms())?.mode).toBe(1);
});
