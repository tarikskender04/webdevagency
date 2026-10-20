import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

test('hero stage, work deck and pointer parallax', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The best site your business has ever had');
  await expect(page.locator('.hero-plate')).toHaveJSProperty('complete', true);
  expect(await page.locator('.hero-plate').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  // One card per client, each wearing its logo in the corner; only the card on the pedestal is exposed.
  const deck = page.getByRole('region', { name: 'Selected work' });
  await expect(page.locator('.deck-slot')).toHaveCount(4);
  await expect(page.locator('.deck-slot .deck-badge')).toHaveCount(4);
  await expect(deck.getByRole('group')).toHaveCount(1);
  await expect(deck.getByRole('group', { name: 'Crochê, 1 of 4' })).toContainText('Crochê · brand + site');
  await expect(page.locator('.work-pick')).toHaveText(['Crochê', 'Una Adventure', 'Tierd', 'Captured']);
  await page.waitForTimeout(1800); // Deal-in entrance.
  // The whole composition, including the client strip, sits above the fold on a 1440×900 screen.
  expect(await page.locator('.hero .client-strip').evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(900);
  // Side cards turn toward the centre on a concave arc.
  const angle = (selector: string): Promise<number> => page.locator(selector).evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m13);
  expect(await angle('.deck-slot[data-pos="-1"]')).toBeLessThan(0);
  expect(await angle('.deck-slot[data-pos="1"]')).toBeGreaterThan(0);
  await page.mouse.move(1300, 120);
  await expect.poll(() => page.locator('.hero').evaluate(element => Number(element.style.getPropertyValue('--pointer-x')))).toBeGreaterThan(.3);
  mkdirSync('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/hero-desktop.png' });
  // The active name's underline counts down to the next client.
  await expect(page.locator('.deck-slot[data-pos="0"]')).toHaveClass(/work-una/, { timeout: 9000 });
  await expect(page.getByRole('button', { name: 'Una Adventure' })).toHaveAttribute('aria-current', 'true');
  // Pause holds the deck; a name brings that client to the pedestal.
  await page.getByRole('button', { name: 'Pause selected work' }).click();
  await expect(page.getByRole('button', { name: 'Play selected work' })).toBeVisible();
  await page.getByRole('button', { name: 'Captured' }).click();
  await expect(deck.getByRole('group', { name: 'Captured, 4 of 4' })).toBeVisible();
  await page.mouse.move(1300, 120);
  await page.waitForTimeout(6500);
  await expect(page.locator('.deck-slot[data-pos="0"]')).toHaveClass(/work-captured/);
  // A side card comes forward when clicked; the active card opens its project page.
  await page.locator('.deck-slot[data-pos="1"]').click();
  await expect(page.locator('.deck-slot[data-pos="0"]')).toHaveClass(/work-croche/);
  await page.waitForTimeout(1200);
  await deck.getByRole('link', { name: 'View the Crochê project' }).click();
  await expect(page).toHaveURL(/\/work\/#croche$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Crochê', exact: true })).toBeInViewport();
  expect(errors).toEqual([]);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`hero shows the ${colorScheme} hall for a ${colorScheme} system theme`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/');
    await expect.poll(() => page.locator('.hero-plate').evaluate(image => (image as HTMLImageElement).currentSrc)).toContain(`hall-${colorScheme}`);
    await expect(page.locator('.hero-plate')).toHaveJSProperty('complete', true);
    const accessibility = await new AxeBuilder({ page }).include('.hero').include('.site-header').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(accessibility.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
    mkdirSync('artifacts', { recursive: true });
    await page.screenshot({ path: `artifacts/hero-${colorScheme}.png` });
  });
}

test('stand out band: copy, photo, focus pull, client chips and testimonials', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const band = page.locator('.standout');
  await expect(band.getByRole('heading', { level: 2 })).toHaveText('Stand out with Prodigy Stdio');
  await expect(band.getByRole('link', { name: 'Start a project' })).toHaveAttribute('href', '#start');
  // The whole band, testimonials included, fits one 1440×900 screen.
  expect(await band.evaluate(element => element.getBoundingClientRect().height)).toBeLessThanOrEqual(900);
  await page.locator('.standout-stage').evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const photo = band.getByRole('img', { name: /stands out in a crowd/ });
  await expect.poll(() => photo.evaluate(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  // Scroll-driven: by the time the photo is centred the crowd is out of focus and the tag has landed.
  await expect.poll(() => page.locator('.standout-photo-blur').evaluate(element => Number(getComputedStyle(element).opacity))).toBeGreaterThan(.95);
  await expect.poll(() => page.locator('.standout-tag').evaluate(element => Number(getComputedStyle(element).opacity))).toBeGreaterThan(.95);
  await expect(page.locator('.client-chip')).toHaveText(['Crochê', 'Una Adventure', 'Captured']);
  mkdirSync('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/standout-desktop.png' });
  // Each card carries the client's words, name, signature and faded portrait; none is flagged as a placeholder.
  const cards = band.getByRole('list', { name: 'What clients say' }).getByRole('listitem');
  await expect(cards).toHaveCount(3);
  await expect(band.locator('.quote-person strong')).toHaveText(['Iman', 'Irman', 'Malik']);
  await expect(band.locator('.quote-signature')).toHaveText(['Iman', 'Irman', 'Malik']);
  await expect(band.locator('.quote-flag')).toHaveCount(0);
  for (const portrait of await band.locator('.quote-portrait').all()) {
    await portrait.scrollIntoViewIfNeeded();
    await expect.poll(() => portrait.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    expect(Number(await portrait.evaluate(image => getComputedStyle(image).opacity))).toBeLessThan(.5);
  }
});

test('hero rests at its end state under reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.mouse.move(300, 100);
  expect(await page.locator('.hero').getAttribute('style')).toBeNull();
  expect(await page.evaluate(() => document.getAnimations().filter(animation => (animation.effect as KeyframeEffect | null)?.target?.closest('.hero')).length)).toBe(0);
  const opacities = await page.locator('.hero-copy > *, .deck-float, .hero .client-strip, .standout-photo-blur, .standout-tag').evaluateAll(elements => elements.map(element => getComputedStyle(element).opacity));
  expect(opacities.every(value => value === '1')).toBeTruthy();
  // The work deck never moves on by itself, so it has no pause button, and picking a client is instant.
  await expect(page.locator('.work-toggle')).toBeHidden();
  await page.getByRole('button', { name: 'Tierd' }).click();
  await expect(page.locator('.deck-slot[data-pos="0"]')).toHaveClass(/work-tierd/);
  expect(await page.locator('.deck-slot').evaluateAll(slots => slots.map(slot => getComputedStyle(slot).transitionDuration))).toEqual(['0s', '0s', '0s', '0s']);
  const accessibility = await new AxeBuilder({ page }).include('.hero').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(accessibility.violations).toEqual([]);
});
