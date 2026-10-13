import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { loadEnv } from 'vite';

const env = { ...loadEnv('production', process.cwd(), 'PUBLIC_'), ...process.env };
const indexable = env.PUBLIC_SITE_INDEXABLE === 'true';
const html = readFileSync('dist/index.html', 'utf8');
const notFound = readFileSync('dist/404.html', 'utf8');
const robots = readFileSync('dist/robots.txt', 'utf8');
assert.match(html, /<html[^>]*lang="en-US"/, 'US English language must be declared.');
assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, 'Homepage must have one H1.');
assert.match(html, /<h1[^>]*>[\s\S]*?The best site your business[\s\S]*?<\/h1>/i, 'Primary content must be present in built HTML.');
assert.match(html, /<meta name="description" content="[^"]+"/, 'Description is required.');
assert.match(html, /<meta property="og:title" content="[^"]+"/, 'Social metadata is required.');
assert.match(html, /<a[^>]*href="#main"/, 'Skip link is required.');
assert.match(notFound, /name="robots" content="noindex, nofollow"/, '404 must stay noindex.');
assert.match(robots, /User-agent: \*\nAllow: \//, 'Crawlers must be able to see page-level robots directives.');
if (env.PUBLIC_SITE_URL) {
  const origin = new URL(env.PUBLIC_SITE_URL).origin;
  assert.ok(html.includes(`rel="canonical" href="${origin}/"`), 'Canonical must match the configured domain.');
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.ok(blocks.length > 0, 'Confirmed organization requires structured data.');
  for (const [, content] of blocks) {
    const data = JSON.parse(content);
    assert.equal(data['@type'], 'Organization');
    assert.equal(new URL(data.url).origin, origin);
    assert.ok(typeof data.name === 'string' && data.name.length > 0, 'Organization name must be present.');
  }
} else {
  assert.ok(!html.includes('rel="canonical"'), 'Unconfigured domain must not generate fake canonicals.');
}
if (indexable) {
  assert.match(html, /name="robots" content="index, follow"/);
  assert.ok(existsSync('dist/sitemap-index.xml'), 'Production sitemap must exist.');
  const origin = new URL(env.PUBLIC_SITE_URL).origin;
  assert.ok(robots.includes(`Sitemap: ${origin}/sitemap-index.xml`));
  const sitemap = readFileSync('dist/sitemap-0.xml', 'utf8');
  assert.ok(sitemap.includes(`<loc>${origin}/</loc>`));
  assert.ok(!sitemap.includes('/404'), '404 must not be listed in sitemap.');
} else {
  assert.match(html, /name="robots" content="noindex, nofollow"/);
  assert.ok(!existsSync('dist/sitemap-index.xml'), 'Unreleased builds must not advertise a sitemap.');
  assert.ok(!robots.includes('Sitemap:'));
}
assert.ok(!/Alex Moreno|hello@meridian|example\.com/.test(html), 'Handoff placeholder identities must not be published.');
console.log(`SEO checks passed (${indexable ? 'production' : 'preview'} build).`);
