import type { APIRoute } from 'astro';
import { env, waitUntil } from 'cloudflare:workers';

export const prerender = false;

/** How long the count may be stale. Visitors read a cached copy, so a busy page costs D1 one query per window per data
 *  centre, not one per view. */
const maxAge = 300;

/** The all-time Lupo download count for the /lupo/ hero: { "downloads": 1234 }. 503 when the database can't be read,
 *  and the page then leaves the label out. */
export const GET: APIRoute = async ({ request }) => {
  const cache = await caches.open('lupo-stats');
  const cached = await cache.match(request);
  if (cached) return cached;
  let downloads: number;
  try {
    const row = await env.DB?.prepare('SELECT COUNT(*) AS downloads FROM lupo_downloads').first<{ downloads: number }>();
    if (!row) throw new Error('No database');
    downloads = row.downloads;
  } catch (error) {
    console.error('Lupo download count unavailable', error);
    return Response.json({ error: 'unavailable' }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
  const response = Response.json({ downloads }, { headers: { 'cache-control': `public, max-age=${maxAge}` } });
  waitUntil(cache.put(request, response.clone()));
  return response;
};
