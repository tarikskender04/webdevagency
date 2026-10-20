import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, readFileSync } from 'node:fs';

// Builds with PUBLIC_ENQUIRY_ENABLED=true send the brief instead of offering only the local download and email draft.
const enquiryEnabled = readFileSync('dist/client/index.html', 'utf8').includes('/api/enquiry/');
async function ready(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}
async function noOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
}

test('desktop page, in-page links, sections and browser errors', async ({ page }) => {
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
  // Capabilities is detached from the homepage; every in-page link must still land on a section.
  await expect(page.locator('.cap-track')).toHaveCount(0);
  const missingTargets = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map(link => link.getAttribute('href')!.slice(1)).filter(id => id && !document.getElementById(id)));
  expect(missingTargets).toEqual([]);
  await page.getByRole('link', { name: 'See the work' }).click();
  await expect(page).toHaveURL(/#process$/);
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
  test.skip(enquiryEnabled, 'With delivery on, tests/enquiry.spec.ts covers the review step.');
  const requests: string[] = [];
  page.on('request', request => requests.push(`${request.method()} ${request.url()} ${request.postData() || ''}`));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await page.locator('#start').scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island[component-export="ContactForm"]')).not.toHaveAttribute('ssr', '');
  await page.getByRole('button', { name: 'Review your brief' }).click();
  await expect(page.getByRole('alert')).toContainText('Add your name and a valid email');
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Jamie Taylor');
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('jamie@test.invalid');
  await page.getByRole('textbox', { name: 'Phone' }).fill('+1 312 555 0100');
  await page.getByRole('button', { name: 'Restaurant / café', exact: true }).click();
  await page.getByRole('button', { name: '$3–6k', exact: true }).click();
  await page.getByRole('button', { name: '1–2 months', exact: true }).click();
  await page.getByRole('button', { name: 'Review your brief' }).click();
  await expect(page.getByRole('heading', { name: 'Thanks, Jamie.' })).toBeFocused();
  await expect(page.locator('.brief-review')).toContainText('A call has not been booked');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download your brief' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('prodigy-stdio-project-brief.txt');
  const downloaded = readFileSync((await file.path())!, 'utf8');
  expect(downloaded).toContain('Name: Jamie Taylor');
  expect(downloaded).toContain('Phone: +1 312 555 0100');
  expect(downloaded).toContain('Budget: $3–6k');
  expect(downloaded).toContain('Timeline: 1–2 months');
  const emailDraft = new URL((await page.getByRole('link', { name: 'Email your brief' }).getAttribute('href'))!);
  expect(emailDraft.protocol).toBe('mailto:');
  expect(emailDraft.pathname).toBe('hello@prodigystdio.com');
  expect(emailDraft.searchParams.get('body')).toContain('Name: Jamie Taylor');
  await expect(page.getByText('Opens a draft in your email app. You choose whether to send it.')).toBeVisible();
  await page.getByRole('button', { name: 'Edit details' }).click();
  await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('Jamie Taylor');
  await expect(page.getByRole('button', { name: '$3–6k', exact: true })).toHaveAttribute('aria-pressed', 'true');
  // The local-only promise includes URLs, network bodies, cookies and persistent storage.
  expect(requests.join('\n')).not.toMatch(/Jamie|jamie%40|jamie@test|312.*555.*0100/i);
  expect(await page.context().cookies()).toEqual([]);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toMatch(/Jamie|jamie@test|312.*555.*0100/i);
  await page.getByRole('link', { name: 'Privacy & Cookies notice' }).click();
  await expect(page).toHaveURL('/privacy/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy & Cookies');
});

