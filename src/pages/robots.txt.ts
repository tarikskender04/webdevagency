import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) => {
  const indexable = import.meta.env.PUBLIC_SITE_INDEXABLE === 'true' && Boolean(site);
  // Previews use page-level noindex. Crawlers can still read that directive.
  const lines = ['User-agent: *', 'Allow: /'];
  if (indexable && site) lines.push(`Sitemap: ${new URL('/sitemap-index.xml', site).href}`);
  return new Response(`${lines.join('\n')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
