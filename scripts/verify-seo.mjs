import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { loadEnv } from 'vite';

const env = { ...loadEnv('production', process.cwd(), 'PUBLIC_'), ...process.env };
const indexable = env.PUBLIC_SITE_INDEXABLE === 'true';
const html = readFileSync('dist/client/index.html', 'utf8');
const notFound = readFileSync('dist/client/404.html', 'utf8');
const work = readFileSync('dist/client/work/index.html', 'utf8');
/** Every node of a page's JSON-LD, whether published as single objects or one @graph. */
const graphOf = page => [...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(([, content]) => { const data = JSON.parse(content); return data['@graph'] ?? [data]; });
const robots = readFileSync('dist/client/robots.txt', 'utf8');
assert.match(html, /<html[^>]*lang="en-US"/, 'US English language must be declared.');
assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, 'Homepage must have one H1.');
assert.match(html, /<h1[^>]*>[\s\S]*?The best site your business[\s\S]*?<\/h1>/i, 'Primary content must be present in built HTML.');
assert.match(html, /<meta name="description" content="[^"]+"/, 'Description is required.');
assert.match(html, /<meta property="og:title" content="[^"]+"/, 'Social metadata is required.');
assert.match(html, /<a[^>]*href="#main"/, 'Skip link is required.');
assert.ok(existsSync('dist/client/social-card.jpg'), 'Branded social image must ship with the site.');
for (const section of ['process-heading', 'contact-heading']) assert.ok(html.includes(`id="${section}"`), 'Core section copy must be available in the HTML.');
assert.ok(!/\+38%|Shipped since 2019|thousands of orders/.test(html), 'Unverified numerical claims must not be published.');
assert.match(notFound, /name="robots" content="noindex, nofollow"/, '404 must stay noindex.');
assert.match(robots, /User-agent: \*\nAllow: \//, 'Crawlers must be able to see page-level robots directives.');
if (env.PUBLIC_SITE_URL) {
  const origin = new URL(env.PUBLIC_SITE_URL).origin;
  assert.ok(html.includes(`rel="canonical" href="${origin}/"`), 'Canonical must match the configured domain.');
  assert.ok(html.includes(`property="og:image" content="${origin}/social-card.jpg"`), 'Social image must use the configured origin.');
  const homeGraph = graphOf(html);
  const organization = homeGraph.find(node => node['@type'] === 'Organization');
  assert.ok(organization, 'Confirmed organization requires structured data.');
  assert.equal(new URL(organization.url).origin, origin);
  assert.ok(typeof organization.name === 'string' && organization.name.length > 0, 'Organization name must be present.');
  const website = homeGraph.find(node => node['@type'] === 'WebSite');
  assert.ok(website && website.name === organization.name && new URL(website.url).origin === origin, 'Homepage must name the website for search results.');
  // The walkthrough is described for video search, with the facts the page shows.
  const video = graphOf(work).find(node => node['@type'] === 'VideoObject');
  assert.ok(video, '/work/ must describe its walkthrough video.');
  for (const field of ['name', 'description', 'uploadDate', 'contentUrl']) assert.ok(video[field], `VideoObject needs ${field}.`);
  assert.ok(video.thumbnailUrl.every(url => new URL(url).origin === origin), 'Video thumbnails must use the configured origin.');
  assert.ok(work.includes(`property="og:image" content="${origin}/_astro/`), '/work/ shares its walkthrough thumbnail.');
  assert.ok(!notFound.includes('rel="canonical"'), 'The noindex 404 must not declare a canonical.');
} else {
  assert.ok(!html.includes('rel="canonical"'), 'Unconfigured domain must not generate fake canonicals.');
}
if (indexable) {
  assert.match(html, /name="robots" content="index, follow"/);
  assert.ok(existsSync('dist/client/sitemap-index.xml'), 'Production sitemap must exist.');
  const origin = new URL(env.PUBLIC_SITE_URL).origin;
  assert.ok(robots.includes(`Sitemap: ${origin}/sitemap-index.xml`));
  const sitemap = readFileSync('dist/client/sitemap-0.xml', 'utf8');
  assert.ok(sitemap.includes(`<loc>${origin}/</loc>`));
  assert.ok(!sitemap.includes('/404'), '404 must not be listed in sitemap.');
  assert.ok(!/\/work\/[^/<]+\/<\/loc>/.test(sitemap), 'Redirecting /work/<slug>/ pages must not be listed in sitemap.');
  assert.ok(sitemap.includes(`<loc>${origin}/work/</loc>`), '/work/ must be listed in sitemap.');
} else {
  assert.match(html, /name="robots" content="noindex, nofollow"/);
  assert.ok(!existsSync('dist/client/sitemap-index.xml'), 'Unreleased builds must not advertise a sitemap.');
  assert.ok(!robots.includes('Sitemap:'));
}
assert.ok(!/Alex Moreno|Meridian|meridian|example\.com/.test(html), 'Handoff placeholder identities and the former brand must not be published.');
console.log(`SEO checks passed (${indexable ? 'production' : 'preview'} build).`);
