import type { APIRoute } from 'astro';
import { env, waitUntil } from 'cloudflare:workers';
import updates from '../../../public/lupo/updates.json';

export const prerender = false;

/** Crawlers, link previews and command-line tools that fetch the URL without anyone downloading Lupo. The user agent is
 *  only checked here, never stored. */
const notAPerson = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|curl|wget|python-requests|headless/i;

/** The page's Download button. Records one download in D1 (the time and the version), then sends the browser to the
 *  DMG, whose path stays stable for direct links. No IP address, cookie, user agent or referrer is stored. The write
 *  finishes after the redirect is sent, so it never slows the download down. HEAD requests and the agents above are
 *  redirected without being counted. */
export const GET: APIRoute = ({ request, url }) => {
  const counted = request.method === 'GET' && !notAPerson.test(request.headers.get('user-agent') ?? '');
  try {
    const write = counted ? env.DB?.prepare('INSERT INTO lupo_downloads (version) VALUES (?)').bind(updates.version).run() : undefined;
    if (write) waitUntil(write.catch(error => console.error('Lupo download not recorded', error)));
  } catch { /* A failed count never blocks the download. */ }
  return new Response(null, { status: 302, headers: { location: new URL('/lupo/Lupo.dmg', url).href, 'cache-control': 'no-store' } });
};