test('phone contact form asks one question per panel, keeps an even gap above Next and keeps choices across Back and Edit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await page.locator('#start').scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island[component-export="ContactForm"]')).not.toHaveAttribute('ssr', '');
  await expect(page.locator('.contact-host')).toBeHidden();
  await expect(page.locator('.contact-steps')).toBeHidden();
  const card = page.locator('.contact-card');
  const status = card.locator('.form-label-stepped');
  const next = card.getByRole('button', { name: /^Next/ });
  const nameInput = page.getByRole('textbox', { name: 'Name', exact: true });
  // Space between the panel's last control and the submit button; it must not grow on shorter panels. The pointer leaves first so the button's hover lift does not count.
  const gapAboveSubmit = async (): Promise<number> => (await page.mouse.move(0, 0), card.evaluate(element => Math.round(element.querySelector('.form-submit')!.getBoundingClientRect().top - element.querySelector('.form-panel.active > :last-child')!.getBoundingClientRect().bottom)));
  await expect(status).toHaveText('Step 1 of 5');
  await expect(page.getByRole('button', { name: 'Retail', exact: true })).toBeHidden();
  await next.click();
  await expect(page.getByRole('alert')).toContainText('Add your name and a valid email');
  await expect(nameInput).toBeFocused();
  await nameInput.fill('Jamie Taylor');
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('jamie@test.invalid');
  const gap = await gapAboveSubmit();
  await page.getByRole('textbox', { name: 'Email', exact: true }).press('Enter');
  await expect(status).toHaveText('Step 2 of 5');
  await expect(page.getByRole('button', { name: 'Restaurant / café', exact: true })).toBeFocused();
  await expect(nameInput).toBeHidden();
  expect(await gapAboveSubmit()).toBe(gap);
  await page.getByRole('button', { name: 'Retail', exact: true }).click();
  await next.click();
  await expect(status).toHaveText('Step 3 of 5');
  expect(await gapAboveSubmit()).toBe(gap);
  await card.getByRole('button', { name: '← Back' }).click();
  await expect(status).toHaveText('Step 2 of 5');
  await expect(page.getByRole('button', { name: 'Retail', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await next.click();
  await page.getByRole('button', { name: '$6–12k', exact: true }).click();
  await next.click();
  await expect(status).toHaveText('Step 4 of 5');
  await expect(next).toHaveCount(0);
  expect(await gapAboveSubmit()).toBe(gap);
  await page.getByRole('button', { name: 'ASAP', exact: true }).click();
  await page.getByRole('button', { name: 'Review your brief' }).click();
  await expect(page.getByRole('heading', { name: 'Thanks, Jamie.' })).toBeFocused();
  await expect(status).toHaveText('Step 5 of 5');
  await expect(page.locator('.brief-review dl')).toContainText('Retail');
  await expect(page.locator('.brief-review dl')).toContainText('$6–12k');
  await expect(page.locator('.brief-review dl')).toContainText('ASAP');
  await page.getByRole('button', { name: 'Edit details' }).click();
  await expect(status).toHaveText('Step 1 of 5');
  await expect(nameInput).toHaveValue('Jamie Taylor');
  await noOverflow(page);
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
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(accessibility.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
    expect(await page.locator('canvas').count()).toBe(0);
  });
}

test('core content remains available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4322/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('The best site');
  await expect(page.locator('#process-heading')).toContainText('opening day');
  // The Process title card only swaps away with JavaScript, so without it the intro shows on its own.
  await expect(page.locator('.portal-title-card')).toBeHidden();
  await expect(page.locator('.portal-inside .lead')).toBeVisible();
  await expect(page.locator('#contact-heading')).toContainText('Tell us about the business');
  await expect(page.getByRole('button', { name: 'Review your brief' })).toBeDisabled();
  await expect(page.locator('#billboard-heading')).toHaveText('Your website is costing you clients.');
  await expect(page.locator('#billboard > .billboard-process .process-closing')).toBeVisible();
  await expect(page.locator('#billboard')).not.toHaveAttribute('data-billboard-portal');
  expect((await page.content()).includes('thousands of orders')).toBeFalsy();
  // Decorative footer lettering must not intercept native links when JavaScript is off.
  await page.getByRole('navigation', { name: 'Legal' }).getByRole('link', { name: 'Privacy & Cookies' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:4322/privacy/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy & Cookies');
  await page.getByRole('navigation', { name: 'Legal' }).getByRole('link', { name: 'Website Terms' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:4322/terms/');
  await page.locator('.site-footer').getByRole('link', { name: 'Studio', exact: true }).click();
  await expect(page).toHaveURL('http://127.0.0.1:4322/about/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The studio');
  await context.close();
});
