import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';
import { setTheme } from './helpers/theme';

const projects = [
  { client: 'Crochê', slug: 'croche' },
  { client: 'Una Adventure', slug: 'una-adventure' },
  { client: 'Tierd', slug: 'tierd' },
  { client: 'Captured', slug: 'captured' },
];

test('every hero card opens its own section of the work page, with working jump and contact navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const project of projects) {
    await page.goto('/');
    await page.getByRole('button', { name: project.client, exact: true }).click();
    const card = page.getByRole('region', { name: 'Selected work' }).getByRole('link', { name: `View the ${project.client} project` });
    await expect(card).toHaveAttribute('href', `/work/#${project.slug}`);
    await expect(card.getByText('View project')).toBeVisible();
    // Inactive slides must not add extra keyboard stops.
    await expect(page.locator('.deck-slot:not([data-pos="0"]) a[tabindex="-1"]')).toHaveCount(3);
    await card.focus();
    await expect(card).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(`/work/#${project.slug}`);
    await expect(page).toHaveTitle('Our Work: Websites, Ordering & Dashboards | Prodigy Stdio');
    const heading = page.getByRole('heading', { level: 2, name: project.client, exact: true });
    await expect(heading).toBeInViewport();
    // The sticky jump bar must not cover the section heading it scrolled to.
    const [bar, top] = await Promise.all([page.locator('.work-jump').boundingBox(), heading.boundingBox()]);
    expect(top!.y).toBeGreaterThanOrEqual(bar!.y + bar!.height);
    await expect(page.locator('.work-jump').getByRole('link', { name: project.client })).toHaveAttribute('aria-current', 'location');
  }
  // Shared footer/header anchors must lead to the homepage, not missing sections on this route.
  const wrongAnchors = await page.evaluate(() => [...document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].map(link => link.hash.slice(1)).filter(id => id && !document.getElementById(id)));
  expect(wrongAnchors).toEqual([]);
  await page.locator('.work-jump').getByRole('link', { name: 'Tierd' }).click();
  await expect(page).toHaveURL('/work/#tierd');
  await expect(page.getByRole('heading', { level: 2, name: 'Tierd', exact: true })).toBeInViewport();
  await expect(page.locator('#tierd .work-palette li')).toHaveCount(3);
  await page.getByRole('link', { name: 'Start a project', exact: true }).first().click();
  await expect(page).toHaveURL('/#start');
  await expect(page.locator('#contact-heading')).toBeInViewport();
  expect(errors).toEqual([]);
});

test('Behind the build leads the page, ahead of the work reference', async ({ page }) => {
  await page.goto('/work/');
  // Above the first project no jump pill claims to be current.
  await expect(page.locator('.work-jump [aria-current]')).toHaveCount(0);
  const feature = page.locator('#behind-the-build');
  await expect(feature.getByRole('heading', { level: 2, name: 'Behind the build: Crochê.' })).toBeVisible();
  await expect(feature.locator('.walkthrough-start')).toBeVisible();
  await expect(feature.locator('.walkthrough-chapters li')).toHaveCount(4);
  // Everything after the walkthrough is reference: the heading comes first, then the projects in order.
  const order = await page.locator('#behind-the-build, #work-reference, .work-entry').evaluateAll(elements => elements.map(element => element.id));
  expect(order).toEqual(['behind-the-build', 'work-reference', 'croche', 'una-adventure', 'tierd', 'captured']);
  const crochet = page.locator('#croche');
  await expect(crochet.locator('.walkthrough')).toHaveCount(0);
  await expect(crochet.getByRole('heading', { name: 'Built for Crochê. Shaped for you.' })).toBeVisible();
  await expect(crochet.locator('.work-fit-card')).toHaveCount(3);
});

