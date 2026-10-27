import type { APIRoute } from 'astro';
import { env, waitUntil } from 'cloudflare:workers';
import updates from '../../../public/lupo/updates.json';

export const prerender = false;

/** The page's Download button. Records one download in D1 (the time and the version), then sends the browser to the
 *  DMG, whose path stays stable for direct links. No IP address, cookie, user agent or referrer is stored. The write
 *  finishes after the redirect is sent, so it never slows the download down. */
export const GET: APIRoute = ({ url }) => {
  try {
    const write = env.DB?.prepare('INSERT INTO lupo_downloads (version) VALUES (?)').bind(updates.version).run();
    if (write) waitUntil(write.catch(error => console.error('Lupo download not recorded', error)));
  } catch { /* A failed count never blocks the download. */ }
  return new Response(null, { status: 302, headers: { location: new URL('/lupo/Lupo.dmg', url).href, 'cache-control': 'no-store' } });
};
