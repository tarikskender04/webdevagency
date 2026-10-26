import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import updates from '../../../public/lupo/updates.json';

export const prerender = false;

/** The page's Download button. Counts one download in Workers Analytics Engine, then sends the browser to the DMG,
 *  whose path stays stable for direct links. The count holds only the version: no IP address, cookie, user agent or
 *  referrer. */
export const GET: APIRoute = ({ url }) => {
  try {
    env.LUPO_DOWNLOADS?.writeDataPoint({ blobs: [updates.version], doubles: [1], indexes: ['dmg'] });
  } catch { /* A failed count never blocks the download. */ }
  return new Response(null, { status: 302, headers: { location: new URL('/lupo/Lupo.dmg', url).href, 'cache-control': 'no-store' } });
};