for (const width of [320, 390, 768, 1440]) {
  test(`work page layout, imagery and accessibility at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    // The work page follows the theme: 768 and 1440 run at night, so axe checks the night palette's contrast as well.
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: width === 768 || width === 1440 ? 'dark' : 'light' });
    await page.goto('/work/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('.work-entry')).toHaveCount(projects.length);
    // The intro photograph is decorative: hidden from assistive tech and loaded before the fold settles.
    await expect(page.locator('.work-intro-background')).toHaveAttribute('alt', '');
    await expect(page.locator('.work-intro-background')).toHaveJSProperty('complete', true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
    // Showcase art is lazy, so bring each into view before checking it decoded.
    for (const art of await page.locator('.project-art, .walkthrough-frame').all()) await art.scrollIntoViewIfNeeded();
    await expect.poll(() => page.locator('.project-art img, .walkthrough-frame img').evaluateAll(images => images.every(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBeTruthy();
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(accessibility.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
    if (width > 320) {
      mkdirSync('artifacts', { recursive: true });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `artifacts/work-${width}.png`, fullPage: true });
    }
  });
}

test('the work page follows day and night, and its fade lands with the page', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/work/');
  await page.evaluate(() => document.fonts.ready);
  await setTheme(page, 'light');
  const html = page.locator('html');
  const logo = page.locator('.site-header .brand-logo img');
  const color = (selector: string, property = 'color'): Promise<string> => page.locator(selector).first().evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);
  await expect(html).toHaveAttribute('data-themed', '');
  expect(await color('html', 'background-color')).toBe('rgb(255, 255, 255)');
  expect(await color('.work-intro h1')).toBe('rgb(10, 26, 37)');
  await expect.poll(() => logo.evaluate((image: HTMLImageElement) => image.currentSrc)).toContain('logo-ink');
  // Tierd's aurora by day; at night its own accent replaces the pale middle stop.
  await page.locator('#tierd').evaluate(section => window.scrollTo({ top: section.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }));
  await expect(page.locator('.work-aurora')).toHaveAttribute('data-stops', '#FF5A1F,#F1EBDF,#FF5A1F');
  await setTheme(page, 'dark');
  await expect(page.locator('.work-aurora')).toHaveAttribute('data-stops', '#FF5A1F,#FF5A1F,#FF5A1F');
  // Read once, the moment the fade ends: every colour must already have landed. Explicit copy colours used to crawl for
  // seconds behind the page (a root color-scheme change), and so did links that inherit their colour.
  expect(await color('html', 'background-color')).toBe('rgb(10, 26, 37)');
  expect(await color('.work-intro h1')).toBe('rgb(255, 255, 255)');
  expect(await color('.work-fit-card dd')).toBe('rgb(183, 198, 209)');
  expect(await color('.site-header nav a:not([aria-current])')).toBe('rgba(224, 240, 250, 0.8)');
  expect(await color('.project-text-link')).toBe('rgb(255, 255, 255)');
  expect(await color('.work-jump a[aria-current]', 'background-color')).toBe('rgb(255, 255, 255)');
  await expect.poll(() => logo.evaluate((image: HTMLImageElement) => image.currentSrc)).toContain('logo-white');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0A1A25');
  // And back to day.
  await setTheme(page, 'light');
  expect(await color('.work-fit-card dd')).toBe('rgb(66, 84, 95)');
  expect(await color('.work-intro h1')).toBe('rgb(10, 26, 37)');
  await expect(page.locator('.work-aurora')).toHaveAttribute('data-stops', '#FF5A1F,#F1EBDF,#FF5A1F');
  // Pages without a night design keep their paper ground and ink header.
  await setTheme(page, 'dark');
  await page.goto('/about/');
  await expect(html).not.toHaveAttribute('data-themed');
  expect(await color('html', 'background-color')).toBe('rgb(255, 255, 255)');
  await expect.poll(() => logo.evaluate((image: HTMLImageElement) => image.currentSrc)).toContain('logo-ink');
  expect(errors).toEqual([]);
});

test('projects are reachable and readable without JavaScript, and old project URLs forward', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL, reducedMotion: 'reduce' });
  const page = await context.newPage();
  for (const project of projects) {
    await page.goto('/');
    await page.locator('.work-links').getByRole('link', { name: project.client }).click();
    await expect(page).toHaveURL(`/work/#${project.slug}`);
    const section = page.locator(`#${project.slug}`);
    await expect(section.getByRole('heading', { level: 2, name: project.client, exact: true })).toBeVisible();
    await expect(section.locator('.project-detail')).toHaveCount(3);
    // The only island is the decorative background aurora; the projects themselves need no JavaScript.
    await expect(page.locator('astro-island:not(.work-aurora astro-island)')).toHaveCount(0);
    await page.goto(`/work/${project.slug}/`);
    await expect(page).toHaveURL(`/work/#${project.slug}`);
  }
  await context.close();
});

