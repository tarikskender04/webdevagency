import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

// The form only sends when the build had PUBLIC_ENQUIRY_ENABLED=true. CI builds once each way.
const enquiryEnabled = readFileSync('dist/client/index.html', 'utf8').includes('/api/enquiry/');
const endpoint = '/api/enquiry/';
const valid = { name: 'Jamie Taylor', email: 'jamie@test.invalid', phone: '', business: 'Retail', budget: '$3–6k', timeline: 'ASAP', website: '', elapsed: 9000 };

test('enquiry endpoint accepts only same-origin JSON briefs with offered choices', async ({ request, baseURL }) => {
  const post = (data: unknown, headers: Record<string, string> = {}) => request.post(endpoint, { data, headers: { origin: baseURL!, ...headers } });
  expect((await request.get(endpoint)).status()).toBe(405);
  expect((await post(valid, { origin: 'https://elsewhere.example' })).status()).toBe(403);
  expect((await request.post(endpoint, { data: 'name=Jamie', headers: { 'content-type': 'application/x-www-form-urlencoded' } })).status()).toBe(415);
  expect((await post({ ...valid, email: 'not-an-email' })).status()).toBe(400);
  expect((await post({ ...valid, name: '' })).status()).toBe(400);
  expect((await post({ ...valid, budget: '$1M' })).status()).toBe(400);
  expect((await post({ ...valid, name: 'x'.repeat(101) })).status()).toBe(400);
  expect((await post({ ...valid, name: 'x'.repeat(5000) })).status()).toBe(413);
  // Bots get a success answer and nothing is sent.
  expect(await (await post({ ...valid, website: 'https://spam.example' })).json()).toEqual({ ok: true });
  expect(await (await post({ ...valid, elapsed: 400 })).json()).toEqual({ ok: true });
  // Without RESEND_API_KEY the endpoint says so instead of pretending to deliver.
  const unconfigured = await post(valid);
  expect(unconfigured.status()).toBe(503);
  expect(unconfigured.headers()['cache-control']).toBe('no-store');
});

async function reviewBrief(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('#start').scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island[component-export="ContactForm"]')).not.toHaveAttribute('ssr', '');
  await expect(page.locator('.form-footnote')).toHaveText('Review before sending. Nothing is sent yet.');
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Jamie Taylor');
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('jamie@test.invalid');
  await page.getByRole('button', { name: 'Retail', exact: true }).click();
  await page.getByRole('button', { name: '$3–6k', exact: true }).click();
  await page.getByRole('button', { name: 'Review your brief' }).click();
  await expect(page.getByRole('heading', { name: 'Thanks, Jamie.' })).toBeFocused();
  await expect(page.locator('.brief-review')).toContainText('Nothing has been sent yet.');
  await expect(page.getByRole('link', { name: 'Email your brief' })).toHaveCount(0);
}

test('review sends the brief once and confirms it', async ({ page }) => {
  test.skip(!enquiryEnabled, 'Needs a build with PUBLIC_ENQUIRY_ENABLED=true.');
  const bodies: Record<string, unknown>[] = [];
  await page.route(`**${endpoint}`, async route => { bodies.push(route.request().postDataJSON()); await route.fulfill({ json: { ok: true } }); });
  await reviewBrief(page);
  await page.getByRole('button', { name: 'Send your brief' }).click();
  await expect(page.getByRole('heading', { name: 'Brief sent, Jamie.' })).toBeFocused();
  await expect(page.locator('.brief-review')).toContainText('We will reply to jamie@test.invalid.');
  expect(bodies).toHaveLength(1);
  expect(bodies[0]).toMatchObject({ name: 'Jamie Taylor', email: 'jamie@test.invalid', phone: '', business: 'Retail', budget: '$3–6k', timeline: '', website: '' });
  expect(bodies[0].id).toMatch(/^[0-9a-f-]{36}$/);
  expect(bodies[0].elapsed).toBeGreaterThan(0);
  await expect(page.getByRole('button', { name: 'Send your brief' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Edit details' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Download your brief' })).toBeVisible();
  const axe = await new AxeBuilder({ page }).include('.contact-card').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(axe.violations).toEqual([]);
});

test('a failed send explains itself, offers the email draft and retries with the same brief id', async ({ page }) => {
  test.skip(!enquiryEnabled, 'Needs a build with PUBLIC_ENQUIRY_ENABLED=true.');
  const ids: unknown[] = [];
  await page.route(`**${endpoint}`, async route => {
    ids.push(route.request().postDataJSON().id);
    await route.fulfill(ids.length === 1 ? { status: 502, json: { error: 'delivery' } } : { json: { ok: true } });
  });
  await reviewBrief(page);
  await page.getByRole('button', { name: 'Send your brief' }).click();
  await expect(page.getByRole('alert')).toHaveText('We could not send your brief. Try again, or email it to us instead.');
  const draft = new URL((await page.getByRole('link', { name: 'Email your brief' }).getAttribute('href'))!);
  expect(draft.pathname).toBe('hello@prodigystdio.com');
  await page.getByRole('button', { name: 'Try sending again' }).click();
  await expect(page.getByRole('heading', { name: 'Brief sent, Jamie.' })).toBeVisible();
  expect(ids).toHaveLength(2);
  expect(ids[1]).toBe(ids[0]);
});