test('project sheets open full size in an accessible lightbox and close again', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/work/');
  await expect(page.locator('#una-adventure .work-tile-sheet')).toHaveCount(0);
  const sheet = page.locator('#tierd .work-tile-sheet').first();
  await sheet.scrollIntoViewIfNeeded();
  await sheet.click();
  const dialog = page.getByRole('dialog', { name: 'Project image' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('figcaption')).toHaveText('Tierd · Brand system');
  await expect(dialog.locator('img')).toHaveJSProperty('complete', true);
  expect(await dialog.locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1800);
  const accessibility = await new AxeBuilder({ page }).include('.work-lightbox').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(sheet).toBeFocused();
  await sheet.click();
  await page.getByRole('button', { name: 'Close image' }).click();
  await expect(dialog).toBeHidden();
});

test('the walkthrough play button is a glass disc at the centre of the 16:9 thumbnail, phones included', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [width, height] of [[1440, 900], [390, 844]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/work/');
    const frame = page.locator('.walkthrough-frame');
    const play = page.locator('.walkthrough-start .walkthrough-play');
    await frame.scrollIntoViewIfNeeded();
    const [box, disc] = [await frame.boundingBox(), await play.boundingBox()];
    expect(Math.abs(disc!.x + disc!.width / 2 - (box!.x + box!.width / 2))).toBeLessThan(2);
    expect(Math.abs(disc!.y + disc!.height / 2 - (box!.y + box!.height / 2))).toBeLessThan(2);
    expect(Math.abs(box!.width / box!.height - 16 / 9)).toBeLessThan(.02);
    expect(await play.evaluate(element => getComputedStyle(element).backdropFilter)).toContain('blur');
  }
  await page.locator('.walkthrough-start').click();
  await expect(page.locator('.walkthrough-start')).toHaveCount(0);
  await expect(page.locator('.walkthrough-frame video')).toBeFocused();
});

test('on phones each project swipes through its pictures, and the bar follows the swipe', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/work/');
  for (const project of projects) {
    const strip = page.locator(`#${project.slug} .work-strip`).first();
    await strip.scrollIntoViewIfNeeded();
    expect(await strip.evaluate(element => element.scrollWidth > element.clientWidth)).toBeTruthy();
    const heights = await strip.locator('.work-tile').evaluateAll(tiles => tiles.map(tile => Math.round(tile.getBoundingClientRect().height)));
    expect(new Set(heights).size).toBe(1);
  }
  const strip = page.locator('#croche .work-strip');
  const bar = page.locator('#croche .swipe-bar').first();
  await expect(bar).toBeVisible();
  await expect(bar.locator('.swipe-count')).toHaveText('01 / 04');
  await strip.evaluate(element => element.scrollTo({ left: element.scrollWidth }));
  await expect(bar.locator('.swipe-count')).toHaveText('04 / 04');
  // The text cards take focus while they scroll, so the keyboard can move them.
  await expect(page.locator('.work-fit-list')).toHaveAttribute('tabindex', '0');
  // The walkthrough chapters and each project's details swipe one card at a time, each with its own bar.
  for (const selector of ['.walkthrough-chapters ol', '#croche .work-details']) {
    const list = page.locator(selector);
    await list.scrollIntoViewIfNeeded();
    expect(await list.evaluate(element => element.scrollWidth > element.clientWidth)).toBeTruthy();
    await expect(list).toHaveAttribute('tabindex', '0');
    const count = page.locator(`${selector} + .swipe-bar .swipe-count`);
    await expect(count).toHaveText(/^01 \/ 0[34]$/);
    await list.evaluate(element => element.scrollTo({ left: element.scrollWidth }));
    await expect(count).toHaveText(/^(0[34]) \/ \1$/);
  }
  // Desktop keeps the gallery grid: no strips, no bars, no extra tab stop.
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('.swipe-bar').first()).toBeHidden();
  expect(await strip.evaluate(element => getComputedStyle(element).display)).toBe('contents');
  await expect(page.locator('.work-fit-list')).not.toHaveAttribute('tabindex', /.*/);
});
